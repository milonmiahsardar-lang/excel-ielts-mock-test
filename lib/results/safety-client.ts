"use client";
import { useEffect, useState } from "react";
import { request } from "./client";
import { acceptRecoveryStatus } from "./recovery-policy";
export type AttemptStatus={id:string;testId:number;mode?:import("./modes").TestMode;firstSection?:"listening"|"reading"|"writing";stage:string;pendingSection?:"reading"|"writing"|null;instructionsConfirmed?:boolean;completionAcknowledged?:boolean;section:"listening"|"reading"|"writing"|null;deadline:number|null;leaseExpiresAt?:number;audioPosition:number;audioDuration:number|null;serverNow:number;path:string};
let owner:string|undefined;
const navigationStateKey="ieltsProtectedAttempt";
function savedNavigationStatus():AttemptStatus|null {
 try {
  const saved=JSON.parse(sessionStorage.getItem(navigationStateKey)||"null") as AttemptStatus|null;
  if(!saved||saved.stage==="NOT_STARTED"||saved.stage==="COMPLETED"||
     sessionStorage.getItem("ieltsAttempt:"+saved.testId)!==saved.id)return null;
  const target=new URL(saved.path,location.origin);
  if(target.origin!==location.origin||!["/listening","/listening/instructions","/test","/test/writing"].includes(target.pathname))return null;
  return saved;
 }catch{return null;}
}
let current:AttemptStatus|null=null;
if(typeof window!=="undefined"){
 const navigation=performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming|undefined;
 if(navigation?.type==="reload"||navigation?.type==="back_forward")current=savedNavigationStatus();
 // A cached homepage has its own older JS memory. Restore the latest state
 // and ownership from this tab before its recovery requests run again.
 window.addEventListener("pageshow",event=>{
  if(!event.persisted)return;
  try{owner=sessionStorage.getItem("ieltsReloadOwner")||undefined;}catch{owner=undefined;}
  current=savedNavigationStatus();
  window.dispatchEvent(new Event("ielts:lifecycle"));
 });
}
export function tabId(){
 const key="ieltsReloadOwner";
 if(owner){try{sessionStorage.setItem(key,owner);}catch{}return owner;}
 // Reload and same-tab history restoration retain document ownership.
 // A new navigation or duplicated tab receives a new identity.
 const navigation=performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming|undefined;
 try{
  const previous=sessionStorage.getItem(key);
  if((navigation?.type==="reload"||navigation?.type==="back_forward")&&previous&&/^[a-f0-9-]{36}$/.test(previous))return owner=previous;
 }catch{}
 // randomUUID requires HTTPS, but classroom computers also connect over HTTP.
 const bytes=crypto.getRandomValues(new Uint8Array(16));
 bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const hex=Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
 owner=`${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
 try{sessionStorage.setItem(key,owner);}catch{}
 return owner;
}
export function statusSnapshot(){return current;}
export function publishStatus(value:AttemptStatus){
 if(!acceptRecoveryStatus(current,value))return;
 current=value;
 try{
  if(value.stage!=="NOT_STARTED"&&value.stage!=="COMPLETED")sessionStorage.setItem(navigationStateKey,JSON.stringify(value));
  else sessionStorage.removeItem(navigationStateKey);
 }catch{}
 window.dispatchEvent(new Event("ielts:lifecycle"));
}
export function clearStatus(){current=null;try{sessionStorage.removeItem(navigationStateKey);}catch{}window.dispatchEvent(new Event("ielts:lifecycle"));}
export function useAttemptStatus(){const [state,setState]=useState<AttemptStatus|null>(null);useEffect(()=>{const update=()=>setState(current);update();window.addEventListener("ielts:lifecycle",update);return()=>window.removeEventListener("ielts:lifecycle",update);},[]);return state;}
export async function lifecycle(id:string,test:number|string,action:string,extra:Record<string,unknown>={},options?:{forceLease?:boolean}){
 const state=await request<AttemptStatus>(`/api/attempts/${id}/lifecycle`,{testId:Number(test),tabId:tabId(),action,...extra},'POST',options);publishStatus(state);return current?.id===state.id?current:state;
}
export function requestTestFullscreen(){
 if(document.fullscreenElement)return Promise.resolve();
 if(!document.documentElement.requestFullscreen)return Promise.reject(new Error("This browser does not support fullscreen tests. Please use Chrome or Firefox."));
 return document.documentElement.requestFullscreen();
}
export async function finishTestSafety(){clearStatus();sessionStorage.removeItem("ieltsActiveTest");if(document.fullscreenElement)await document.exitFullscreen().catch(()=>{});}
