"use client";
import Link from "next/link";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { beginAttempt } from "@/lib/results/client";
import { requestTestFullscreen } from "@/lib/results/safety-client";

export default function ConfirmTest() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testNumber = searchParams.get("test") || "1";
  const [confirmed, setConfirmed] = useState(false);

  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const handleStartTest = async () => {
    if (!confirmed || busy) return;setBusy(true);setError("");
    const fullscreen=requestTestFullscreen();
    try { await Promise.all([beginAttempt(testNumber),fullscreen]); router.replace(`/listening/instructions?test=${testNumber}`); }
    catch(error){setError((error as Error).message);setBusy(false);}
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#f7f7f7] text-[#252525]" style={{ fontFamily: "Arial, sans-serif" }}>
      <header className="border-b border-[#dedede] bg-white">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Excel Institute home" className="flex items-center gap-4">
            <img src="/images/excel-institute-logo.jpg" alt="Excel Institute" className="h-10 w-[108px] object-contain" />
            <span className="hidden border-l border-[#dedede] pl-4 text-sm font-semibold text-[#333] sm:block">IELTS Mock Tests</span>
          </Link>
          <span className="text-sm font-medium text-[#555]">Candidate Portal</span>
        </div>
      </header>

      <section className="grid flex-1 place-items-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-[620px] overflow-hidden border border-[#dedede] bg-white shadow-sm">
          <div className="h-1 bg-[#e31837]" />
          <div className="p-6 sm:p-9">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#777]">Candidate confirmation</p>
                <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-[#222] sm:text-[32px]">Ready to Begin?</h1>
              </div>
              <span className="shrink-0 border border-[#e6c7cb] px-3 py-1.5 text-sm font-semibold text-[#9d1d2e]">Test {testNumber}</span>
            </div>

            <p className="mt-5 text-[15px] leading-6 text-[#555]">
              You are about to begin IELTS Mock Test {testNumber}. Please review the information below before continuing.
            </p>

            <div className="mt-6 border-y border-[#e5e5e5] py-5">
              <h2 className="text-sm font-semibold text-[#333]">At the venue</h2>
              <ul className="mt-3 space-y-2.5 text-sm leading-6 text-[#555]">
                <li className="flex gap-3"><span className="text-[#c51f34]">•</span><span>Please be seated at your assigned computer before you begin.</span></li>
                <li className="flex gap-3"><span className="text-[#c51f34]">•</span><span>Check that your headphones are working. Listening audio begins when you select Start Listening after confirming the instructions.</span></li>
              </ul>
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#444]">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-1 h-4 w-4 accent-[#c51f34]"
              />
              <span>I confirm that I am ready to start IELTS Mock Test {testNumber} and understand that each section begins when I select its Start button.</span>
            </label>

            {error&&<p role="alert" className="mt-4 text-red-700">{error}</p>}
            <button
              onClick={handleStartTest}
              disabled={!confirmed || busy}
              className={`mt-6 flex w-full items-center justify-center gap-2 px-5 py-3 text-[15px] font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#e31837] focus:ring-offset-2 ${
                confirmed
                  ? "bg-[#c51f34] text-white hover:bg-[#a91b2d]"
                  : "cursor-not-allowed bg-[#e8e8e8] text-[#888]"
              }`}
            >
              {busy?"Starting…":"Continue to test sections"} <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#dedede] bg-white px-5 py-4 text-center text-xs text-[#777]">
        Excel Institute · IELTS Mock Tests · Sylhet
      </footer>
    </main>
  );
}
