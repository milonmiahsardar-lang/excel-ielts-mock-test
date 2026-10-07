"use client";

import { useState, type FormEvent } from "react";

import { request } from "@/lib/results/client";

export default function VerifyTest({submitted=false,selectedTest}:{submitted?:boolean;selectedTest?:number}) {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [busy, setBusy] = useState(false);
  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if(busy)return; setBusy(true); setError("");
    try { const result=await request<{user:{id:string};destination?:string}>("/api/auth/login", {username,password,...(selectedTest?{testId:selectedTest}:{})}); if(sessionStorage.getItem("ieltsStudent")!==result.user.id){for(const key of Object.keys(sessionStorage)){if(key.startsWith("ielts"))sessionStorage.removeItem(key);}sessionStorage.setItem("ieltsStudent",result.user.id);} window.location.replace(result.destination||"/candidate"); }
    catch(error){setError((error as Error).message);}finally{setBusy(false);}
  };

  return (
    <main className="grid min-h-screen bg-white font-[Arial,sans-serif] text-[#202b39] lg:grid-cols-[46%_54%]">
      <div aria-hidden="true" className="hidden bg-[#909090] lg:block" />
      <section className="flex min-h-screen items-start justify-center px-7 py-20 sm:px-12 lg:px-14 xl:px-16">
        <div className="w-full max-w-[890px]">
          <div className="mb-24 flex items-center gap-6">
            <img
              src="/images/excel-institute-logo.jpg"
              alt="Excel Institute"
              className="h-[40px] w-[106px] object-contain sm:h-[48px] sm:w-[128px]"
            />
            <div className="whitespace-nowrap text-[32px] font-black leading-none tracking-[-2px] text-[#e31837] sm:text-[40px]">IELTS<sup className="ml-1 align-top text-[9px] tracking-normal">™</sup></div>
          </div>
          <h1 className="mb-20 text-[26px] font-normal leading-tight text-[#202b39] sm:text-[30px]">Welcome to Candidate login!</h1>
          {submitted&&<p role="status" className="mb-5 text-[15px] text-green-800">Your test was saved successfully. You have been signed out.</p>}
          <form onSubmit={handleVerify} className="w-full">
            <input type="text" value={username} onChange={(event) => { setUsername(event.target.value); setError(""); }} placeholder="Enter your username" aria-label="Username" autoComplete="username" autoFocus required className="mb-7 h-[60px] w-full rounded-[5px] border border-[#9b9b9b] bg-white px-4 text-[18px] text-[#333] outline-none placeholder:text-[#555] focus:border-[#4c9aff] focus:ring-1 focus:ring-[#4c9aff]" />
            <input type="password" value={password} onChange={(event) => { setPassword(event.target.value); setError(""); }} placeholder="Password" aria-label="Password" autoComplete="current-password" required className="mb-7 h-[60px] w-full rounded-[5px] border border-[#9b9b9b] bg-white px-4 text-[18px] text-[#333] outline-none placeholder:text-[#555] focus:border-[#4c9aff] focus:ring-1 focus:ring-[#4c9aff]" />
            {error && <p role="alert" className="mb-4 text-[15px] text-red-600">{error}</p>}
            <button disabled={busy} type="submit" className="rounded-[5px] border border-[#064b91] bg-[#075db5] px-4 py-2.5 text-[16px] font-semibold text-white hover:bg-[#064f99] focus:outline-none focus:ring-2 focus:ring-[#4c9aff] focus:ring-offset-2">{busy?"Logging in…":"Login"}</button>
          </form>
          <hr className="my-9 border-0 border-t border-[#d8d8d8]" />
          <p className="text-[16px] leading-6 text-[#202b39]">Trouble logging in? Please refer to your registration email for help documents.</p>
        </div>
      </section>
    </main>
  );
}
