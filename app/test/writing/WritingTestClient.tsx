"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import { confirmsSave, isSaveAcknowledgement } from "@/lib/results/save-acknowledgement";
import { finishTestSafety } from "@/lib/results/safety-client";
import { Bell, Menu, Wifi } from "lucide-react";
import { writingPrompts } from "./writing-prompts";

import { captureDraft, localDraft, attemptKey, draftKey, draftRevision, saveWritingDraft, useDraftAutosave, retryable, resumeDraft, useCountdown, readAnswers, request } from "@/lib/results/client";

export default function WritingTest({ testNumber }: { testNumber: number | null }) {
  const router=useRouter(),submissionBusy=useRef(false),autoRetryAllowed=useRef(true);
  const testPrompt = testNumber === null ? null : writingPrompts[testNumber - 1];
  const [activeTask, setActiveTask] = useState<1 | 2>(1);
  const [task1Answer, setTask1Answer] = useState("");
  const [task2Answer, setTask2Answer] = useState("");
  const [isReady, setIsReady] = useState(false);
  const timeLeft = useCountdown(testNumber || 1,"writing",isReady);
  const [isFinished, setIsFinished] = useState(false);
  const [paneSplit, setPaneSplit] = useState(50);
  const [isSubmitting,setIsSubmitting]=useState(false);
  const [submissionError,setSubmissionError]=useState("");

  const movePaneDivider = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!bounds || bounds.width === 0) return;
    const percentage = ((event.clientX - bounds.left) / bounds.width) * 100;
    setPaneSplit(Math.min(75, Math.max(25, percentage)));
  };

  useEffect(() => {
    let active=true,retry:number|undefined;setIsReady(false);
    const load=()=>{void resumeDraft(testNumber || 1).then(draft=>{
      if(!active)return;
      const saved=localDraft(testNumber || 1,"writing");
      let value=draft.writing;if(saved&&typeof saved==="object"){const parsed=saved as {task1?:unknown;task2?:unknown};if(typeof parsed.task1==="string"&&typeof parsed.task2==="string")value={task1:parsed.task1,task2:parsed.task2};}setTask1Answer(value.task1 || "");setTask2Answer(value.task2 || "");
      setIsReady(true);
    }).catch(error=>{if(active){setSubmissionError((error as Error).message);if(retryable(error))retry=window.setTimeout(load,5000);}});};
    load();return()=>{active=false;window.clearTimeout(retry);};
  }, [testNumber]);

  useEffect(() => {
    if (!isReady) return;
    captureDraft(testNumber || 1,"writing",{task1:task1Answer,task2:task2Answer});
    try{sessionStorage.setItem(draftKey(testNumber || 1,"writing-time"),String(timeLeft));}catch{}
  }, [isReady, task1Answer, task2Answer, timeLeft, testNumber]);

  useDraftAutosave(testNumber || 1,"writing",{task1:task1Answer,task2:task2Answer},
    isReady&&!isFinished&&!isSubmitting&&timeLeft>0,
    value=>saveWritingDraft(testNumber || 1,value),
    error=>setSubmissionError((error as Error).message),
    ()=>setSubmissionError(""));

  const answer = activeTask === 1 ? task1Answer : task2Answer;
  const setAnswer = activeTask === 1 ? setTask1Answer : setTask2Answer;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const finalSnapshot=useRef<{writing:{task1:string;task2:string};revision:number}|null>(null);
  const finishTest = async () => {
    if(submissionBusy.current || isFinished || !isReady || timeLeft!==0)return;
    submissionBusy.current=true;
    setIsSubmitting(true);setSubmissionError("");
    const test=testNumber || 1;
    try {
      captureDraft(test,"writing",{task1:task1Answer,task2:task2Answer});
      finalSnapshot.current??={writing:{task1:task1Answer,task2:task2Answer},revision:draftRevision(test,"writing")};
      const attemptId=sessionStorage.getItem(attemptKey(test));if(!attemptId)throw new Error("Please start your mock test from the candidate confirmation page.");
      const listening=readAnswers(test,"listening");
      const currentReading=readAnswers(test,"reading");
      const reading=currentReading;
      const result=await request<{id:string;saveAcknowledgement:unknown}>("/api/submissions",{attemptId,testId:test,listening,reading,...finalSnapshot.current});
      const confirmed=confirmsSave(result.saveAcknowledgement,"writing",finalSnapshot.current.revision);
      if(!isSaveAcknowledgement(result.saveAcknowledgement,"writing",finalSnapshot.current.revision))throw new Error("Submission received without a confirmed answer snapshot. Keep this tab open and contact your administrator.");
      setIsFinished(confirmed);autoRetryAllowed.current=false;
      await finishTestSafety();
      router.replace(`/test/writing/result?id=${encodeURIComponent(result.id)}&signout=1`);
    } catch(error){autoRetryAllowed.current=retryable(error);setSubmissionError((error as Error).message);}finally{submissionBusy.current=false;setIsSubmitting(false);}
  };

  const finishLatest=useRef(finishTest);
  useEffect(()=>{finishLatest.current=finishTest;});
  useEffect(()=>{
    if(!isReady||timeLeft!==0||isFinished)return;
    const finish=()=>{if(autoRetryAllowed.current)void finishLatest.current();};
    finish();const retry=window.setInterval(finish,5000);window.addEventListener("online",finish);
    return()=>{window.clearInterval(retry);window.removeEventListener("online",finish);};
  },[isReady,timeLeft,isFinished]);

  return (
    // Submit automatically when the writing timer expires.
    <main className="flex h-screen flex-col bg-white text-black" style={{ fontFamily: "Arial, sans-serif" }}>
      <header className="flex h-[60px] shrink-0 items-center justify-between border-y border-[#d5d5d5] bg-white px-4">
        <div className="flex items-center gap-6">
          <div className="text-[32px] font-black leading-none tracking-[-2.5px] text-[#e31837]">IELTS<sup className="ml-[-2px] align-top text-[9px] tracking-normal">™</sup></div>
          <div className="mt-1 self-start text-[14px] font-bold leading-5">Test taker ID<div className="text-[13px] font-normal">Writing · {isFinished ? "Completed" : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}</div></div>
        </div>
        <div className="flex items-center gap-5 text-[#222]">
          <div className="rounded border border-[#c9c9c9] px-3 py-1 text-[14px] font-bold tabular-nums" aria-label="Time remaining">{isFinished ? "Completed" : `Time ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}</div>
          <button aria-label="Connection status"><Wifi size={22} /></button><button aria-label="Notifications"><Bell size={22} /></button><button aria-label="Menu"><Menu size={24} /></button>
        </div>
      </header>

      <div className="mx-5 mt-2 flex min-h-[54px] shrink-0 items-center rounded border border-[#d5d5d5] bg-[#f2f2ef] px-4 py-1">
        <div><h2 className="text-[14px] font-bold leading-5">Writing Test</h2><p className="text-[14px] leading-5">Complete both tasks. You should spend about 20 minutes on Task 1 and 40 minutes on Task 2.</p></div>
      </div>

      <section className="mx-5 my-3 flex min-h-0 flex-1 flex-col overflow-hidden border border-[#c9c9c9]">
        <div className="flex shrink-0 items-center gap-2 border-b border-[#d5d5d5] bg-white px-4 py-2">
          {[1, 2].map((task) => <button key={task} onClick={() => setActiveTask(task as 1 | 2)} className={`rounded-sm border px-4 py-2 text-[14px] font-bold ${activeTask === task ? "border-[#2185d0] bg-[#eaf4fc] text-black" : "border-transparent hover:bg-[#f2f2f2]"}`} aria-current={activeTask === task ? "page" : undefined}>Task {task}</button>)}
          <span className="ml-auto text-[13px] text-[#444]">Task {activeTask} of 2</span>
        </div>

        <div className="relative grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-3 overflow-hidden p-3 lg:grid-cols-[minmax(0,var(--writing-left))_12px_minmax(0,var(--writing-right))] lg:grid-rows-1 lg:gap-4" style={{ "--writing-left": `${paneSplit}fr`, "--writing-right": `${100 - paneSplit}fr` } as CSSProperties}>
          {isFinished && <div role="status" className="absolute left-1/2 top-[132px] z-10 -translate-x-1/2 rounded border border-[#8abf91] bg-[#eff8f0] px-4 py-2 text-[14px] shadow">Writing test completed. Your answers are saved.</div>}

          <div className="min-h-0 overflow-y-auto rounded border border-[#d5d5d5] bg-white p-4" aria-label="Writing task prompt area">
            {activeTask === 1 && testPrompt ? <article className="space-y-4 text-[15px] leading-6">
              <h3 className="font-bold">WRITING TASK 1</h3>
              <p>You should spend about 20 minutes on this task.<br />You should write at least 150 words.</p>
              <h2 className="font-bold">{testPrompt.task1.title}</h2>
              <p>{testPrompt.task1.prompt}</p>
              <p>{testPrompt.task1.instruction}</p>
              <Image src={testPrompt.task1.image.src} alt={testPrompt.task1.image.alt} width={testPrompt.task1.image.width} height={testPrompt.task1.image.height} sizes="(min-width: 1024px) 45vw, 90vw" className="mx-auto h-auto max-w-full" />
            </article> : activeTask === 2 && testPrompt ? <article className="space-y-4 text-[15px] leading-6">
              <h3 className="font-bold">WRITING TASK 2</h3>
              <p>You should spend about 40 minutes on this task.<br />You should write at least 250 words.</p>
              <h2 className="font-bold">{testPrompt.task2.title}</h2>
              <p className="whitespace-pre-line">{testPrompt.task2.prompt}</p>
              <p>{testPrompt.task2.instruction}</p>
            </article> : null}
          </div>

          <div role="separator" aria-label="Resize task and writing panels" aria-orientation="vertical" aria-valuemin={25} aria-valuemax={75} aria-valuenow={Math.round(paneSplit)} tabIndex={0} onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)} onPointerMove={movePaneDivider} onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)} onPointerCancel={(event) => event.currentTarget.releasePointerCapture(event.pointerId)} onKeyDown={(event) => { if (event.key === "ArrowLeft") setPaneSplit((value) => Math.max(25, value - 2)); if (event.key === "ArrowRight") setPaneSplit((value) => Math.min(75, value + 2)); }} className="relative hidden cursor-col-resize touch-none outline-none focus-visible:ring-2 focus-visible:ring-[#2185d0] lg:block">
            <span className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 bg-[#999]" /><span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-[#555] bg-white text-[20px] leading-none shadow-sm">↔</span>
          </div>

          <div className="flex min-h-0 flex-col rounded border border-[#d5d5d5] bg-white p-4">
            <label htmlFor={`writing-task-${activeTask}`} className="mb-2 text-[14px] font-bold">Your answer</label>
            <textarea spellCheck={false} autoCorrect="off" autoCapitalize="off" autoComplete="off" data-gramm="false" data-gramm_editor="false" data-enable-grammarly="false" disabled={!isReady || isFinished || isSubmitting || timeLeft===0} id={`writing-task-${activeTask}`} value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type your answer here…" className="min-h-0 flex-1 resize-none rounded-sm border border-[#888] bg-white p-3 text-[16px] leading-6 outline-none focus:border-[#2185d0] focus:ring-1 focus:ring-[#2185d0]" />
            <div className="mt-2 self-end text-[13px] text-[#444]">Word count: {answer.trim() ? answer.trim().split(/\s+/).length : 0}</div>
          </div>
        </div>
      </section>

      {submissionError&&<p role="alert" className="border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800">{submissionError}</p>}
      <footer data-ielts-test-footer className="flex h-[46px] shrink-0 items-center justify-between border-t border-[#d5d5d5] bg-[#f2f2f2] px-5">
        <div className="flex items-center gap-4 text-[14px] font-bold"><span>Writing</span>{[1, 2].map((task) => <button key={task} onClick={() => setActiveTask(task as 1 | 2)} className={`min-w-7 rounded-sm px-2 py-1 ${activeTask === task ? "border border-[#2185d0] bg-white" : "hover:bg-white"}`} aria-label={`Go to Task ${task}`}>{task}</button>)}</div>
        <div className="flex gap-2"><button onClick={() => setActiveTask(activeTask === 2 ? 1 : 2)} className="rounded-sm bg-black px-4 py-2 text-[14px] font-bold text-white hover:bg-[#333]">{activeTask === 1 ? "Next Task →" : "← Previous Task"}</button></div>
      </footer>
    </main>
  );
}
