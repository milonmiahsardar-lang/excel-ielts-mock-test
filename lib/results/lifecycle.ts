import "server-only";
import { db } from "./db";
import { reject, text } from "./http";
import { recordingDuration } from "./audio-duration";

export type Stage="NOT_STARTED"|"LISTENING_ACTIVE"|"LISTENING_COMPLETED"|"READING_ACTIVE"|"READING_COMPLETED"|"WRITING_ACTIVE"|"COMPLETED";
export type Progress={attempt_id:string;stage:Stage;deadline:number|null;audio_duration:number|null;audio_position:number;audio_observed_at:number|null;lease_owner:string|null;lease_until:number};
export function progress(row:Record<string,unknown>):Progress {
 let state=db().prepare("SELECT * FROM attempt_progress WHERE attempt_id=?").get(String(row.id));
 if(!state){
  const draft=row.data?JSON.parse(String(row.data)):{};
  // Existing attempts keep their section and original deadline; no answers are rewritten.
  const stage:Stage=row.submitted_at?"COMPLETED":draft.sectionClocks?.writing||draft.writingDraft?"WRITING_ACTIVE":draft.sectionClocks?.reading||draft.reading?"READING_ACTIVE":"NOT_STARTED";
  const deadline=stage==="WRITING_ACTIVE"?draft.sectionClocks?.writing:stage==="READING_ACTIVE"?draft.sectionClocks?.reading:null;
  db().prepare("INSERT OR IGNORE INTO attempt_progress(attempt_id,stage,deadline) VALUES(?,?,?)").run(String(row.id),stage,deadline??null);
  state=db().prepare("SELECT * FROM attempt_progress WHERE attempt_id=?").get(String(row.id));
 }
 const result=state as unknown as Progress;
 if(result.stage==="READING_ACTIVE"&&result.deadline&&result.deadline<=Date.now()){
  db().prepare("UPDATE attempt_progress SET stage='READING_COMPLETED' WHERE attempt_id=? AND stage='READING_ACTIVE'").run(String(row.id));result.stage="READING_COMPLETED";
 }
 return result;
}
export function sectionFor(stage:Stage):"listening"|"reading"|"writing"|null {
 if(stage.startsWith("LISTENING"))return "listening";
 if(stage.startsWith("READING"))return "reading";
 return stage==="WRITING_ACTIVE"?"writing":null;
}
export function progressPath(state:Progress,test:number) {
 const section=sectionFor(state.stage);
 return section==="writing"?`/test/writing?test=${test}`:section==="reading"?`/test?test=${test}`:section==="listening"?`/listening?test=${test}&autoplay=true`:`/listening/instructions?test=${test}`;
}
export function requireSection(row:Record<string,unknown>,skill:string) {
 const state=progress(row);
 if(row.submitted_at||state.stage==="COMPLETED")reject(409,"This test has already been submitted.");
 if(sectionFor(state.stage)!==skill)reject(409,"This section is locked. Return to your current test section.");
 return state;
}
export function claimLease(row:Record<string,unknown>,ownerValue:unknown) {
 const owner=text(ownerValue,80,true),state=progress(row),now=Date.now();
 if(state.lease_owner&&state.lease_owner!==owner&&state.lease_until>now)reject(409,"This test is active in another tab. Close that tab, then retry here.");
 db().prepare("UPDATE attempt_progress SET lease_owner=?,lease_until=? WHERE attempt_id=?").run(owner,now+20000,String(row.id));
 return progress(row);
}
export function requireLease(row:Record<string,unknown>,owner:unknown) {
 const state=progress(row);
 if(typeof owner!=="string"||state.lease_owner!==owner||state.lease_until<=Date.now())reject(409,"Your test tab is not active. Return to the active tab or retry recovery.");
 return state;
}
export function activateListening(row:Record<string,unknown>) {
 const state=progress(row);
 if(state.stage!=="NOT_STARTED")return state;
 const duration=recordingDuration(Number(row.test_id));
 db().prepare("UPDATE attempt_progress SET stage='LISTENING_ACTIVE',audio_duration=?,audio_observed_at=? WHERE attempt_id=?").run(duration,Date.now(),String(row.id));
 return progress(row);
}
export function observeAudio(row:Record<string,unknown>,position:unknown,ended:unknown) {
 const state=requireSection(row,"listening");if(state.stage==="LISTENING_COMPLETED")return state;
 if(typeof position!=="number"||!Number.isFinite(position)||position<0)reject(400,"Invalid audio progress.");
 const now=Date.now(),elapsed=Math.max(0,(now-(state.audio_observed_at??now))/1000);
 const duration=state.audio_duration!;
 // Credit only contiguous playback at normal speed. Seeking ahead, stale tabs,
 // fabricated short durations, and a single ended event cannot unlock Reading.
 if(position>state.audio_position+Math.min(elapsed,15)+2)reject(409,"The recording must play without skipping. Your saved playback position is safe.");
 const verified=Math.max(state.audio_position,Math.min(position,state.audio_position+Math.min(elapsed,15),duration));
 const completed=ended===true&&position>=duration-1&&verified>=duration-1;
 db().prepare("UPDATE attempt_progress SET audio_position=?,audio_observed_at=?,stage=? WHERE attempt_id=?").run(verified,now,completed?"LISTENING_COMPLETED":"LISTENING_ACTIVE",String(row.id));
 if(ended===true&&!completed)reject(409,"Listening is not yet complete. Return to the saved audio position and finish the recording.");
 return progress(row);
}
export function transition(row:Record<string,unknown>,skill:"listening"|"reading") {
 const state=requireSection(row,skill),now=Date.now();
 if(skill==="listening"&&state.stage!=="LISTENING_COMPLETED")reject(409,"Please finish the listening recording before continuing to Reading.");
 if(skill==="reading"&&(!state.deadline||state.deadline>now))reject(409,"Writing unlocks when the Reading time has finished.");
 db().prepare("UPDATE attempt_progress SET stage=?,deadline=? WHERE attempt_id=?").run(skill==="listening"?"READING_ACTIVE":"WRITING_ACTIVE",now+3600000,String(row.id));
 return progress(row);
}
export function publicProgress(row:Record<string,unknown>) {
 const state=progress(row);return {id:String(row.id),testId:Number(row.test_id),stage:state.stage,section:sectionFor(state.stage),deadline:state.deadline,audioPosition:state.audio_position,audioDuration:state.audio_duration,serverNow:Date.now(),path:progressPath(state,Number(row.test_id))};
}
