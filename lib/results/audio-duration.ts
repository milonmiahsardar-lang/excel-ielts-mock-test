import "server-only";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { reject } from "./http";

const cached=new Map<number,{stamp:number;duration:number}>();
// Read MPEG Layer III frames from the actual recording, including VBR files.
// Client-provided metadata never determines the minimum listening duration.
export function recordingDuration(test:number) {
 const path=resolve(`public/audio/listening-test-${test}.mp3`);
 let stamp:number;try{stamp=statSync(path).mtimeMs;}catch{reject(409,"The listening recording is unavailable. Please contact a staff member.");}
 const previous=cached.get(test);if(previous?.stamp===stamp)return previous.duration;
 const bytes=readFileSync(path);let offset=0,seconds=0,frames=0;
 if(bytes.toString("ascii",0,3)==="ID3"&&bytes.length>=10)offset=10+((bytes[6]&127)<<21)+((bytes[7]&127)<<14)+((bytes[8]&127)<<7)+(bytes[9]&127)+(bytes[5]&16?10:0);
 const rates1=[0,32,40,48,56,64,80,96,112,128,160,192,224,256,320];
 const rates2=[0,8,16,24,32,40,48,56,64,80,96,112,128,144,160];
 while(offset+4<=bytes.length){
  const header=bytes.readUInt32BE(offset),version=(header>>>19)&3,layer=(header>>>17)&3,index=(header>>>12)&15,sampleIndex=(header>>>10)&3;
  if((header>>>21)!==2047||version===1||layer!==1||index===0||index===15||sampleIndex===3){offset++;continue;}
  const sample=[44100,48000,32000][sampleIndex]/(version===3?1:version===2?2:4);
  const bitrate=(version===3?rates1:rates2)[index]*1000;
  const length=Math.floor((version===3?144:72)*bitrate/sample)+((header>>>9)&1);
  if(length<4||offset+length>bytes.length)break;
  seconds+=(version===3?1152:576)/sample;frames++;offset+=length;
 }
 if(frames<2||!Number.isFinite(seconds)||seconds<1)reject(409,"The listening recording could not be validated. Please contact a staff member.");
 cached.set(test,{stamp,duration:seconds});return seconds;
}
