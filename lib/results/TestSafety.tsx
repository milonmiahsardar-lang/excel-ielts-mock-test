"use client";

import TestTools from "./TestTools";
import {createRecoveryLoop} from "./reliability";
import {clientDiagnostic} from "./client-diagnostics";
import { recoveryKind, recoverySnapshot, safeRecoveryContinuation, staleRecoveryFailure } from "./recovery-policy";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { attemptKey, draftKey, draftRevision, ensureAttempt, readAnswers, saveSection, RequestError, retryable, confirmedRecovery, leaseRecoveryDelay, type RecoveryRequestFailure } from "./client";

import { finishTestSafety, requestTestFullscreen, statusSnapshot, tabId, useAttemptStatus } from "./safety-client";



export default function TestSafety({children}:{children:React.ReactNode}){

 const path=usePathname(),query=useSearchParams(),router=useRouter(),state=useAttemptStatus();

 const testRoute=path==="/confirm"||path==="/listening/instructions"||path==="/listening"||path==="/test"||path==="/test/writing";

 const [fullscreen,setFullscreen]=useState(true),[error,setError]=useState(""),[notice,setNotice]=useState("");

 const recoveryCondition=useRef<{sequence:number;error:unknown;operation:string}|null>(null);
 const recoveryConditions=useRef(new Map<string,{sequence:number;error:unknown;operation:string}>());
 const recoveryAction=useRef<()=>Promise<void>>(()=>Promise.resolve());
 const [recoveryBusy,setRecoveryBusy]=useState(false);

 const [zoom,setZoom]=useState(100);

 const zoomable=path==="/listening"||path==="/test"||path==="/test/writing";

 const zoomKey=`ieltsZoom:${state?.id||"pending"}:${query.get("test")||"1"}`;

 useEffect(()=>{

  try{const saved=Number(sessionStorage.getItem(zoomKey));setZoom([90,100,125].includes(saved)?saved:100);}catch{setZoom(100);}

 },[zoomKey]);

 const changeZoom=(value:number)=>{

  if(![90,100,125].includes(value))return;

  setZoom(value);try{sessionStorage.setItem(zoomKey,String(value));}catch{}

  requestAnimationFrame(()=>window.dispatchEvent(new Event("resize")));

 };

 const [errorStatus,setErrorStatus]=useState<number|null>(null);

 const accessBlocked=errorStatus===401||errorStatus===403;

 const recoveryError=(e:unknown)=>{setError(e instanceof Error?e.message:"Unable to recover your test. Please retry.");setErrorStatus(e instanceof RequestError?e.status:null);};

 const active=!accessBlocked&&testRoute&&!!state&&state.stage!=="NOT_STARTED"&&state.stage!=="COMPLETED";


 useEffect(()=>{
  if(!testRoute){recoveryConditions.current.clear();recoveryCondition.current=null;setError('');setErrorStatus(null);setNotice('');return;}
  const selected=query.get('test')||sessionStorage.getItem('ieltsActiveTest');const actual=path==='/listening'||path==='/test'||path==='/test/writing';if(!selected||(!actual&&!sessionStorage.getItem(attemptKey(selected))))return;
  let live=true,failed=false,riskTimer:ReturnType<typeof setTimeout>|undefined;
  const attempt=()=>sessionStorage.getItem(attemptKey(selected))||'';
  const clearRisk=()=>{if(riskTimer!==undefined)clearTimeout(riskTimer);riskTimer=undefined;};
  const safe=()=>{
   const current=statusSnapshot(),confirmed=confirmedRecovery(attempt());
   let snapshot=false;try{const skill=current?.section;if(skill){snapshot=recoverySnapshot(JSON.parse(sessionStorage.getItem(draftKey(selected,skill))||'null'),skill);}else snapshot=!!current?.pendingSection;}catch{}
   return safeRecoveryContinuation(current,Number(selected),attempt(),confirmed?.at,snapshot,performance.now());
  };
  const showCondition=()=>{const conditions=[...recoveryConditions.current.values()],condition=conditions.find(c=>c.error instanceof RequestError&&[401,403].includes(c.error.status))||conditions[0];recoveryCondition.current=condition??null;if(condition)recoveryError(condition.error);else {setError('');setErrorStatus(null);}};
  const block=(error:unknown,sequence=0,operation='lifecycle')=>{if(!live)return;const key=operation+':'+(recoveryKind(error)==='critical'&&error instanceof RequestError?error.code||error.status:'communication'),prior=recoveryConditions.current.get(key);if(prior&&prior.sequence>sequence)return;recoveryConditions.current.set(key,{sequence,error,operation});showCondition();};
  const failure=(error:unknown,sequence=0,operation='lifecycle')=>{
   if(!live)return;failed=true;
   const confirmed=confirmedRecovery(attempt());
   if(staleRecoveryFailure(error,sequence,confirmed?.sequence))return;
   clientDiagnostic('recovery-failure',error instanceof RequestError?error.status:0,0,error instanceof RequestError?error.requestId:'');
   if(recoveryKind(error)!=='critical'&&safe()){
    if(riskTimer===undefined){const remaining=Math.max(0,120000-(performance.now()-(confirmed?.at??0)));riskTimer=setTimeout(()=>{riskTimer=undefined;if(live&&!safe())block(new RequestError('The test connection could not be verified. Your local answers are kept. Please retry recovery before continuing.',408,'','RECOVERY_UNVERIFIED'),sequence);},remaining);}
    return;
   }
   block(error,sequence,operation);
  };
  const loop=createRecoveryLoop({
   action:async(manual)=>{await ensureAttempt(selected,{forceLease:manual});},
   success:()=>{if(!live)return;clearRisk();const confirmed=confirmedRecovery(attempt());let pendingSave=false;for(const [key,condition] of recoveryConditions.current){if(!confirmed||confirmed.sequence<=condition.sequence)continue;if(['section','draft','submission'].includes(condition.operation)&&condition.error instanceof RequestError&&![401,403,404].includes(condition.error.status)){pendingSave=true;continue;}recoveryConditions.current.delete(key);}showCondition();if(pendingSave)window.dispatchEvent(new Event('ielts:recovered'));if(failed&&!recoveryConditions.current.size){failed=false;clientDiagnostic('recovery-success');window.dispatchEvent(new Event('ielts:recovered'));}},
   failure:(error)=>failure(error,error instanceof RequestError?error.sequence:0),
   retryable,
   delay:(fallback,failures)=>leaseRecoveryDelay?.(selected,fallback,failures)??fallback
  });
  const requestFailed=(event:Event)=>{
   const detail=(event as CustomEvent<RecoveryRequestFailure>).detail;if(!detail||detail.attemptId!==attempt())return;
   // Playback integrity is handled by the existing audio-specific recovery UI.
   // Renewing a lease cannot resolve an actual playback violation.
   if(detail.error instanceof RequestError&&detail.error.code?.startsWith('AUDIO_'))return;
   if(staleRecoveryFailure(detail.error,detail.sequence,confirmedRecovery(attempt())?.sequence))return;
   if(recoveryKind(detail.error)==='reconcile'){failed=true;void loop.wake();return;}
   failure(detail.error,detail.sequence,detail.operation);
   if(recoveryKind(detail.error)!=='critical')void loop.wake();
  };
  const saved=(event:Event)=>{const detail=(event as CustomEvent<{attemptId:string;operation:string;sequence:number}>).detail;if(!live||detail.attemptId!==attempt())return;for(const [key,condition] of recoveryConditions.current){if(detail.operation!==condition.operation||detail.sequence<=condition.sequence)continue;if(condition.error instanceof RequestError&&[401,403,404].includes(condition.error.status))continue;recoveryConditions.current.delete(key);}showCondition();};
  recoveryAction.current=()=>{clientDiagnostic('recovery-start');return loop.run(true);};
  const online=()=>void loop.run(true);const visible=()=>{if(document.visibilityState==='visible')void loop.run(true);};if(typeof document!=='undefined')document.addEventListener('visibilitychange',visible);window.addEventListener('online',online);window.addEventListener('ielts:request-failed',requestFailed);window.addEventListener('ielts:request-succeeded',saved);void loop.run();
  return()=>{live=false;clearRisk();loop.stop();recoveryAction.current=()=>Promise.resolve();if(typeof document!=='undefined')document.removeEventListener('visibilitychange',visible);window.removeEventListener('online',online);window.removeEventListener('ielts:request-failed',requestFailed);window.removeEventListener('ielts:request-succeeded',saved);};
 },[path,query,testRoute,router]);

 useEffect(()=>{
  if(accessBlocked||!state||state.stage==="NOT_STARTED"||state.stage==="COMPLETED")return;
  if(!testRoute)router.replace(state.path);
 },[accessBlocked,state,testRoute,router]);

 useEffect(()=>{

  if(!active||!state)return;

  const expected=new URL(state.path,location.origin);
  if(path!==expected.pathname||query.get("test")!==String(state.testId)||(query.get("mode")??"full")!==(state.mode??"full")){
   router.replace(state.path);return;
  }

  // Preserve Next's router state while adding one same-document boundary.
  // Re-arm it after a Back click without reloading the active section/audio.
  const marker=state.id+":"+state.path;
  const protectedState={...history.state,ieltsAttemptGuard:marker};
  if(history.state?.ieltsAttemptGuard!==marker){
   history.pushState(protectedState,"",location.href);
  }
  const protectHistory=(event:PopStateEvent)=>{
   // Capture before Next's popstate listener can restore the previous page.
   event.stopImmediatePropagation();
   history.pushState(protectedState,"",state.path);
   setNotice("Your active test is protected. Please continue in the current section.");
  };
  window.addEventListener("popstate",protectHistory,true);
  return()=>window.removeEventListener("popstate",protectHistory,true);

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

  if(!active)return;

  // Browser shortcuts are cancellable only when the browser delivers their events.

  // OS keys and reserved fullscreen shortcuts still require computer kiosk settings.

  const keyboard=(event:KeyboardEvent)=>{

   // Reading candidates may copy passage text and paste it into answer fields.
   if(path==="/test"&&event.ctrlKey&&!event.altKey&&!event.metaKey&&!event.shiftKey&&["c","v"].includes(event.key.toLowerCase()))return;

   if(event.ctrlKey||event.altKey||event.metaKey||["Control","Alt","AltGraph","Meta","OS","Escape","BrowserBack","BrowserForward","BrowserRefresh","GoBack","GoForward"].includes(event.key)||/^F(?:[1-9]|1[0-9]|2[0-4])$/.test(event.key)){

    event.preventDefault();event.stopImmediatePropagation();

   }

  };

  const wheel=(event:WheelEvent)=>{if(event.ctrlKey||event.metaKey){event.preventDefault();event.stopImmediatePropagation();}};

  const mouseNavigation=(event:MouseEvent)=>{
   if(event.button===3||event.button===4){event.preventDefault();event.stopImmediatePropagation();}
  };
  document.addEventListener("mousedown",mouseNavigation,true);
  document.addEventListener("mouseup",mouseNavigation,true);
  document.addEventListener("auxclick",mouseNavigation,true);

  window.addEventListener("keydown",keyboard,true);window.addEventListener("keyup",keyboard,true);

  window.addEventListener("wheel",wheel,{capture:true,passive:false});

  return()=>{document.removeEventListener("mousedown",mouseNavigation,true);document.removeEventListener("mouseup",mouseNavigation,true);document.removeEventListener("auxclick",mouseNavigation,true);window.removeEventListener("keydown",keyboard,true);window.removeEventListener("keyup",keyboard,true);window.removeEventListener("wheel",wheel,true);};

 },[active,path]);

 useEffect(()=>{if(testRoute&&state?.stage==="COMPLETED"){void finishTestSafety().then(()=>router.replace(`/test/writing/result?id=${encodeURIComponent(state.id)}&signout=1`));}},[state,testRoute,router]);

 const finalizing=useRef(false);

 const [sectionSaveError,setSectionSaveError]=useState("");

 useEffect(()=>{
  if(!active||!state||state.pendingSection)return;
  const completed=state.stage==="LISTENING_COMPLETED"||state.stage==="READING_COMPLETED";
  const reading=state.stage==="READING_ACTIVE"||state.stage==="READING_COMPLETED";
  if(!completed&&!reading)return;
  let due=completed;
  const finish=()=>{
   if(!due||finalizing.current)return;
   finalizing.current=true;
   const skill=reading?"reading":"listening";
   void Promise.resolve().then(()=>saveSection(skill,state.testId,readAnswers(state.testId,skill),true)).then(()=>{
    setSectionSaveError("");router.replace(statusSnapshot()?.path||`/listening/instructions?test=${state.testId}`);
   }).catch(e=>setSectionSaveError((e as Error).message)).finally(()=>{finalizing.current=false;});
  };
  const deadline=()=>{if(reading){due=true;finish();}};
  window.addEventListener("ielts:deadline",deadline);
  const retry=window.setInterval(finish,2000);
  finish();
  return()=>{window.clearInterval(retry);window.removeEventListener("ielts:deadline",deadline);};
 },[active,state,router]);

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

    const payload=JSON.stringify(skill==="writing"?{testId:state.testId,...values,revision:draftRevision(state.testId,skill)}:{testId:state.testId,skill,answers:values,revision:draftRevision(state.testId,skill)});

    if(payload.length<60000)void fetch(url,{method:skill==="writing"?"PATCH":"POST",keepalive:true,headers:{"Content-Type":"application/json","X-IELTS-Candidate":sessionStorage.getItem("ieltsStudent")||"","X-IELTS-Tab":tabId()},body:payload}).catch(()=>{});

   }catch{}

  };

  const warn=(event:BeforeUnloadEvent)=>{flush();event.preventDefault();event.returnValue="";};

  const visible=()=>{if(document.visibilityState==="hidden")flush();};

  const suspend=()=>{try{

   const raw=state.section?sessionStorage.getItem(draftKey(state.testId,state.section)):null;

   const payload=JSON.stringify({testId:state.testId,tabId:tabId(),action:"suspend",skill:state.section,revision:state.section?draftRevision(state.testId,state.section):undefined,snapshot:raw?JSON.parse(raw):undefined});

   if(payload.length<60000)void fetch(`/api/attempts/${state.id}/lifecycle`,{method:"POST",keepalive:true,headers:{"Content-Type":"application/json","X-IELTS-Candidate":sessionStorage.getItem("ieltsStudent")||""},body:payload}).catch(()=>{});

  }catch{}};

  const click=(event:MouseEvent)=>{

   const link=(event.target as Element)?.closest?.("a[href]");if(!link)return;

   const target=new URL(link.getAttribute("href")!,location.href),allowed=new URL(state.path,location.origin);

   if(target.pathname!==allowed.pathname||target.searchParams.get("test")!==String(state.testId)){

    event.preventDefault();event.stopPropagation();setNotice("Please complete your current test section before leaving. Your answers are saved.");

   }

  };



  window.addEventListener("beforeunload",warn);window.addEventListener("pagehide",suspend);document.addEventListener("visibilitychange",visible);document.addEventListener("click",click,true);

  return()=>{window.removeEventListener("beforeunload",warn);window.removeEventListener("pagehide",suspend);document.removeEventListener("visibilitychange",visible);document.removeEventListener("click",click,true);};

 },[active,state,router]);

 useEffect(()=>{

  const blocked=testRoute&&!!error;window.dispatchEvent(new CustomEvent("ielts:safety-blocked",{detail:blocked}));

 },[error,testRoute]);

 const recoveryShown=useRef(false);
 useEffect(()=>{const shown=testRoute&&!!error;if(shown===recoveryShown.current)return;recoveryShown.current=shown;const cause=recoveryCondition.current?.error;clientDiagnostic(shown?'recovery-screen-shown':'recovery-screen-hidden',cause instanceof RequestError?cause.status:0,0,cause instanceof RequestError?cause.requestId:'',{code:cause instanceof RequestError?cause.code:undefined,stage:statusSnapshot()?.stage,operation:'recovery'});},[error,testRoute]);

 const blocked=testRoute&&(!!error||(active&&(!fullscreen||!!notice)));

 return <>{sectionSaveError&&<p role="alert" className="fixed bottom-0 left-0 right-0 z-[2147483500] bg-red-50 p-3 text-center text-red-800">{sectionSaveError} Retrying the section save…</p>}<TestTools enabled={testRoute&&!blocked} zoom={zoom} onZoom={changeZoom}/><div data-ielts-test-content data-ielts-zoom={zoomable?zoom:undefined} style={zoomable?({"--ielts-test-zoom":zoom/100} as CSSProperties):undefined} inert={blocked} aria-hidden={blocked||undefined}>{children}</div>{blocked&&<div role="dialog" aria-modal="true" aria-labelledby="test-safety-title" className="fixed inset-0 z-[2147483647] grid place-items-center bg-black/70 p-6 font-[Arial,sans-serif]"><section className="w-full max-w-lg border border-[#dedede] bg-white p-8 text-[#252525] shadow-lg"><h2 id="test-safety-title" className="mb-4 text-2xl font-bold">{error?"Test Recovery":!fullscreen?"Fullscreen Required":"Test Navigation Protected"}</h2><p className="mb-6 leading-6">{error||notice||"For test security and to prevent accidental navigation, please return to fullscreen mode to continue your test. Your answers are safe."}</p><button disabled={recoveryBusy} aria-busy={recoveryBusy} className="bg-[#c51f34] px-5 py-3 font-semibold text-white" onClick={()=>{

  setNotice("");

  if(accessBlocked){

   const test=query.get("test")||sessionStorage.getItem("ieltsActiveTest");

   const destination=errorStatus===401?`/verify${test?`?test=${encodeURIComponent(test)}`:""}`:"/candidate";

   void finishTestSafety().finally(()=>window.location.assign(destination));return;

  }

  if(error&&!recoveryBusy){setRecoveryBusy(true);void recoveryAction.current().finally(()=>setRecoveryBusy(false));}

  if(!document.fullscreenElement)void requestTestFullscreen().then(()=>setFullscreen(true)).catch(e=>setNotice(e instanceof Error?e.message:"Please return to fullscreen."));

 }}>{recoveryBusy?"Recovering...":errorStatus===401?"Log in again":errorStatus===403?"View assigned tests":error?"Retry recovery":!fullscreen?"Return to Fullscreen":"Continue test"}</button></section></div>}</>;

}

