"use client";
import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Answers, Skill } from "./types";
import { lifecycle, statusSnapshot, tabId } from "./safety-client";
export class RequestError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "RequestError";
  }
}
export function retryable(error: unknown) {
 return !(error instanceof RequestError)||error.status<400||error.status===408||error.status===409||error.status===429||error.status>=500;
}
export async function request<T>(url: string,payload?: unknown,method="POST"): Promise<T> {
 const controller=new AbortController(),timeout=window.setTimeout(()=>controller.abort(),15000);
 try {
  let response:Response;
  try{response=await fetch(url,{method,cache:"no-store",signal:controller.signal,headers:{"Content-Type":"application/json","X-IELTS-Tab":tabId(),...((url.startsWith("/api/attempts/")&&!url.endsWith("/start"))||url==="/api/submissions")&&sessionStorage.getItem("ieltsStudent")?{"X-IELTS-Candidate":sessionStorage.getItem("ieltsStudent")!}:{}},body:method==="GET"?undefined:JSON.stringify(payload)});}
  catch{throw new Error(controller.signal.aborted?"The server took too long to respond. Your local answers are kept. Please retry.":"Unable to connect. Your local answers are kept. Check your connection and try again.");}
  let data:Record<string,unknown>;
  try{data=await response.json();}catch{throw new RequestError(response.status===401?"Your login session has expired. Please log in again.":response.status===403?"This test is no longer available to your account. Please contact your administrator.":"The server is temporarily unavailable. Your local answers are kept. Please try again.",response.status);}
  if(!response.ok)throw new RequestError(typeof data.error==="string"?data.error:"Unable to save. Please retry.",response.status);return data as T;
 } finally {window.clearTimeout(timeout);}
}
export function draftRevision(test: number|string,skill: string) {
 const key=draftKey(test,`${skill}-revision`),previous=Number(sessionStorage.getItem(key))||0;
 const next=Math.max(previous+1,Date.now()*1000);sessionStorage.setItem(key,String(next));return next;
}
export async function reportSave<T>(test:number|string,revision:number,action:()=>Promise<T>){
 const announce=(status:string)=>window.dispatchEvent(new CustomEvent("ielts:save-status",{detail:{testId:Number(test),revision,status}}));announce("saving");try{const result=await action();announce("saved");return result;}catch(e){announce("pending");throw e;}
}
export async function saveWritingDraft(test: number|string,writing:{task1:string;task2:string}) {
 const id=sessionStorage.getItem(attemptKey(test))||(await ensureAttempt(test)).id;
 sessionStorage.setItem(draftKey(test,"writing"),JSON.stringify(writing));
 const revision=draftRevision(test,"writing");return reportSave(test,revision,()=>request(`/api/attempts/${id}/draft`,{testId:Number(test),...writing,revision},"PATCH"));
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
// The scheduler survives edits, so continuous typing cannot postpone every save.
export function useDraftAutosave<T>(test:number|string,skill:string,value:T,enabled:boolean,saveValue:(value:T)=>Promise<unknown>,onError?:(error:unknown)=>void,onSaved?:()=>void) {
 const encoded=JSON.stringify(value);
 const latest=useRef({value,encoded,saveValue,onError,onSaved});
 latest.current={value,encoded,saveValue,onError,onSaved};
 const changedAt=useRef(0);
 useEffect(()=>{
  if(!enabled)return;
  sessionStorage.setItem(draftKey(test,skill),encoded);
  changedAt.current=performance.now();
 },[encoded,enabled,test,skill]);
 useEffect(()=>{
  if(!enabled)return;
  let active=true,busy=false,stopped=false,acknowledged:string|null=null,lastAttempt=performance.now(),retryAfter=0,forcePending=false;
  const save=(force=false)=>{
   if(!active||stopped)return;
   if(busy){if(force)forcePending=true;return;}
   const snapshot=latest.current;
   if(snapshot.encoded===acknowledged)return;
   const now=performance.now();
   if(!force&&now<retryAfter)return;
   if(!force&&now-changedAt.current<650&&now-lastAttempt<5000)return;
   busy=true;lastAttempt=now;
   void snapshot.saveValue(snapshot.value).then(()=>{
    if(!active)return;
    acknowledged=snapshot.encoded;retryAfter=0;
    // A response for an earlier snapshot must not clear a newer save error.
    if(latest.current.encoded===snapshot.encoded)latest.current.onSaved?.();
   }).catch(error=>{
    if(!active)return;
    stopped=!retryable(error)||(error instanceof RequestError&&error.status===409&&/time has finished|section is locked|already submitted/i.test(error.message));
    retryAfter=performance.now()+5000;
    latest.current.onError?.(error);
   }).finally(()=>{
    busy=false;
    if(active&&forcePending){forcePending=false;save(true);}
   });
  };
  const tick=()=>save(),flush=()=>save(true);
  const timer=window.setInterval(tick,250);
  window.addEventListener("online",flush);window.addEventListener("ielts:deadline",flush);
  return()=>{active=false;window.clearInterval(timer);window.removeEventListener("online",flush);window.removeEventListener("ielts:deadline",flush);};
 },[enabled,test,skill]);
}
export function useAnswerDraft(skill: Skill,test: number|string,answers: Record<number,string>,setAnswers: Dispatch<SetStateAction<Record<number,string>>>,enabled=true) {
 const ready=useRef(false),[loaded,setLoaded]=useState(false);
 useEffect(()=>{
  let active=true,retry:number|undefined;ready.current=false;setLoaded(false);
  if(!enabled)return;
  const load=()=>{void resumeDraft(test).then(draft=>{
   if(!active)return;const raw=sessionStorage.getItem(draftKey(test,skill));let saved=draft[skill];
   if(raw){try{saved=safeAnswers(JSON.parse(raw));}catch{}}
   setAnswers(saved);ready.current=true;setLoaded(true);
  }).catch(error=>{if(active&&retryable(error))retry=window.setTimeout(load,5000);});};
  load();return()=>{active=false;window.clearTimeout(retry);};
 },[skill,test,setAnswers,enabled]);
 useDraftAutosave(test,skill,answers,enabled&&loaded, value=>saveSection(skill,test,value));
 return loaded;
}
export function useCountdown(test:number|string,skill:"reading"|"writing",enabled=true) {
 const [remaining,setRemaining]=useState(3600);
 useEffect(()=>{
  if(!enabled)return;
  let active=true,due:number|undefined,retry:number|undefined;
  const tick=()=>{if(due!==undefined)setRemaining(Math.max(0,Math.min(3600,Math.ceil((due-performance.now())/1000))));};
  const apply=(deadline:number,serverNow:number)=>{due=performance.now()+deadline-serverNow;tick();};
  const status=()=>{
   const state=statusSnapshot();
   if(state&&state.testId===Number(test)&&state.section===skill&&state.deadline!==null)apply(state.deadline,state.serverNow);
  };
  const sync=()=>{void ensureAttempt(test).then(async attempt=>{
   if(!active)return;
   const {deadline,serverNow}=await request<{deadline:number;serverNow:number}>(`/api/attempts/${attempt.id}/clock`,{testId:Number(test),skill});
   if(!active)return;sessionStorage.setItem(draftKey(test,`${skill}-deadline`),String(deadline));apply(deadline,serverNow);
  }).catch(error=>{if(active&&retryable(error))retry=window.setTimeout(sync,5000);});};
  sync();const timer=window.setInterval(tick,1000);window.addEventListener("ielts:lifecycle",status);
  return()=>{active=false;window.clearTimeout(retry);window.clearInterval(timer);window.removeEventListener("ielts:lifecycle",status);};
 },[test,skill,enabled]);return remaining;
}
export async function saveSection(skill: Skill,test: number|string,answers: Record<number,string>,finalize=false) {const id=sessionStorage.getItem(attemptKey(test))||(await ensureAttempt(test)).id;sessionStorage.setItem(draftKey(test,skill),JSON.stringify(answers));const revision=draftRevision(test,skill);await reportSave(test,revision,()=>finalize?lifecycle(id,test,"advance",{skill,answers,revision}):request(`/api/attempts/${id}/section`,{testId:Number(test),skill,answers,revision}));}
export function readAnswers(test: number|string,skill: string): Answers {const raw=sessionStorage.getItem(draftKey(test,skill));if(!raw)return {};try{return safeAnswers(JSON.parse(raw));}catch{return {};}}

export function clearCandidateStorage() {for(const key of Object.keys(sessionStorage)){if(key.startsWith("ielts"))sessionStorage.removeItem(key);}}
