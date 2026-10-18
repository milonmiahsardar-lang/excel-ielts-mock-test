"use client";

import PartNavigation from "./PartNavigation";

import { useState, type PointerEvent as ReactPointerEvent } from "react";
import { Wifi, Bell, Menu, NotebookPen } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import TestOneReading from "./TestOneReading";
import TestTwoReading from "./TestTwoReading";
import TestThreeReading from "./TestThreeReading";
import TestFourReading from "./TestFourReading";
import TestFiveReading from "./TestFiveReading";
import TestSixReading from "./TestSixReading";
import ImportedReadingTests from "./ImportedReadingTests";
import ReadingTestsElevenToFifteen from "./ReadingTestsElevenToFifteen";
import ReadingTestsSixteenToTwenty from "./ReadingTestsSixteenToTwenty";

import { saveSection, useAnswerDraft, useCountdown } from "@/lib/results/client";

export default function TestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const testNumber = searchParams.get("test") || "1";

  const [currentSection, setCurrentSection] = useState(1);
  const timeLeft = useCountdown(testNumber,"reading",testNumber==="1");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [paneSplit, setPaneSplit] = useState(50);
  const draftReady=useAnswerDraft("reading",testNumber,answers,setAnswers,testNumber==="1");

  const movePaneDivider = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!bounds || bounds.width === 0) return;
    const percentage = ((event.clientX - bounds.left) / bounds.width) * 100;
    setPaneSplit(Math.min(75, Math.max(25, percentage)));
  };

  const handleAnswer = (questionNumber: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionNumber]: answer,
    }));
  };

  const goToSection = (section: number) => {
    setCurrentSection(section);
  };

  const scrollToQuestion = (number: number) => {
    const element = document.getElementById("question-" + number);

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const handleContinueToWriting = async () => {
    sessionStorage.setItem("ieltsAnswers", JSON.stringify(answers));
    try { await saveSection("reading",testNumber,answers,true);router.replace(`/listening/instructions?test=${testNumber}`); }catch(error){window.alert((error as Error).message);}
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, "0");

  if (testNumber === "2") return <TestTwoReading />;
  if (testNumber === "3") return <TestThreeReading />;
  if (testNumber === "4") return <TestFourReading />;
  if (testNumber === "5") return <TestFiveReading />;
  if (testNumber === "6") return <TestSixReading />;
  if (["7", "8", "9", "10"].includes(testNumber)) return <ImportedReadingTests key={testNumber} testNumber={Number(testNumber)} />;
  if (["11", "12", "13", "14", "15"].includes(testNumber)) return <ReadingTestsElevenToFifteen key={testNumber} testNumber={Number(testNumber)} />;
  if (["16", "17", "18", "19", "20"].includes(testNumber)) return <ReadingTestsSixteenToTwenty key={testNumber} testNumber={Number(testNumber)} />;

  return (
    <div inert={!draftReady} aria-busy={!draftReady} className="h-screen flex flex-col bg-white text-black" style={{ fontFamily: "Arial, sans-serif" }}>

      {/* IELTS TEST HEADER */}
      <header className="h-[56px] shrink-0 bg-white border-y border-[#d5d5d5] px-4 flex items-center justify-between">
        <div className="flex items-center gap-7">
          <div className="text-[32px] leading-none font-black tracking-[-2.5px] text-[#e31837]">IELTS<sup className="text-[9px] tracking-normal align-top ml-[-2px]">™</sup></div>
          <div className="self-start mt-1 text-[14px] leading-5 font-bold">Test taker ID<div className="font-normal text-[13px]">Time remaining: {minutes}:{seconds}</div></div>
        </div>
        <div className="flex items-center gap-5 text-[#222]">
          
          <button aria-label="Notes" title="Notes"><NotebookPen size={22} /></button>
          <button aria-label="Connection status"><Wifi size={22} /></button>
          <button aria-label="Notifications"><Bell size={22} /></button>
          <button aria-label="Menu"><Menu size={24} /></button>
        </div>
      </header>

      <div className="mx-5 mt-2 mb-1 min-h-[58px] shrink-0 rounded border border-[#d5d5d5] bg-[#f2f2ef] px-4 py-1 text-black">
        <h2 className="text-[14px] leading-5 font-bold">Part {currentSection}</h2>
        <p className="text-[14px] leading-5">
          Read the text and answer questions {currentSection === 1 ? "1–13" : currentSection === 2 ? "14–26" : "27–40"}.
        </p>
      </div>
      {/* SECTION CONTENT */}

      <div className="relative flex-1 flex overflow-hidden bg-white">
        <section style={{ width: `${paneSplit}%` }} className="h-full min-w-0 shrink-0 overflow-y-auto border-r border-[#999] bg-white" aria-label="Reading passage area">
          {testNumber === "1" && currentSection <= 3 && <TestOneReading pane="passage" section={currentSection} answers={answers} onAnswer={handleAnswer} />}
        </section>
        <section style={{ width: `${100 - paneSplit}%` }} className="h-full min-w-0 shrink-0 overflow-y-auto bg-white" aria-label="Reading question area">
          {testNumber === "1" && currentSection <= 3 && <TestOneReading pane="questions" section={currentSection} answers={answers} onAnswer={handleAnswer} />}
        </section>
        <div role="separator" aria-label="Resize passage and question panels" aria-orientation="vertical" aria-valuemin={25} aria-valuemax={75} aria-valuenow={Math.round(paneSplit)} tabIndex={0} onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)} onPointerMove={movePaneDivider} onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)} onPointerCancel={(event) => event.currentTarget.releasePointerCapture(event.pointerId)} onKeyDown={(event) => { if (event.key === "ArrowLeft") setPaneSplit((value) => Math.max(25, value - 2)); if (event.key === "ArrowRight") setPaneSplit((value) => Math.min(75, value + 2)); }} style={{ left: `${paneSplit}%` }} className="absolute top-0 z-20 h-full w-3 -translate-x-1/2 cursor-col-resize touch-none outline-none focus-visible:ring-2 focus-visible:ring-[#2185d0]"><span className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 bg-[#999]" /><span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-[#555] bg-white text-[20px] leading-none shadow-sm">↔</span></div>
      </div>
      {/* BOTTOM QUESTION NAVIGATION */}

      <PartNavigation current={currentSection} total={3} onChange={goToSection} />
      <div data-ielts-test-footer className="relative bg-white border-t border-[#d5d5d5] px-3 py-1">

        <div className="grid w-full grid-cols-3 items-center justify-items-center gap-x-8">

          {/* SECTION 1 */}

          <div className="flex flex-col items-center gap-0">

            <button
              onClick={() => goToSection(1)}
              className={
                currentSection === 1
                  ? "font-bold text-[#111] mb-0 text-[14px]"
                  : "font-bold text-[#111] mb-0 text-[14px]"
              }
            >
              Passage 1
            </button>

            {testNumber === "1" && <div className="mt-1 flex flex-wrap justify-center gap-1">

              {Array.from({ length: 13 }, (_, index) => {
                const number = index + 1;

                return (
                  <button
                    key={number}
                    onClick={() => {
                      setCurrentSection(1);
                      setTimeout(() => scrollToQuestion(number), 50);
                    }}
                    className={
                      answers[number]
                        ? "h-6 min-w-6 rounded-sm border border-[#2185d0] font-semibold bg-white text-[#111] text-[13px]"
                        : "h-6 min-w-6 rounded-sm border border-transparent font-normal bg-white text-[#111] hover:border-[#2185d0] text-[13px]"
                    }
                  >
                    {number}
                  </button>
                );
              })}

            </div>}

          </div>


          {/* SECTION 2 */}

          <div className="flex flex-col items-center gap-0">

            <button
              onClick={() => goToSection(2)}
              className={
                currentSection === 2
                  ? "font-bold text-[#111] mb-0 text-[14px]"
                  : "font-bold text-[#111] mb-0 text-[14px]"
              }
            >
              Passage 2
            </button>

            {testNumber === "1" && <div className="mt-1 flex flex-wrap justify-center gap-1">

              {Array.from({ length: 13 }, (_, index) => {
                const number = index + 14;

                return (
                  <button
                    key={number}
                    onClick={() => {
                      setCurrentSection(2);
                      setTimeout(() => scrollToQuestion(number), 50);
                    }}
                    className={
                      answers[number]
                        ? "h-6 min-w-6 rounded-sm border border-[#2185d0] font-semibold bg-white text-[#111] text-[13px]"
                        : "h-6 min-w-6 rounded-sm border border-transparent font-normal bg-white text-[#111] hover:border-[#2185d0] text-[13px]"
                    }
                  >
                    {number}
                  </button>
                );
              })}

            </div>}

          </div>


          {/* SECTION 3 */}

          <div className="flex flex-col items-center gap-0">

            <button
              onClick={() => goToSection(3)}
              className={
                currentSection === 3
                  ? "font-bold text-[#111] mb-0 text-[14px]"
                  : "font-bold text-[#111] mb-0 text-[14px]"
              }
            >
              Passage 3
            </button>

            {testNumber === "1" && <div className="mt-1 flex flex-wrap justify-center gap-1">

              {Array.from({ length: 14 }, (_, index) => {
                const number = index + 27;

                return (
                  <button
                    key={number}
                    onClick={() => {
                      setCurrentSection(3);
                      setTimeout(() => scrollToQuestion(number), 50);
                    }}
                    className={
                      answers[number]
                        ? "h-6 min-w-6 rounded-sm border border-[#2185d0] font-semibold bg-white text-[#111] text-[13px]"
                        : "h-6 min-w-6 rounded-sm border border-transparent font-normal bg-white text-[#111] hover:border-[#2185d0] text-[13px]"
                    }
                  >
                    {number}
                  </button>
                );
              })}

            </div>}

          </div>

        </div>

        {/* SUBMIT */}

{/* FINISH BUTTON MOVED TO TOP */}

      </div>

    </div>
  );
}




