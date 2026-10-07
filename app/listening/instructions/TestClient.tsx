"use client";
import Link from "next/link";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ensureAttempt } from "@/lib/results/client";
import { lifecycle, requestTestFullscreen } from "@/lib/results/safety-client";

export default function ListeningInstructions() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testNumber = searchParams.get("test") || "1";

  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  const beginListening = async () => {
    if(busy)return;setBusy(true);setError("");
    const fullscreen=requestTestFullscreen();
    try{const [attempt]=await Promise.all([ensureAttempt(testNumber),fullscreen]);await lifecycle(attempt.id,testNumber,"activate");router.replace(`/listening?test=${testNumber}&autoplay=true`);}
    catch(e){setError((e as Error).message);setBusy(false);}
  };

  return (
    <main className="flex min-h-screen flex-col bg-[#f7f7f7] text-[#252525]" style={{ fontFamily: "Arial, sans-serif" }}>
      <header className="border-b border-[#dedede] bg-white">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Excel Institute home" className="flex items-center gap-4">
            <img src="/images/excel-institute-logo.jpg" alt="Excel Institute" className="h-10 w-[108px] object-contain" />
            <span className="border-l border-[#dedede] pl-4 text-sm font-semibold text-[#333]">IELTS Mock Tests</span>
          </Link>
          <span className="text-sm font-medium text-[#555]">Listening Section</span>
        </div>
      </header>

      <section className="grid flex-1 place-items-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-[680px] border border-[#dedede] bg-white shadow-sm">
          <div className="h-1 bg-[#c51f34]" />
          <div className="p-6 sm:p-9">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#777]">Before you start</p>
                <h1 className="mt-2 text-[28px] font-semibold tracking-tight text-[#222] sm:text-[32px]">Listening Test Instructions</h1>
              </div>
              <span className="shrink-0 border border-[#e6c7cb] px-3 py-1.5 text-sm font-semibold text-[#9d1d2e]">Test {testNumber}</span>
            </div>

            <p className="mt-5 text-[15px] leading-6 text-[#555]">Please read these instructions before starting the listening recording.</p>

            <div className="mt-6 border-y border-[#e5e5e5] py-5">
              <ul className="space-y-3 text-sm leading-6 text-[#4f4f4f]">
                <li className="flex gap-3"><span className="text-[#c51f34]">1.</span><span>Check that you are wearing your headphones and can hear the audio clearly.</span></li>
                <li className="flex gap-3"><span className="text-[#c51f34]">2.</span><span>Listen carefully and enter your answers as the recording plays.</span></li>
                <li className="flex gap-3"><span className="text-[#c51f34]">3.</span><span>The recording starts when you select <strong>Start Listening Test</strong>.</span></li>
                <li className="flex gap-3"><span className="text-[#c51f34]">4.</span><span>Reading unlocks after the complete listening recording has finished. Keep your test open in this tab.</span></li>
              </ul>
            </div>

            <div className="mt-5 border border-[#ead8da] bg-[#fffafa] px-4 py-3 text-sm leading-6 text-[#555]">
              If you cannot hear the audio, please tell a staff member before starting.
            </div>

            <button
              disabled={busy}
              onClick={beginListening}
              className="mt-6 flex w-full items-center justify-center gap-2 bg-[#c51f34] px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-[#a91b2d] focus:outline-none focus:ring-2 focus:ring-[#e31837] focus:ring-offset-2"
            >
              Start Listening Test <span aria-hidden="true">→</span>
            </button>
            {error&&<p role="alert" className="mt-4 text-red-700">{error}</p>}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#dedede] bg-white px-5 py-4 text-center text-xs text-[#777]">
        Excel Institute · IELTS Mock Tests · Sylhet
      </footer>
    </main>
  );
}
