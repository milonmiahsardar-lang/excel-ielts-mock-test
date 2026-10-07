"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { clearCandidateStorage, request } from "@/lib/results/client";
export default function SubmissionLogout({candidateId}:{candidateId:string}) {
  const [seconds,setSeconds]=useState(5),[error,setError]=useState("");
  const pending=useRef(false);
  const logout=useCallback(async()=>{
    if(pending.current)return;
    pending.current=true;setError("");
    try {
      await request("/api/auth/logout",{expectedCandidateId:candidateId});
      clearCandidateStorage();window.location.replace("/verify?submitted=1");
    } catch(error){setError((error as Error).message);pending.current=false;}
  },[candidateId]);
  useEffect(()=>{
    const timer=window.setTimeout(()=>void logout(),5000);
    const clock=window.setInterval(()=>setSeconds(value=>Math.max(0,value-1)),1000);
    return()=>{window.clearTimeout(timer);window.clearInterval(clock);};
  },[logout]);
  return <div className="mt-6">
    <p role="status">Thank you for completing your test. {seconds>0?`You will be signed out in ${seconds} seconds.`:"Signing you out…"}</p>
    {error&&<p role="alert" className="mt-3 text-red-700">Your test is saved. {error}</p>}
    <button onClick={()=>void logout()} className="mt-6 inline-block bg-[#c51f34] px-5 py-3 text-white">{error?"Retry sign out":"Sign out now"}</button>
  </div>;
}
