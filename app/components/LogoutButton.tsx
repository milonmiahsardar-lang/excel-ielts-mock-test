"use client";
import { useState } from "react";
import { request, clearCandidateStorage } from "@/lib/results/client";
import { finishTestSafety } from "@/lib/results/safety-client";
export default function LogoutButton({admin=false}:{admin?:boolean}) {
  const [busy,setBusy]=useState(false);
  return <button disabled={busy} onClick={async()=>{
    setBusy(true);
    try {
      await request('/api/auth/logout',{admin});
      if(!admin){await finishTestSafety();clearCandidateStorage();}
      window.location.assign(admin?'/admin/login':'/verify');
    } catch(error) {window.alert((error as Error).message);setBusy(false);}
  }}>{busy?'Signing out…':'Sign out'}</button>;
}
