import "server-only";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { db } from "./db";
import { reject } from "./http";
export function testReadiness(test:number){
 const keys=db().prepare("SELECT skill,config FROM answer_keys WHERE test_id=?").all(test);
 const complete=(skill:string)=>{const row=keys.find(r=>r.skill===skill);if(!row)return false;try{const c=JSON.parse(String(row.config));return c.approved===true&&Array.from({length:40},(_,i)=>c.questions?.[i+1]?.accepted?.length).every(Boolean);}catch{return false;}};
 const file=resolve(`public/audio/listening-test-${test}.mp3`);let audio=false;try{audio=existsSync(file)&&statSync(file).size>0;}catch{}
 const listening=complete("listening"),reading=complete("reading");return {testId:test,audio,listening,reading,ready:audio&&listening&&reading};
}
export function requireReady(test:number){if(!testReadiness(test).ready)reject(409,"This test is not ready yet. Its approved answer keys or Listening audio are missing. Please contact your administrator.");}
