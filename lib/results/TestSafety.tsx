"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { attemptKey, draftKey, ensureAttempt } from "./client";
import { requestTestFullscreen, tabId, useAttemptStatus } from "./safety-client";

export default function TestSafety({children}:{children:React.ReactNode}){
 const path=usePathname(),query=useSearchParams(),router=useRouter(),state=useAttemptStatus();
 const [fullscreen,setFullscreen]=useState(true),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [recovery,setRecovery]=useState(0),hadError=useRef(false);
 const active=!!state&&state.stage!=="NOT_STARTED"&&state.stage!=="COMPLETED"&&!path.startsWith("/admin")&&!path.startsWith("/test/writing/result");
 useEffect(()=>{
  if(path.startsWith("/admin")||path.startsWith("/test/writing/result"))return;
  const selected=query.get("test")||sessionStorage.getItem("ieltsActiveTest");
  const actual=path==="/listening"||path==="/test"||path==="/test/writing";
  if(!selected||(!actual&&!sessionStorage.getItem(attemptKey(selected))))return;
  let live=true;
  const recover=()=>{void ensureAttempt(selected).then(()=>{if(live){setError("");if(hadError.current){hadError.current=false;setRecovery(v=>v+1);}}}).catch(e=>{if(live){hadError.current=true;setError((e as Error).message);}});};
  recover();const timer=window.setInterval(recover,5000);
  return()=>{live=false;window.clearInterval(timer);};
 },[path,query]);
 useEffect(()=>{
  if(!active||!state)return;
  // One bounded guard entry per attempt catches an accidental Back click.
  // Recovery and server section guards remain authoritative; no history loop.
  const guard=`ieltsNavigationGuard:${state.id}`;
  if(!sessionStorage.getItem(guard)){
   sessionStorage.setItem(guard,"1");history.pushState({...history.state,ieltsAttemptGuard:state.id},"",location.href);
  }
  const expected=new URL(state.path,location.origin);
  if(path!==expected.pathname||query.get("test")!==String(state.testId))router.replace(state.path);
 },[active,path,query,router,state]);
 useEffect(()=>{
  if(state?.stage==="NOT_STARTED"&&(path==="/listening"||path==="/test"||path==="/test/writing"))router.replace(state.path);
 },[state,path,router]);
 useEffect(()=>{
  if(!active)return;
  const update=()=>setFullscreen(!!document.fullscreenElement);update();document.addEventListener("fullscreenchange",update);
  return()=>document.removeEventListener("fullscreenchange",update);
 },[active]);
 useEffect(()=>{
  if(!active||!state?.deadline)return;
  const due=performance.now()+state.deadline-state.serverNow;let expired=false;
  const tick=()=>{if(performance.now()<due)return;if(!expired){expired=true;window.dispatchEvent(new Event("ielts:deadline"));}
   for(const control of document.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>("[data-ielts-test-content] input,[data-ielts-test-content] select,[data-ielts-test-content] textarea"))control.disabled=true;
  };
  tick();const timer=window.setInterval(tick,250);return()=>window.clearInterval(timer);
 },[active,state]);
 useEffect(()=>{
  if(!active||!state)return;
  const flush=()=>{
   const skill=state.section;if(!skill)return;
   const raw=sessionStorage.getItem(draftKey(state.testId,skill));if(!raw)return;
   try{
    const values=JSON.parse(raw),url=`/api/attempts/${state.id}/${skill==="writing"?"draft":"section"}`;
    const payload=JSON.stringify(skill==="writing"?{testId:state.testId,...values}:{testId:state.testId,skill,answers:values});
    if(payload.length<60000)void fetch(url,{method:skill==="writing"?"PATCH":"POST",keepalive:true,headers:{"Content-Type":"application/json","X-IELTS-Candidate":sessionStorage.getItem("ieltsStudent")||"","X-IELTS-Tab":tabId()},body:payload}).catch(()=>{});
   }catch{}
  };
  const warn=(event:BeforeUnloadEvent)=>{flush();event.preventDefault();event.returnValue="";};
  const visible=()=>{if(document.visibilityState==="hidden")flush();};
  const suspend=()=>{try{
   const raw=state.section?sessionStorage.getItem(draftKey(state.testId,state.section)):null;
   const payload=JSON.stringify({testId:state.testId,tabId:tabId(),action:"suspend",skill:state.section,snapshot:raw?JSON.parse(raw):undefined});
   if(payload.length<60000)void fetch(`/api/attempts/${state.id}/lifecycle`,{method:"POST",keepalive:true,headers:{"Content-Type":"application/json","X-IELTS-Candidate":sessionStorage.getItem("ieltsStudent")||""},body:payload}).catch(()=>{});
  }catch{}};
  const click=(event:MouseEvent)=>{
   const link=(event.target as Element)?.closest?.("a[href]");if(!link)return;
   const target=new URL(link.getAttribute("href")!,location.href),allowed=new URL(state.path,location.origin);
   if(target.pathname!==allowed.pathname||target.searchParams.get("test")!==String(state.testId)){
    event.preventDefault();event.stopPropagation();setNotice("Please complete your current test section before leaving. Your answers are saved.");
   }
  };
  const back=()=>{const allowed=new URL(state.path,location.origin);if(location.pathname!==allowed.pathname||new URLSearchParams(location.search).get("test")!==String(state.testId)){setNotice("Your active test is protected. Please continue in the current section.");router.replace(state.path);}};
  window.addEventListener("beforeunload",warn);window.addEventListener("pagehide",suspend);document.addEventListener("visibilitychange",visible);document.addEventListener("click",click,true);window.addEventListener("popstate",back);
  return()=>{window.removeEventListener("beforeunload",warn);window.removeEventListener("pagehide",suspend);document.removeEventListener("visibilitychange",visible);document.removeEventListener("click",click,true);window.removeEventListener("popstate",back);};
 },[active,state,router]);
 useEffect(()=>{
  const blocked=!!error;window.dispatchEvent(new CustomEvent("ielts:safety-blocked",{detail:blocked}));
 },[error]);
 const blocked=!!error||(active&&(!fullscreen||!!notice));
 return <><div data-ielts-test-content key={recovery} inert={blocked} aria-hidden={blocked||undefined}>{children}</div>{(blocked||!!error)&&!path.startsWith("/admin")&&<div role="dialog" aria-modal="true" aria-labelledby="test-safety-title" className="fixed inset-0 z-[2147483647] grid place-items-center bg-black/70 p-6 font-[Arial,sans-serif]"><section className="w-full max-w-lg border border-[#dedede] bg-white p-8 text-[#252525] shadow-lg"><h2 id="test-safety-title" className="mb-4 text-2xl font-bold">{error?"Test Recovery":!fullscreen?"Fullscreen Required":"Test Navigation Protected"}</h2><p className="mb-6 leading-6">{error||notice||"For test security and to prevent accidental navigation, please return to fullscreen mode to continue your test. Your answers are safe."}</p><button className="bg-[#c51f34] px-5 py-3 font-semibold text-white" onClick={()=>{
  setNotice("");if(error){const test=query.get("test")||sessionStorage.getItem("ieltsActiveTest");if(test)void ensureAttempt(test).then(()=>setError("")).catch(e=>setError((e as Error).message));}
  if(!document.fullscreenElement)void requestTestFullscreen().then(()=>setFullscreen(true)).catch(e=>setError((e as Error).message));
 }}>{error?"Retry recovery":!fullscreen?"Return to Fullscreen":"Continue test"}</button></section></div>}</>;
}
