"use client";
import { useEffect, useState } from "react";
import { request } from "./client";
export type AttemptStatus={id:string;testId:number;stage:string;section:"listening"|"reading"|"writing"|null;deadline:number|null;audioPosition:number;audioDuration:number|null;serverNow:number;path:string};
let owner:string|undefined;
let current:AttemptStatus|null=null;
export function tabId(){return owner??=crypto.randomUUID();}
export function statusSnapshot(){return current;}
export function publishStatus(value:AttemptStatus){current=value;window.dispatchEvent(new Event("ielts:lifecycle"));}
export function clearStatus(){current=null;window.dispatchEvent(new Event("ielts:lifecycle"));}
export function useAttemptStatus(){const [state,setState]=useState<AttemptStatus|null>(null);useEffect(()=>{const update=()=>setState(current);update();window.addEventListener("ielts:lifecycle",update);return()=>window.removeEventListener("ielts:lifecycle",update);},[]);return state;}
export async function lifecycle(id:string,test:number|string,action:string,extra:Record<string,unknown>={}){
 const state=await request<AttemptStatus>(`/api/attempts/${id}/lifecycle`,{testId:Number(test),tabId:tabId(),action,...extra});publishStatus(state);return state;
}
export function requestTestFullscreen(){
 if(document.fullscreenElement)return Promise.resolve();
 if(!document.documentElement.requestFullscreen)return Promise.reject(new Error("This browser does not support fullscreen tests. Please use Chrome or Firefox."));
 return document.documentElement.requestFullscreen();
}
export async function finishTestSafety(){clearStatus();sessionStorage.removeItem("ieltsActiveTest");if(document.fullscreenElement)await document.exitFullscreen().catch(()=>{});}
