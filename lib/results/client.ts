"use client";
import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Answers, Skill } from "./types";
import { lifecycle, statusSnapshot, tabId } from "./safety-client";
import { isTestMode, type TestMode } from "./modes";
import {createSaveScheduler} from "./reliability";
import {clientDiagnostic,requestIdentifier} from "./client-diagnostics";
export class RequestError extends Error {
  constructor(message: string, public readonly status: number, public readonly requestId="") {
    super(message);
    this.name = "RequestError";
  }
}
export function retryable(error: unknown) {
 return !(error instanceof RequestError)||error.status<400||error.status===408||error.status===409||error.status===429||error.status>=500;
}

export async function request<T>(url:string,payload?:unknown,method='POST'):Promise<T>{
 const controller=new AbortController(),requestId=requestIdentifier(),started=performance.now();let timeout:ReturnType<typeof setTimeout>|undefined;
 const expired=new Promise<never>((_,reject)=>{timeout=setTimeout(()=>{controller.abort();reject(new RequestError('The server took too long to respond. Your local answers are kept. Please retry.',408,requestId));},15000);});
 const action=async()=>{let response:Response;try{response=await fetch(url,{method,cache:'no-store',signal:controller.signal,headers:{'Content-Type':'application/json','X-IELTS-Tab':tabId(),'X-IELTS-Request-ID':requestId,...(((url.startsWith('/api/attempts/')&&!url.endsWith('/start'))||url==='/api/submissions')&&sessionStorage.getItem('ieltsStudent')?{'X-IELTS-Candidate':sessionStorage.getItem('ieltsStudent')!}:{})},body:method==='GET'?undefined:JSON.stringify(payload)});}catch{throw new RequestError(controller.signal.aborted?'The server took too long to respond. Your local answers are kept. Please retry.':'Unable to connect. Your local answers are kept. Check your connection and try again.',controller.signal.aborted?408:0,requestId);}
 const correlation=response.headers.get('x-ielts-request-id')||requestId;let data:Record<string,unknown>;try{data=await response.json();}catch{throw new RequestError(response.status===401?'Your login session has expired. Please log in again.':response.status===403?'This test is no longer available to your account. Please contact your administrator.':'The server is temporarily unavailable. Your local answers are kept. Please try again.',response.status,correlation);}if(!response.ok)throw new RequestError(typeof data.error==='string'?data.error:'Unable to save. Please retry.',response.status,correlation);return data as T;};
 try{return await Promise.race([action(),expired]);}catch(error){clientDiagnostic(error instanceof RequestError&&error.status===408?'request-timeout':'request-failure',error instanceof RequestError?error.status:0,performance.now()-started,error instanceof RequestError?error.requestId:requestId);throw error;}finally{if(timeout!==undefined)clearTimeout(timeout);}
}

export function draftRevision(test: number|string,skill: string) {
 const key=draftKey(test,`${skill}-revision`),previous=Number(sessionStorage.getItem(key))||0;
 const next=Math.max(previous+1,Date.now()*1000);sessionStorage.setItem(key,String(next));return next;
}
export async function reportSave<T>(test:number|string,revision:number,action:()=>Promise<T>){
 const announce=(status:string)=>window.dispatchEvent(new CustomEvent("ielts:save-status",{detail:{testId:Number(test),revision,status}}));announce("saving");try{const result=await action();announce("saved");if(Math.random()<0.01)clientDiagnostic("save-success");return result;}catch(e){announce("pending");clientDiagnostic("save-failure",e instanceof RequestError?e.status:0,0,e instanceof RequestError?e.requestId:"");throw e;}
}
export async function saveWritingDraft(test: number|string,writing:{task1:string;task2:string}) {
 const id=sessionStorage.getItem(attemptKey(test))||(await ensureAttempt(test)).id;
 sessionStorage.setItem(draftKey(test,"writing"),JSON.stringify(writing));
 const revision=draftRevision(test,"writing");return reportSave(test,revision,()=>request(`/api/attempts/${id}/draft`,{testId:Number(test),...writing,revision},"PATCH"));
}
export function attemptKey(test: number|string) {return `ieltsAttempt:${test}`;}
export function selectedMode(test:number|string):TestMode {
 const query=new URLSearchParams(window.location.search);
 const value=query.get("test")===String(test)?query.get("mode")??"full":sessionStorage.getItem(`ieltsMode:${test}`)??"full";
 return isTestMode(value)?value:"full";
}
export function draftKey(test: number|string,skill: string) {return `ieltsDraft:${sessionStorage.getItem(attemptKey(test)) || "pending"}:${test}:${skill}`;}
export async function beginAttempt(test: number|string) {
  const mode=selectedMode(test);
  const attempt=await request<{id:string;testId:number;mode:TestMode;startedAt:string;studentId:string}>("/api/attempts/start",{testId:Number(test),mode});
  // Re-check identity after server validation, including when a shared browser switches users.
  if(sessionStorage.getItem("ieltsStudent")!==attempt.studentId){for(const key of Object.keys(sessionStorage)){if(key.startsWith("ielts"))sessionStorage.removeItem(key);}sessionStorage.setItem("ieltsStudent",attempt.studentId);}
  sessionStorage.setItem(attemptKey(test),attempt.id);
  sessionStorage.setItem(`ieltsMode:${test}`,attempt.mode);
  await lifecycle(attempt.id,test,"claim");sessionStorage.setItem("ieltsActiveTest",String(test));return attempt;
}

type AttemptIdentity={id:string;testId:number;mode:TestMode;studentId:string;startedAt?:string};
const pendingAttempts=new Map<string,Promise<AttemptIdentity>>();
export async function ensureAttempt(test:number|string):Promise<AttemptIdentity>{
 const mode=selectedMode(test),key=test+':'+mode;let pending=pendingAttempts.get(key);
 if(!pending){const id=sessionStorage.getItem(attemptKey(test)),studentId=sessionStorage.getItem('ieltsStudent');pending=id&&studentId?(async()=>{const state=await lifecycle(id,test,'claim');if(state.testId!==Number(test)||(state.mode&&state.mode!==mode))throw new RequestError('This tab belongs to a different test assignment.',403);sessionStorage.setItem('ieltsActiveTest',String(test));return {id,testId:Number(test),mode,studentId};})():beginAttempt(test);pendingAttempts.set(key,pending);}
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

 useEffect(()=>{
  if(!enabled)return;
  sessionStorage.setItem(draftKey(test,skill),encoded);
  window.dispatchEvent(new Event("ielts:draft-changed"));
 },[encoded,enabled,test,skill]);
 useEffect(()=>{
  if(!enabled)return;

  const scheduler=createSaveScheduler<T>({snapshot:()=>latest.current,save:value=>latest.current.saveValue(value),saved:()=>latest.current.onSaved?.(),failed:error=>latest.current.onError?.(error),retryable:error=>retryable(error)&&!(error instanceof RequestError&&error.status===409&&/time has finished|section is locked|already submitted/i.test(error.message))});
  const tick=()=>scheduler.tick(),flush=()=>scheduler.tick(true),changed=()=>scheduler.changed();
  const timer=window.setInterval(tick,250);window.addEventListener('online',flush);window.addEventListener('ielts:deadline',flush);window.addEventListener('ielts:recovered',flush);window.addEventListener('ielts:draft-changed',changed);
  return()=>{scheduler.stop();window.clearInterval(timer);window.removeEventListener('online',flush);window.removeEventListener('ielts:deadline',flush);window.removeEventListener('ielts:recovered',flush);window.removeEventListener('ielts:draft-changed',changed);};

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
  const apply=(deadline:number,serverNow:number)=>{const estimate=performance.now()+deadline-serverNow;due=due===undefined?estimate:Math.min(due,estimate);tick();};
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
export async function saveSection(skill: Skill,test: number|string,answers: Record<number,string>,finalize=false) {const id=sessionStorage.getItem(attemptKey(test))||(await ensureAttempt(test)).id;sessionStorage.setItem(draftKey(test,skill),JSON.stringify(answers));const revision=draftRevision(test,skill);return reportSave(test,revision,()=>finalize?lifecycle(id,test,"advance",{skill,answers,revision}):request(`/api/attempts/${id}/section`,{testId:Number(test),skill,answers,revision}));}
export function readAnswers(test: number|string,skill: string): Answers {const raw=sessionStorage.getItem(draftKey(test,skill));if(!raw)return {};try{return safeAnswers(JSON.parse(raw));}catch{return {};}}

export function clearCandidateStorage() {for(const key of Object.keys(sessionStorage)){if(key.startsWith("ielts"))sessionStorage.removeItem(key);}}
