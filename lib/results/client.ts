"use client";
import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Answers, Skill } from "./types";
import { lifecycle, tabId } from "./safety-client";
export async function request<T>(url: string,payload?: unknown,method="POST"): Promise<T> {
  let response:Response;
  try{response=await fetch(url,{method,cache:"no-store",headers:{"Content-Type":"application/json","X-IELTS-Tab":tabId(),...((url.startsWith("/api/attempts/")&&!url.endsWith("/start"))||url==="/api/submissions")&&sessionStorage.getItem("ieltsStudent")?{"X-IELTS-Candidate":sessionStorage.getItem("ieltsStudent")!}:{}},body:method==="GET"?undefined:JSON.stringify(payload)});}
  catch{throw new Error("Unable to connect. Your local answers are kept. Check your connection and try again.");}
  let data:Record<string,unknown>;
  try{data=await response.json();}catch{throw new Error("The server is temporarily unavailable. Your local answers are kept. Please try again.");}
  if(!response.ok)throw new Error(typeof data.error==="string"?data.error:"Unable to save. Please retry.");return data as T;
}
export function attemptKey(test: number|string) {return `ieltsAttempt:${test}`;}
export function draftKey(test: number|string,skill: string) {return `ieltsDraft:${sessionStorage.getItem(attemptKey(test)) || "pending"}:${test}:${skill}`;}
export async function beginAttempt(test: number|string) {
  const attempt=await request<{id:string;testId:number;startedAt:string;studentId:string}>("/api/attempts/start",{testId:Number(test)});
  // Re-check identity after server validation, including when a shared browser switches users.
  if(sessionStorage.getItem("ieltsStudent")!==attempt.studentId){for(const key of Object.keys(sessionStorage)){if(key.startsWith("ielts"))sessionStorage.removeItem(key);}sessionStorage.setItem("ieltsStudent",attempt.studentId);}
  sessionStorage.setItem(attemptKey(test),attempt.id);
  await lifecycle(attempt.id,test,"claim");sessionStorage.setItem("ieltsActiveTest",String(test));return attempt;
}
const pendingAttempts=new Map<string,ReturnType<typeof beginAttempt>>();
export async function ensureAttempt(test: number|string) {
 const key=String(test);let pending=pendingAttempts.get(key);
 if(!pending){pending=beginAttempt(test);pendingAttempts.set(key,pending);}
 try{return await pending;}finally{if(pendingAttempts.get(key)===pending)pendingAttempts.delete(key);}
}
export type Draft={listening:Answers;reading:Answers;writing:{task1:string;task2:string}};
export async function resumeDraft(test:number|string) {
 const attempt=await ensureAttempt(test),draft=await request<Draft>(`/api/attempts/${attempt.id}/draft`,undefined,"GET");
 for(const skill of ["listening","reading"] as const){const key=draftKey(test,skill);if(!sessionStorage.getItem(key))sessionStorage.setItem(key,JSON.stringify(draft[skill]));}
 return draft;
}
export function safeAnswers(value:unknown):Record<number,string> {
 const result:Record<number,string>={};if(!value||typeof value!=="object"||Array.isArray(value))return result;
 for(const [key,answer] of Object.entries(value)){if(!/^(?:[1-9]|[1-3]\d|40)$/.test(key))continue;if(typeof answer==="string")result[Number(key)]=answer;else if(Number(key)===34&&Array.isArray(answer)){answer.slice(0,3).forEach((a,i)=>{if(typeof a==="string")result[34+i]=a;});}}
 return result;
}
export function useAnswerDraft(skill: Skill,test: number|string,answers: Record<number,string>,setAnswers: Dispatch<SetStateAction<Record<number,string>>>,enabled=true) {
  const ready=useRef(false),[loaded,setLoaded]=useState(false);
  useEffect(()=>{let active=true;ready.current=false;
    if(!enabled)return;
    void resumeDraft(test).then(draft=>{if(!active)return;const raw=sessionStorage.getItem(draftKey(test,skill));let saved=draft[skill];if(raw){try{saved=safeAnswers(JSON.parse(raw));}catch{}}setAnswers(saved);ready.current=true;setLoaded(true);}).catch(()=>{/* The shared recovery overlay retries safely without discarding local answers. */});
    return()=>{active=false;};
  },[skill,test,setAnswers,enabled]);
  useEffect(()=>{if(!enabled||!ready.current||!loaded)return;
    sessionStorage.setItem(draftKey(test,skill),JSON.stringify(answers));
    const save=()=>{void saveSection(skill,test,answers).catch(()=>{/* Local recovery remains available when offline. */});};
    const timer=window.setTimeout(save,650);window.addEventListener("online",save);
    window.addEventListener("ielts:deadline",save);
    return()=>{window.clearTimeout(timer);window.removeEventListener("online",save);window.removeEventListener("ielts:deadline",save);};
  },[answers,skill,test,enabled,loaded]);
  return loaded;
}
export function useCountdown(test:number|string,skill:"reading"|"writing",enabled=true) {
 const [remaining,setRemaining]=useState(3600);
 useEffect(()=>{let active=true,timer:number|undefined;
  if(!enabled)return;
  void ensureAttempt(test).then(async attempt=>{const {deadline,serverNow}=await request<{deadline:number;serverNow:number}>(`/api/attempts/${attempt.id}/clock`,{testId:Number(test),skill});if(!active)return;const key=draftKey(test,`${skill}-deadline`);sessionStorage.setItem(key,String(deadline));const due=performance.now()+deadline-serverNow;const tick=()=>setRemaining(Math.max(0,Math.min(3600,Math.ceil((due-performance.now())/1000))));tick();timer=window.setInterval(tick,1000);}).catch(()=>{});
  return()=>{active=false;if(timer!==undefined)window.clearInterval(timer);};
 },[test,skill,enabled]);return remaining;
}
export async function saveSection(skill: Skill,test: number|string,answers: Record<number,string>,finalize=false) {const id=sessionStorage.getItem(attemptKey(test))||(await ensureAttempt(test)).id;sessionStorage.setItem(draftKey(test,skill),JSON.stringify(answers));if(finalize)await lifecycle(id,test,"advance",{skill,answers});else await request(`/api/attempts/${id}/section`,{testId:Number(test),skill,answers});}
export function readAnswers(test: number|string,skill: string): Answers {const raw=sessionStorage.getItem(draftKey(test,skill));if(!raw)return {};try{return safeAnswers(JSON.parse(raw));}catch{return {};}}

export function clearCandidateStorage() {for(const key of Object.keys(sessionStorage)){if(key.startsWith("ielts"))sessionStorage.removeItem(key);}}
