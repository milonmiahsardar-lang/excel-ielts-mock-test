"use client";

import PartNavigation from "../test/PartNavigation";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wifi, Bell, Menu, NotebookPen } from "lucide-react";
import TestTwoListening from "./TestTwoListening";
import TestThreeListening from "./TestThreeListening";
import TestFourListening from "./TestFourListening";
import TestFiveListening from "./TestFiveListening";
import TestSixListening from "./TestSixListening";
import TestSevenListening from "./TestSevenListening";
import TestEightListening from "./TestEightListening";
import TestNineListening from "./TestNineListening";
import TestTenListening from "./TestTenListening";
import TestElevenListening from "./TestElevenListening";
import ListeningTestsFourteenSeventeenTwenty from "./ListeningTestsFourteenSeventeenTwenty";
import ListeningTestsFifteenEighteen from "./ListeningTestsFifteenEighteen";
import ListeningTestsTwelveSixteen from "./ListeningTestsTwelveSixteen";
import ListeningTestsThirteenNineteen from "./ListeningTestsThirteenNineteen";

import { draftRevision, draftKey, request, RequestError, saveSection, useAnswerDraft } from "@/lib/results/client";
import { lifecycle, statusSnapshot, publishStatus, useAttemptStatus } from "@/lib/results/safety-client";
import { attemptKey } from "@/lib/results/client";

type AudioDiagnostic = Record<string, unknown> & { localId: string };
const sendingDiagnostics = new Set<string>();
function pendingDiagnostics(key: string): AudioDiagnostic[] {
  try { const value = JSON.parse(sessionStorage.getItem(key) || "[]"); return Array.isArray(value) ? value.slice(-20) : []; } catch { return []; }
}
async function flushAudioDiagnostics(id: string, test: string) {
  if (sendingDiagnostics.has(id)) return;
  sendingDiagnostics.add(id);
  const key = `ieltsAudioDiagnostics:${id}`;
  try {
    for (let sent = 0; sent < 20; sent++) {
      const event = pendingDiagnostics(key)[0];
      if (!event) break;
      await request(`/api/attempts/${id}/audio-diagnostics`, { ...event, testId: Number(test) });
      const remaining = pendingDiagnostics(key).filter(item => item.localId !== event.localId);
      if (remaining.length) sessionStorage.setItem(key, JSON.stringify(remaining)); else sessionStorage.removeItem(key);
    }
  } catch { /* Retain bounded diagnostics in this tab for the next connection. */ }
  finally { sendingDiagnostics.delete(id); }
}

export default function ListeningTest() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testNumber = searchParams.get("test") || "1";
  const audioSource = /^(?:[1-9]|10|11|12|13|14|15|16|17|18|19|20)$/.test(testNumber)
    ? `/audio/listening-test-${testNumber}.mp3`
    : undefined;

  const audioRef = useRef<HTMLAudioElement>(null);
  const intentionalAudioPause = useRef(false);

  const [isFinished, setIsFinished] = useState(false);
  const finalSnapshot=useRef<{answers:Record<number,string>;revision:number}|null>(null);
  const [audioRetry,setAudioRetry]=useState(0),[retryingAudio,setRetryingAudio]=useState(false);
  const [recoverAudio,setRecoverAudio]=useState(false);
  const retryBusy=useRef(false);
  const progressBlocked=useRef(false);
  const state=useAttemptStatus();
  const [transitioning,setTransitioning]=useState(false),[audioError,setAudioError]=useState("");
  const reporting=useRef(false),lastReport=useRef(0),restored=useRef(false),pendingEnd=useRef(false);
  const listeningComplete=state?.stage==="LISTENING_COMPLETED"||state?.stage==="COMPLETED";
  const [playbackBlocked,setPlaybackBlocked]=useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUnavailableFor, setAudioUnavailableFor] = useState<string | null>(null);
  const hasAudio = Boolean(audioSource) && audioUnavailableFor !== testNumber;
  const [activePart, setActivePart] = useState(1);

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const latestAnswers=useRef(answers);latestAnswers.current=answers;

  const draftReady=useAnswerDraft("listening",testNumber,answers,setAnswers);

  const diagnoseAudio = (kind: string, error?: unknown, ended = false, audio = audioRef.current) => {
    // Diagnostics must never interfere with playback or answer saving.
    try {
      const id = sessionStorage.getItem(attemptKey(testNumber)); if (!id) return;
      const key = `ieltsAudioDiagnostics:${id}`;
      const reason = error instanceof RequestError ? "server-response" : error instanceof Error && /too long/.test(error.message) ? "timeout" : error instanceof Error && /Unable to connect/.test(error.message) ? "connection" : "playback";
      const event: AudioDiagnostic = { localId: `${Date.now()}-${Math.random()}`, kind, reason, position: audio?.currentTime ?? 0, duration: audio && Number.isFinite(audio.duration) ? audio.duration : null, mediaCode: audio?.error?.code ?? null, status: error instanceof RequestError ? error.status : null, networkState: audio?.networkState ?? null, readyState: audio?.readyState ?? null, retry: audioRetry, ended };
      sessionStorage.setItem(key, JSON.stringify([...pendingDiagnostics(key), event].slice(-20)));
      void flushAudioDiagnostics(id, testNumber);
    } catch {}
  };
  useEffect(() => {
    const flush = () => { const id = sessionStorage.getItem(attemptKey(testNumber)); if (id) void flushAudioDiagnostics(id, testNumber); };
    flush();const timer = window.setInterval(flush, 15000);window.addEventListener("online", flush);
    return () => { window.clearInterval(timer);window.removeEventListener("online", flush); };
  }, [testNumber]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !draftReady) return;
    let disposed = false, resuming = false;
    const resume = () => {
      if (disposed || resuming || intentionalAudioPause.current || !restored.current ||
          audio.ended || audio.error || finalSnapshot.current ||
          statusSnapshot()?.stage === "LISTENING_COMPLETED") return;
      resuming = true;
      void audio.play().then(() => { if (!disposed) setPlaybackBlocked(false); })
        .catch(error => { if (!disposed) { diagnoseAudio("play-blocked", error);setPlaybackBlocked(true); } })
        .finally(() => { resuming = false; });
    };
    const preventMediaKey = (event: KeyboardEvent) => {
      if (["MediaPlayPause", "MediaPause", "MediaStop", "MediaTrackNext", "MediaTrackPrevious"].includes(event.key)) {
        event.preventDefault(); event.stopImmediatePropagation();
      }
    };
    const actions: MediaSessionAction[] = ["pause", "stop", "seekbackward", "seekforward", "seekto", "previoustrack", "nexttrack", "play"];
    const mediaSession = "mediaSession" in navigator ? navigator.mediaSession : null;
    for (const action of actions) {
      try { mediaSession?.setActionHandler(action, () => { if (audio.paused) resume(); }); } catch {}
    }
    audio.addEventListener("pause", resume);
    document.addEventListener("keydown", preventMediaKey, true);
    return () => {
      disposed = true;
      audio.removeEventListener("pause", resume);
      document.removeEventListener("keydown", preventMediaKey, true);
      for (const action of actions) { try { mediaSession?.setActionHandler(action, null); } catch {} }
    };
  }, [testNumber, draftReady, audioRetry, hasAudio]);

  useEffect(() => {
    if(!draftReady)return;
    const audio=audioRef.current;if(!audio)return;
    const saved=statusSnapshot()?.audioPosition??0;
    const restore=()=>{intentionalAudioPause.current=false;if(Number.isFinite(audio.duration))audio.currentTime=Math.min(saved,audio.duration);restored.current=true;if(state?.stage!=="LISTENING_COMPLETED")void audio.play().then(()=>setPlaybackBlocked(false)).catch(error=>{diagnoseAudio("play-blocked",error);setPlaybackBlocked(true);});};
    if(audio.readyState>=1)restore();else audio.addEventListener("loadedmetadata",restore,{once:true});
    return()=>{intentionalAudioPause.current=true;audio.removeEventListener("loadedmetadata",restore);audio.pause();};
  }, [testNumber,draftReady,audioRetry]);
  useEffect(()=>{const block=(event:Event)=>{if((event as CustomEvent).detail){intentionalAudioPause.current=true;audioRef.current?.pause();setPlaybackBlocked(true);}};window.addEventListener("ielts:safety-blocked",block);return()=>window.removeEventListener("ielts:safety-blocked",block);},[]);
  const reportAudio=async(ended=false)=>{
    const audio=audioRef.current,id=sessionStorage.getItem(attemptKey(testNumber));if(!audio||!id||!draftReady||!restored.current||progressBlocked.current||statusSnapshot()?.stage==="LISTENING_COMPLETED")return;
    if(reporting.current){if(ended)pendingEnd.current=true;return;}
    reporting.current=true;lastReport.current=Date.now();
    try{await lifecycle(id,testNumber,"audio",{position:audio.currentTime,ended,...(ended?finalSnapshot.current:{})});setAudioError("");}
    catch(e){
      diagnoseAudio("progress-error",e,ended,audio);
      setAudioError((e as Error).message);
      // A temporary save/network failure must not stop an otherwise healthy recording.
      // Keep server rejections authoritative and recover from its saved position.
      if(e instanceof RequestError && e.status>=400 && e.status<500 && ![408,429].includes(e.status)){
        intentionalAudioPause.current=true;audio.pause();setPlaybackBlocked(true);
        progressBlocked.current=true;
        setRecoverAudio(e.status===409);
      }
    }
    finally{reporting.current=false;if(pendingEnd.current){pendingEnd.current=false;void reportAudio(true);}}
  };

  const retryAudio=async()=>{
    if(retryBusy.current)return;retryBusy.current=true;setRetryingAudio(true);
    try{
      const id=sessionStorage.getItem(attemptKey(testNumber));if(!id)throw new Error("No active test session.");
      const saved=await request<NonNullable<ReturnType<typeof statusSnapshot>>>(`/api/attempts/${id}/lifecycle`,undefined,"GET");publishStatus(saved);
      if(saved.stage!=="LISTENING_ACTIVE"){setRecoverAudio(false);return;}
      restored.current=false;progressBlocked.current=false;setRecoverAudio(false);setAudioError("");setAudioUnavailableFor(null);setAudioRetry(value=>value+1);
    }catch(error){diagnoseAudio("recovery-error",error);setAudioError((error as Error).message);if(error instanceof RequestError&&[401,403,404].includes(error.status))setRecoverAudio(false);}finally{retryBusy.current=false;setRetryingAudio(false);}
  };

  const reportLatest=useRef(reportAudio),retryLatest=useRef(retryAudio);
  useEffect(()=>{reportLatest.current=reportAudio;retryLatest.current=retryAudio;});
  useEffect(()=>{
    if(!draftReady||listeningComplete)return;
    const recover=()=>{
      if(recoverAudio){void retryLatest.current();return;}
      // The ended event fires once: retry its final snapshot if the response was lost.
      if(finalSnapshot.current)void reportLatest.current(true);
    };
    const timer=window.setInterval(recover,5000);
    window.addEventListener("online",recover);
    return()=>{window.clearInterval(timer);window.removeEventListener("online",recover);};
  },[draftReady,listeningComplete,recoverAudio]);

  const handleContinueToReading = async () => {
    if((process.env.NODE_ENV !== "development" && !listeningComplete)||transitioning)return;setTransitioning(true);
    sessionStorage.setItem("ieltsListeningAnswers", JSON.stringify(answers));
    sessionStorage.setItem("ieltsListeningTest", testNumber);
    try { await saveSection("listening",testNumber,answers,true); router.replace(statusSnapshot()?.path||`/listening/instructions?test=${testNumber}`); } catch(error){window.alert((error as Error).message);setTransitioning(false);}
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "00:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  };

  const progress =
    hasAudio && duration > 0 ? (currentTime / duration) * 100 : 0;

  const questions = Array.from(
    { length: 40 },
    (_, index) => index + 1
  );

  const updateAnswer = (questionNumber: number, value: string) => {
    if(finalSnapshot.current||listeningComplete)return;
    setAnswers((previous) => ({
      ...previous,
      [questionNumber]: value,
    }));
  };

  const answerInput = (questionNumber: number, width = "w-44") => (
    <input
      id={`question-${questionNumber}`}
      aria-label={`Answer for question ${questionNumber}`}
      type="text"
      value={answers[questionNumber] || ""}
      onChange={(event) => updateAnswer(questionNumber, event.target.value)}
      className={`h-9 ${width} max-w-full border border-[#2185d0] bg-white px-2 outline-none focus:border-[#2185d0] focus:ring-1 focus:ring-[#2185d0]`}
      autoComplete="off"
    />
  );
  return (
    <main inert={!draftReady} aria-busy={!draftReady} className="h-screen flex flex-col bg-white text-black" style={{ fontFamily: "Arial, sans-serif" }}>

      {/* HEADER */}

      <header className="relative h-[60px] shrink-0 bg-white border-y border-[#d5d5d5] px-4 flex items-center justify-between">
        <div className="flex items-center gap-7">
          <div className="text-[32px] leading-none font-black tracking-[-2.5px] text-[#e31837]">IELTS<sup className="text-[9px] tracking-normal align-top ml-[-2px]">™</sup></div>
          <div className="self-start mt-1 text-[14px] leading-5 font-bold">Test taker ID<div className="font-normal text-[13px]">{isFinished ? "Completed" : "Listening"} · {formatTime(hasAudio ? currentTime : 0)} / {formatTime(hasAudio ? duration : 0)}</div></div>
        </div>
        <div className="flex items-center gap-5 text-[#222]">
          
          <button aria-label="Notes" title="Notes"><NotebookPen size={22} /></button>
          <button aria-label="Connection status"><Wifi size={22} /></button>
          <button aria-label="Notifications"><Bell size={22} /></button>
          <button aria-label="Menu"><Menu size={24} /></button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#e5e5e5]"><div className="h-full bg-[#2185d0] transition-all duration-300" style={{ width: `${progress}%` }} /></div>
          {hasAudio ? <audio
            key={`${testNumber}-${audioRetry}`}
            ref={audioRef}
            controls={false}
            controlsList="nodownload"
            preload="auto"
            playsInline
            src={audioSource}
            onLoadStart={() => {
              setCurrentTime(0);
              setDuration(0);
              setIsFinished(Boolean(finalSnapshot.current));
            }}
            onError={(event) => {
              diagnoseAudio("media-error",undefined,false,event.currentTarget);
              intentionalAudioPause.current=true;
              event.currentTarget.pause();
              setAudioUnavailableFor(testNumber);
              setRecoverAudio(true);
              setCurrentTime(0);
              setDuration(0);
              setIsFinished(false);
            }}

            onLoadedMetadata={(e) => {
              setDuration(e.currentTarget.duration);
            }}
            onStalled={(event) => diagnoseAudio("stalled",undefined,false,event.currentTarget)}

            onTimeUpdate={(e) => {
              setCurrentTime(e.currentTarget.currentTime);
              if(draftReady)sessionStorage.setItem(draftKey(testNumber,"listening-audio-time"),String(e.currentTarget.currentTime));
              if(!e.currentTarget.paused&&Date.now()-lastReport.current>3000)void reportAudio();
            }}
            onRateChange={(e)=>{if(e.currentTarget.playbackRate!==1)e.currentTarget.playbackRate=1;}}
            onSeeking={(e)=>{if(restored.current&&state&&e.currentTarget.currentTime>state.audioPosition+5)e.currentTarget.currentTime=state.audioPosition;}}

            onEnded={() => {
              if(!finalSnapshot.current)finalSnapshot.current={answers:{...latestAnswers.current},revision:draftRevision(testNumber,"listening")};
              setIsFinished(true);
              setCurrentTime(duration);
              void reportAudio(true);
            }}

            onContextMenu={(e) => {
              e.preventDefault();
            }}
          /> : null}
      </header>

      {hasAudio&&playbackBlocked&&<p role="status" className="mx-5 mt-2 text-sm">Your browser paused automatic playback. <button className="ml-2 border px-3 py-1 font-semibold" onClick={()=>{intentionalAudioPause.current=false;void audioRef.current?.play().then(()=>setPlaybackBlocked(false)).catch(()=>setPlaybackBlocked(true));}}>Play audio</button></p>}
      {!hasAudio && <p role="status" className="mx-5 mt-2 text-sm">Audio for Test {testNumber} is unavailable. <button disabled={retryingAudio} className="ml-2 border px-3 py-1 font-semibold" onClick={()=>void retryAudio()}>{retryingAudio?"Retrying...":"Retry audio"}</button></p>}
      {audioError&&<p role="alert" className="mx-5 mt-2 text-sm text-red-700">{audioError}</p>}

      <div className="mx-2 mt-2 mb-1 shrink-0 rounded border border-[#d5d5d5] bg-[#f2f2ef] px-5 py-3">
        <h2 className="text-[16px] leading-6 font-bold">Part {activePart}</h2>
        <p className="text-[16px] leading-6">Questions {(activePart - 1) * 10 + 1}–{activePart * 10}</p>
      </div>
      {/* MAIN CONTENT */}

      <section inert={isFinished||listeningComplete} className="flex-1 min-h-0 overflow-y-auto bg-white px-5 py-3">
                {testNumber === "1" && activePart === 1 && (
          <div className="mx-auto w-full max-w-5xl space-y-8 py-3 text-[16px] leading-6">
            <section aria-label="Questions 1 to 4" className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold">Questions 1–4</h3>
                <p>Complete the form below.</p>
                <p>Write <b>NO MORE THAN THREE WORDS AND/OR NUMBERS</b> for each answer.</p>
              </div>
              <div className="border border-[#999] bg-white p-5 sm:p-7">
                <h4 className="mb-5 text-center text-xl font-bold">Accommodation Request Form</h4>
                <div className="mb-5 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] border border-[#999] bg-[#eee] px-4 py-3 text-[14px]">
                  <span>Name</span><span><b>Sara Lim</b></span>
                </div>
                <div className="space-y-5">
                  <p>Age: <b>23</b></p>
                  <p className="flex flex-wrap items-center gap-2"><span>Length of time in Australia:</span><b>1</b>{answerInput(1)}</p>
                  <div className="grid gap-2 sm:grid-cols-[minmax(150px,0.8fr)_minmax(0,1fr)] sm:items-center"><span>Present address:</span><div>Flat 1,<br />539, <span className="inline-flex flex-wrap items-center gap-2"><b>2</b>{answerInput(2,"w-40")}</span> Road<br />Canterbury 2036</div></div>
                  <p className="flex flex-wrap items-center gap-2"><span>Present course:</span><b>3</b>{answerInput(3)}<span>English</span></p>
                  <div><p className="flex flex-wrap items-center gap-2"><span>Accommodation required from:</span><b>4</b>{answerInput(4)}</p><p className="ml-2">7th September</p></div>
                </div>
              </div>
            </section>

            <section className="space-y-4" aria-label="Questions 5 to 7">
              <div className="space-y-1"><h3 className="font-bold">Questions 5–7</h3><p>Choose the correct answer.</p></div>
              {([
                [5, "Sara requires a", ["single room.", "twin room.", "triple room."]],
                [6, "She would prefer to live with a", ["family.", "single person.", "couple."]],
                [7, "She would like to live in a", ["flat.", "house.", "studio apartment."]],
              ] as [number, string, string[]][]).map(([number, prompt, options]) => (
                <div id={`question-${number}`} key={number} className="scroll-m-6">
                  <p className="mb-3 flex items-center gap-2"><span className="inline-flex h-8 min-w-8 items-center justify-center rounded-sm border border-[#2185d0] text-[16px]">{number}</span>{prompt}</p>
                  <div className="ml-3 flex flex-col gap-3">
                    {options.map((option, index) => { const letter = String.fromCharCode(65 + index); return <label key={letter} className="flex items-center gap-2"><input type="radio" name={`listening-question-${number}`} value={letter} checked={answers[number] === letter} onChange={() => updateAnswer(number, letter)} /><span>{option}</span></label>; })}
                  </div>
                </div>
              ))}
            </section>

            <section className="space-y-4" aria-label="Questions 8 to 10">
              <div className="space-y-1"><h3 className="font-bold">Questions 8–10</h3><p>Complete the sentences below.</p><p>Write <b>NO MORE THAN ONE WORD</b> for each answer.</p></div>
              <div className="space-y-5">
                <p className="flex flex-wrap items-center gap-2"><b>8</b><span>The</span>{answerInput(8,"w-40")}<span>will be $320.</span></p>
                <p className="flex flex-wrap items-center gap-2"><b>9</b><span>She needs to pay the rent by cash or cheque on a</span>{answerInput(9,"w-40")}<span>basis.</span></p>
                <p className="flex flex-wrap items-center gap-2"><b>10</b><span>She needs to pay her part of the</span>{answerInput(10,"w-40")}<span>bill.</span></p>
              </div>
            </section>
          </div>
        )}

        {testNumber === "1" && activePart === 2 && (
          <div className="mx-auto w-full max-w-5xl space-y-8 py-3 text-[16px] leading-6">
            <section className="space-y-4" aria-label="Questions 11 to 14">
              <div className="space-y-1"><h3 className="font-bold">Questions 11–14</h3><p>Choose the correct answer.</p></div>
              {([
                [11, "When is this year’s festival being held?", ["1–13 January", "5–17 January", "25–31 January"]],
                [12, "What will the reviewer concentrate on today?", ["theatre", "dance", "exhibitions"]],
                [13, "How many circuses are there in the festival?", ["one", "two", "several"]],
                [14, "Where does Circus Romano perform?", ["in a theatre", "in a tent", "in a stadium"]],
              ] as [number, string, string[]][]).map(([number, prompt, options]) => (
                <div id={`question-${number}`} key={number} className="scroll-m-6">
                  <p className="mb-3 flex items-center gap-2"><span className="inline-flex h-8 min-w-8 items-center justify-center rounded-sm border border-[#2185d0] text-[16px]">{number}</span>{prompt}</p>
                  <div className="ml-3 flex flex-col gap-3">
                    {options.map((option, index) => { const letter = String.fromCharCode(65 + index); return <label key={letter} className="flex items-center gap-2"><input type="radio" name={`listening-question-${number}`} value={letter} checked={answers[number] === letter} onChange={() => updateAnswer(number, letter)} /><span>{option}</span></label>; })}
                  </div>
                </div>
              ))}
            </section>

            <section className="space-y-4" aria-label="Questions 15 to 20">
              <div className="space-y-1"><h3 className="font-bold">Questions 15–20</h3><p>Complete the notes below.</p><p>Write <b>NO MORE THAN THREE WORDS</b> for each answer.</p></div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] border-collapse border border-[#777] text-left">
                  <thead><tr className="bg-[#f2f2f2]"><th className="border border-[#777] px-3 py-3"></th><th className="border border-[#777] px-3 py-3">Where</th><th className="border border-[#777] px-3 py-3">Type of performance</th><th className="border border-[#777] px-3 py-3">Highlights</th><th className="border border-[#777] px-3 py-3">Type of audience</th></tr></thead>
                  <tbody>
                    <tr><th className="border border-[#777] px-3 py-3">Circus Romano</th><td className="border border-[#777] px-3 py-3"></td><td className="border border-[#777] px-3 py-3">Clowns and acrobats</td><td className="border border-[#777] px-3 py-3">Music and <span className="inline-flex items-center gap-2"><b>15</b>{answerInput(15,"w-32")}</span></td><td className="border border-[#777] px-3 py-3"><span className="inline-flex items-center gap-2"><b>16</b>{answerInput(16,"w-32")}</span></td></tr>
                    <tr><th className="border border-[#777] px-3 py-3">Circus Electrica</th><td className="border border-[#777] px-3 py-3"><span className="inline-flex items-center gap-2"><b>17</b>{answerInput(17,"w-32")}</span></td><td className="border border-[#777] px-3 py-3">Dancers and magicians</td><td className="border border-[#777] px-3 py-3">Aerial displays</td><td className="border border-[#777] px-3 py-3"><span className="inline-flex items-center gap-2"><b>18</b>{answerInput(18,"w-32")}</span></td></tr>
                    <tr><th className="border border-[#777] px-3 py-3">Mekong Water Puppets</th><td className="border border-[#777] px-3 py-3"><span className="inline-flex items-center gap-2"><b>19</b>{answerInput(19,"w-32")}</span></td><td className="border border-[#777] px-3 py-3">Puppets</td><td className="border border-[#777] px-3 py-3">Seeing the puppeteers at the end</td><td className="border border-[#777] px-3 py-3"><span className="inline-flex items-center gap-2"><b>20</b>{answerInput(20,"w-32")}</span></td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {testNumber === "1" && activePart === 3 && (
          <div className="mx-auto w-full max-w-5xl space-y-8 py-3 text-[16px] leading-6">
            <section className="space-y-4" aria-label="Questions 21 to 25">
              <div className="space-y-1"><h3 className="font-bold">Questions 21–25</h3><p>Choose the correct answer.</p></div>
              {([
                [21, "The man wants information on courses for", ["people going back to college.", "postgraduate students.", "business executives."]],
                [22, "The ‘Study for Success’ seminar lasts for", ["one day.", "two days.", "three days."]],
                [23, "In the seminar the work on writing aims to improve", ["confidence.", "speed.", "clarity."]],
                [24, "Reading sessions help students to read", ["analytically.", "as fast as possible.", "thoroughly."]],
                [25, "The seminar tries to", ["prepare learners physically.", "encourage interest in learning.", "develop literacy skills."]],
              ] as [number, string, string[]][]).map(([number, prompt, options]) => (
                <div id={`question-${number}`} key={number} className="scroll-m-6">
                  <p className="mb-3 flex items-center gap-2"><span className="inline-flex h-8 min-w-8 items-center justify-center rounded-sm border border-[#2185d0] text-[16px]">{number}</span>{prompt}</p>
                  <div className="ml-3 flex flex-col gap-3">
                    {options.map((option, index) => { const letter = String.fromCharCode(65 + index); return <label key={letter} className="flex items-center gap-2"><input type="radio" name={`listening-question-${number}`} value={letter} checked={answers[number] === letter} onChange={() => updateAnswer(number, letter)} /><span>{option}</span></label>; })}
                  </div>
                </div>
              ))}
            </section>

            <section className="space-y-4" aria-label="Questions 26 to 30">
              <div className="space-y-1"><h3 className="font-bold">Questions 26–30</h3><p>Choose the correct answer.</p></div>
              {([
                [26, "A key component of the course is learning how to", ["use time effectively.", "stay healthy.", "select appropriate materials."]],
                [27, "Students who want to do the ‘Study for Success’ seminar should", ["register with the Faculty Office.", "contact their Course Convenor.", "reserve a place in advance."]],
                [28, "The ‘Learning Skills for University Study’ course takes place on", ["Monday, Wednesday and Friday.", "Monday, Tuesday and Wednesday.", "Monday, Thursday and Friday."]],
                [29, "A feature of this course is", ["a physical training component.", "advice on coping with stress.", "a detailed weekly planner."]],
                [30, "The man chooses the ‘Study for Success’ seminar because", ["he is over forty.", "he wants to start at the beginning.", "he seeks to revise his skills."]],
              ] as [number, string, string[]][]).map(([number, prompt, options]) => (
                <div id={`question-${number}`} key={number} className="scroll-m-6">
                  <p className="mb-3 flex items-center gap-2"><span className="inline-flex h-8 min-w-8 items-center justify-center rounded-sm border border-[#2185d0] text-[16px]">{number}</span>{prompt}</p>
                  <div className="ml-3 flex flex-col gap-3">
                    {options.map((option, index) => { const letter = String.fromCharCode(65 + index); return <label key={letter} className="flex items-center gap-2"><input type="radio" name={`listening-question-${number}`} value={letter} checked={answers[number] === letter} onChange={() => updateAnswer(number, letter)} /><span>{option}</span></label>; })}
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}

        {testNumber === "1" && activePart === 4 && (
          <div className="mx-auto w-full max-w-5xl space-y-8 py-3 text-[16px] leading-6">
            <section className="space-y-4" aria-label="Questions 31 and 32">
              <div className="space-y-1"><h3 className="font-bold">Questions 31 and 32</h3><p>Complete the notes below.</p><p>Write <b>NO MORE THAN TWO WORDS AND/OR A NUMBER</b> for each answer.</p></div>
              <div className="border border-[#999] bg-white p-5 sm:p-7">
                <h4 className="mb-4 text-lg font-bold underline">New Union Building</h4>
                <p className="mb-3 text-[14px] font-bold italic">Procedures to establish student opinion:</p>
                <ul className="list-disc space-y-3 pl-6">
                  <li>students were asked to give written suggestions on the building’s design</li>
                  <li>these points informed the design of a <b>31</b> {answerInput(31,"w-48")}<br />(there were <b>32</b> {answerInput(32,"w-40")} respondents)</li>
                  <li>results collated and report produced by Union Committee</li>
                </ul>
              </div>
            </section>

            <section className="space-y-4" aria-label="Questions 33 to 37">
              <div className="space-y-1"><h3 className="font-bold">Questions 33–37</h3><p>Complete the table below.</p><p>Write <b>NO MORE THAN THREE WORDS</b> for each answer.</p></div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] table-fixed border-collapse border border-[#777] text-left">
                  <colgroup><col style={{width:"16%"}}/><col style={{width:"34%"}}/><col style={{width:"23%"}}/><col style={{width:"27%"}}/></colgroup>
                  <thead><tr><th colSpan={4} className="border border-[#777] px-4 py-4 text-center font-bold">CHOICE OF SITE</th></tr><tr className="bg-[#f2f2f2]"><th className="border border-[#777] px-4 py-4"></th><th className="border border-[#777] px-4 py-4 text-center">Site One</th><th className="border border-[#777] px-4 py-4 text-center">Site Two</th><th className="border border-[#777] px-4 py-4 text-center">Site Three</th></tr></thead>
                  <tbody>
                    <tr><th className="border border-[#777] px-3 py-4 align-top">Location</th><td className="border border-[#777] px-3 py-4 align-top"><p className="leading-10">City centre near Faculty of <span className="inline-flex max-w-full items-center gap-2 align-middle"><b>33</b>{answerInput(33,"w-24")}</span></p></td><td className="border border-[#777] px-3 py-4 align-top">Outskirts near park</td><td className="border border-[#777] px-3 py-4 align-top"><p className="leading-10">Out of town near the <span className="inline-flex max-w-full items-center gap-2 align-middle"><b>34</b>{answerInput(34,"w-24")}</span></p></td></tr>
                    <tr><th className="border border-[#777] px-3 py-4 align-top">Advantages and/or disadvantages</th><td className="border border-[#777] px-3 py-4 align-top"><div className="space-y-2"><p>Problems with</p><div className="flex items-center gap-2">{[0,1].map(index=>{const parts=(answers[35] || "").split(/\s*(?:,|\band\b)\s*|\s+/);return <div key={index} className="flex items-center gap-2">{index===0?<label htmlFor="question-35" className="font-bold">35</label>:<label htmlFor="question-35-second">and</label>}<input id={index===0?"question-35":"question-35-second"} aria-label={`Answer for question 35, ${index===0?"first":"second"} blank`} type="text" value={parts[index] || ""} onChange={event=>{const next=[parts[0] || "",parts[1] || ""];next[index]=event.target.value;updateAnswer(35,next.some(Boolean)?next.join(" and "):"");}} className="h-9 w-24 min-w-0 max-w-full border border-[#2185d0] bg-white px-2 outline-none focus:border-[#2185d0] focus:ring-1 focus:ring-[#2185d0]" autoComplete="off"/></div>;})}</div></div></td><td className="border border-[#777] px-3 py-4 align-top"><p className="leading-10">Close to <span className="inline-flex max-w-full items-center gap-2 align-middle"><b>36</b>{answerInput(36,"w-24")}</span></p></td><td className="border border-[#777] px-3 py-4 align-top"><p className="leading-10">Access to living quarters. Larger site, so more <span className="inline-flex max-w-full items-center gap-2 align-middle"><b>37</b>{answerInput(37,"w-24")}</span></p></td></tr>
                  </tbody>
                </table>
              </div>
            </section>
            <section className="space-y-4" aria-label="Question 38" id="question-38">
              <div className="space-y-1"><h3 className="font-bold">Question 38</h3><p>Select TWO options.</p><p>Which TWO facilities did the students request in the new Union building?</p></div>
              <div className="ml-3 flex flex-col gap-3">
                {(["a library", "a games room", "a student health centre", "a mini fitness centre", "a large swimming pool", "a travel agency", "a lecture theatre"] as string[]).map((option, index) => { const letter = String.fromCharCode(65 + index); const selected = (answers[38] || "").split(",").filter(Boolean); return <label key={letter} className="flex items-center gap-2"><input type="checkbox" checked={selected.includes(letter)} onChange={() => { const next = selected.includes(letter) ? selected.filter((value) => value !== letter) : selected.length < 2 ? [...selected, letter] : selected; updateAnswer(38, next.sort().join(",")); }} /><span>{option}</span></label>; })}
              </div>
            </section>

            <section className="space-y-4" aria-label="Question 39" id="question-39">
              <div className="space-y-1"><h3 className="font-bold">Question 39</h3><p>Choose the correct answer.</p><p>Which argument was used AGAINST having a drama theatre?</p></div>
              <div className="ml-3 flex flex-col gap-3">
                {(["It would be expensive and no students would use it.", "It would be a poor use of resources because only a minority would use it.", "It could not accommodate large productions of plays."] as string[]).map((option, index) => { const letter = String.fromCharCode(65 + index); return <label key={letter} className="flex items-center gap-2"><input type="radio" name="listening-question-39" value={letter} checked={answers[39] === letter} onChange={() => updateAnswer(39, letter)} /><span>{option}</span></label>; })}
              </div>
            </section>

            <section className="space-y-4" aria-label="Question 40" id="question-40">
              <div className="space-y-1"><h3 className="font-bold">Question 40</h3><p>Select TWO security measures.</p><p>Which TWO security measures have been requested?</p></div>
              <div className="ml-3 flex flex-col gap-3">
                {(["closed-circuit TV", "show Union Card on entering the building", "show Union Card when asked", "spot searches of bags", "permanent Security Office on site"] as string[]).map((option, index) => { const letter = String.fromCharCode(65 + index); const selected = (answers[40] || "").split(",").filter(Boolean); return <label key={letter} className="flex items-center gap-2"><input type="checkbox" checked={selected.includes(letter)} onChange={() => { const next = selected.includes(letter) ? selected.filter((value) => value !== letter) : selected.length < 2 ? [...selected, letter] : selected; updateAnswer(40, next.sort().join(",")); }} /><span>{option}</span></label>; })}
              </div>
            </section>          </div>
        )}
        {testNumber === "2" ? (
          <TestTwoListening part={activePart} answers={answers} updateAnswer={updateAnswer} />
        ) : testNumber === "3" ? (
          <TestThreeListening part={activePart} answers={answers} updateAnswer={updateAnswer} />
        ) : testNumber === "4" ? (
          <TestFourListening part={activePart} answers={answers} updateAnswer={updateAnswer} />
        ) : testNumber === "5" ? (
          <TestFiveListening part={activePart} answers={answers} updateAnswer={updateAnswer} />
        ) : testNumber === "6" ? (
          <TestSixListening part={activePart} answers={answers} updateAnswer={updateAnswer} />
        ) : testNumber === "7" ? (
          <TestSevenListening part={activePart} answers={answers} updateAnswer={updateAnswer} />
        ) : testNumber === "8" ? (
          <TestEightListening part={activePart} answers={answers} updateAnswer={updateAnswer} />
        ) : testNumber === "9" ? (
          <TestNineListening part={activePart} answers={answers} updateAnswer={updateAnswer} />
        ) : testNumber === "10" ? (
          <TestTenListening part={activePart} answers={answers} updateAnswer={updateAnswer} />
        ) : testNumber === "11" ? (
          <TestElevenListening part={activePart} answers={answers} updateAnswer={updateAnswer} />
        ) : ["14", "17", "20"].includes(testNumber) ? (
          <ListeningTestsFourteenSeventeenTwenty testNumber={Number(testNumber)} part={activePart} answers={answers} updateAnswer={updateAnswer} />
        ) : ["15", "18"].includes(testNumber) ? (
          <ListeningTestsFifteenEighteen testNumber={Number(testNumber)} part={activePart} answers={answers} updateAnswer={updateAnswer} />
        ) : ["12", "16"].includes(testNumber) ? (
          <ListeningTestsTwelveSixteen testNumber={Number(testNumber)} part={activePart} answers={answers} updateAnswer={updateAnswer} />
        ) : ["13", "19"].includes(testNumber) ? (
          <ListeningTestsThirteenNineteen testNumber={Number(testNumber)} part={activePart} answers={answers} updateAnswer={updateAnswer} />
        ) : testNumber !== "1" && <div className="min-h-full bg-white" aria-label="Listening question area" />}
      </section>


      <PartNavigation current={activePart} total={4} onChange={setActivePart} />
      <footer data-ielts-test-footer className="shrink-0 bg-white border-t border-[#d5d5d5] px-3 py-1">
        <div className="grid w-full grid-cols-4 items-center justify-items-center gap-x-6">
          {[1, 2, 3, 4].map((part) => (
            <div key={part} className="flex flex-col items-center gap-0">
              <button onClick={() => setActivePart(part)} className={`text-[13px] leading-4 font-semibold ${activePart === part ? "text-[#111]" : "text-gray-600"}`}>
                Part {part}
              </button>
              <div className={testNumber === "1" || testNumber === "2" || testNumber === "3" || testNumber === "4" || testNumber === "5" || testNumber === "6" || testNumber === "7" || testNumber === "8" || testNumber === "9" || testNumber === "10" || testNumber === "11" || ["14", "17", "20"].includes(testNumber) || ["15", "18"].includes(testNumber) || ["12", "16"].includes(testNumber) || ["13", "19"].includes(testNumber) ? "grid grid-cols-10 gap-0.5" : "hidden"}>
                {Array.from({ length: 10 }, (_, index) => {
                  const number = (part - 1) * 10 + index + 1;
                  return (
                    <button
                      key={number}
                      aria-label={`Question ${number}`}
                      onClick={() => {
                        if (part !== activePart) {
                          setActivePart(part);
                          return;
                        }
                        document.getElementById(`question-${number}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      className={`h-5 min-w-5 rounded-sm border text-[12px] leading-none ${answers[number] ? "border-[#2185d0] text-[#111]" : "border-transparent text-[#111] hover:border-[#2185d0]"}`}
                    >
                      {number}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </footer>
    </main>
  );
}
