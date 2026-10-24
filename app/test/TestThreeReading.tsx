"use client";

import PartNavigation from "./PartNavigation";
import { HeadingBank, HeadingDrop } from "./HeadingDragAndDrop";

import { SummaryGap } from "./SummaryWithoutClues";

import { saveSection, useAnswerDraft, useCountdown } from "@/lib/results/client";

import { useState, type PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import { Bell, Menu, NotebookPen, Wifi } from "lucide-react";
import { testThreePassages } from "./test3-reading-data";

function splitParagraphs(text: string) {
  return text.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

const deerHeadings = [
  ["i", "Regulatory Bodies and Trade Associations"], ["ii", "Disease Affects Profits"], ["iii", "The Threat of Disease"],
  ["iv", "Introduction and Spread of Deer Species"], ["v", "Government Assistance"], ["vi", "Investment Feeds New Development"],
  ["vii", "Asian Competition"], ["viii", "Trends in Production"], ["ix", "Disease Prevention and Treatment"],
] as const;
const thamesAgencies = [
  ["A", "The Environment Agency"], ["B", "Transport for London"], ["C", "The Greater London Council"],
  ["D", "Thames Water"], ["E", "Port of London"], ["F", "Local boroughs"],
] as const;

const paragraphHeadingGroup = {
  options: deerHeadings.map(([label, text]) => ({ label, text })),
  questions: "BCDEF".split("").map((letter, index) => ({ number: index + 14, prompt: "Paragraph " + letter })),
};

export default function TestThreeReading() {
  const router = useRouter();
  const [passageIndex, setPassageIndex] = useState(0);
  const timeLeft = useCountdown(3, "reading");
  const [paneSplit, setPaneSplit] = useState(50);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const draftReady=useAnswerDraft("reading",3,answers,setAnswers);
  const passage = testThreePassages[passageIndex];

  const movePaneDivider = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!bounds || bounds.width === 0) return;
    setPaneSplit(Math.min(75, Math.max(25, ((event.clientX - bounds.left) / bounds.width) * 100)));
  };

const handleContinue = async () => {
    sessionStorage.setItem("ieltsAnswersTest3Reading", JSON.stringify(answers));
    try { await saveSection("reading",3,answers,true); router.replace("/listening/instructions?test=3"); } catch(error){window.alert((error as Error).message);}
  };
  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, "0");
  const setAnswer = (number: number, value: string) => setAnswers((current) => ({ ...current, [number]: value }));
  const numberBadge = (number: number) => <span className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-sm border border-[#2185d0] bg-white px-1 font-medium leading-none">{number}</span>;
  const headingAnswer = (number: number) => <select id={`answer-${number}`} aria-label={`Answer for question ${number}`} value={answers[number] || ""} onChange={(event) => setAnswer(number, event.target.value)} className="w-48 max-w-full border border-gray-400 bg-white px-2 py-1 outline-none focus:border-[#2185d0]"><option value="">Select</option>{deerHeadings.map(([key, label]) => <option key={key} value={key}>{key} — {label}</option>)}</select>;
  const agencyAnswer = (number: number) => <select id={`answer-${number}`} aria-label={`Answer for question ${number}`} value={answers[number] || ""} onChange={(event) => setAnswer(number, event.target.value)} className="w-48 max-w-full border border-gray-400 bg-white px-2 py-1 outline-none focus:border-[#2185d0]"><option value="">Select</option>{thamesAgencies.map(([key, label]) => <option key={key} value={key}>{key} — {label}</option>)}</select>;
  const summaryInput = (number: number) => number >= 7 && number <= 13 ? <SummaryGap number={number} answers={answers} onAnswer={setAnswer} /> : <><span className="mx-1 font-semibold">{number}.</span><input id={`question-${number}`} aria-label={`Answer for question ${number}`} value={answers[number] || ""} onChange={(event) => setAnswer(number, event.target.value)} className="mx-1 inline-block h-[42px] w-[198px] max-w-full border border-[#2185d0] bg-white px-2 align-middle outline-none focus:border-[#2185d0]" autoComplete="off" /></>;

  const questions = <div className="space-y-8 px-5 py-5 text-[16px] leading-7">
    <section className="space-y-5" aria-label="Questions 1 to 6">
      <h2 className="font-bold">Questions 1–6</h2>
      <p>Choose <b>TRUE</b> if the statement agrees with the information given in the text, choose <b>FALSE</b> if the statement contradicts the information, or choose <b>NOT GIVEN</b> if there is no information on this.</p>
      {[
        "Mindfulness is a relatively new topic of study.",
        "The original practice of mindfulness differed from its current application.",
        "Jon Kabat-Zinn came from a religious background.",
        "Kabat-Zinn’s clinic aimed to help people with a range of problems.",
        "Mindfulness enables people to increase their fight or flight response.",
        "Kabat-Zinn believes criticism of Western mindfulness practice is unjustified.",
      ].map((statement, index) => { const number = index + 1; return <div id={`question-${number}`} key={number} className="scroll-m-6 space-y-3 py-4"><div className="flex items-start gap-3 leading-7">{numberBadge(number)}<p className="min-w-0 pt-0.5">{statement}</p></div><div className="space-y-3 pl-11">{["TRUE", "FALSE", "NOT GIVEN"].map((option) => <label key={option} className="flex cursor-pointer items-start gap-3 py-1 leading-6"><input className="mt-1.5" type="radio" name={`question-${number}`} value={option} checked={answers[number] === option} onChange={() => setAnswer(number, option)} /><span>{option}</span></label>)}</div></div>; })}
    </section>
    <section className="space-y-5" aria-label="Questions 7 to 13">
      <h2 className="font-bold">Questions 7–13</h2>
      <p>Complete the summary below.</p>
      <p>Write <b>NO MORE THAN TWO WORDS</b> from the text for each answer.</p>
      <h3 className="pt-2 text-center font-bold">Assessing mindfulness</h3>
      <p className="py-2 leading-9">Mindfulness has been proven to have a positive impact on people’s wellbeing. One study in 2013 showed patients responding positively to {summaryInput(7)} involving mindfulness. This is due to a reduction in the size of the {summaryInput(8)}, which makes us react to danger. Mindfulness can also help cancer patients with negative emotions following {summaryInput(9)}.</p>
      <p className="py-2 leading-9">Many companies are dealing with their workers’ mental health issues by making {summaryInput(10)} responsible for mental well-being. Two writers give many examples of the {summaryInput(11)} of mindfulness. While the practice is intended to reduce {summaryInput(12)} and depression, some argue that it may be the cause of those conditions. Jon Kabat-Zinn sees mindfulness’s current shortfalls being a need for {summaryInput(13)} and lack of funding.</p>
  </section>
  </div>;

  const thamesQuestions = <div className="space-y-8 px-5 py-5 text-[16px] leading-7">
    <section className="space-y-5" aria-label="Questions 27 to 32">
      <h2 className="font-bold">Questions 27–32</h2>
      <p>Choose the agency that is responsible for each activity.</p>
      <p>Choose the correct letter <b>A–F</b> for each answer.</p>
      <div className="mx-auto w-fit min-w-48 max-w-full space-y-2 border border-[#aaa] bg-white px-8 py-4"><h3 className="text-center font-bold">Agencies</h3>{thamesAgencies.map(([key, label]) => <p key={key} className="py-1"><b className="mr-2">{key}.</b>{label}</p>)}</div>
      {[
        "Operating the Rubbish Muncher",
        "Creating community strategies",
        "Monitoring the cleanliness of the river",
        "Collecting solid waste from the tideway",
        "Creating enlarged sewage works",
        "Controlling traffic on the river",
      ].map((activity, index) => { const number = index + 27; return <div id={`question-${number}`} key={number} className="grid scroll-m-6 grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2 py-3 leading-7 sm:grid-cols-[2rem_minmax(0,1fr)_12rem]">{numberBadge(number)}<p className="min-w-0">{activity}</p><div className="col-start-2 sm:col-start-3">{agencyAnswer(number)}</div></div>; })}
    </section>
    <section className="space-y-5" aria-label="Questions 33 to 40">
      <h2 className="font-bold">Questions 33–40</h2>
      <p>Do the following statements agree with the views of the writer of the text? Choose <b>YES</b>, <b>NO</b> or <b>NOT GIVEN</b>.</p>
      {[
        "The Thames is now cleaner than it was in 1900.",
        "Swimming in the Thames now poses no health hazards.",
        "It is now mainly the responsibility of those who pollute the Thames to clean their waste up.",
        "All London boroughs that the Thames passes through are now partly responsible for keeping the river clean.",
        "Transport for London now employs a type of River Police to enforce control of their regulations.",
        "Rubbish Munchers are now situated at various locations on the Thames.",
        "Previously no one department had overall responsibility or control for monitoring the cleanliness of the Thames.",
        "British Waterways will no longer have any part in keeping the Thames clean.",
      ].map((statement, index) => { const number = index + 33; return <div id={`question-${number}`} key={number} className="scroll-m-6 space-y-3 py-4"><div className="flex items-start gap-3 leading-7">{numberBadge(number)}<p className="min-w-0 pt-0.5">{statement}</p></div><div className="space-y-3 pl-11">{["YES", "NO", "NOT GIVEN"].map((option) => <label key={option} className="flex cursor-pointer items-start gap-3 py-1 leading-6"><input className="mt-1.5" type="radio" name={`question-${number}`} value={option} checked={answers[number] === option} onChange={() => setAnswer(number, option)} /><span>{option}</span></label>)}</div></div>; })}
    </section>
  </div>;

  const deerQuestions = <div className="space-y-8 px-5 py-5 text-[16px] leading-7">
    <section className="space-y-5" aria-label="Questions 14 to 18">
      <h2 className="font-bold">Questions 14–18</h2>
      <p>The text has six paragraphs.</p>
      <p>Choose the correct headings for paragraphs B–F. Choose the appropriate number, i–ix.</p>
      <p>Example: Paragraph A — iv</p>
      <h3 className="font-bold">List of Headings</h3><HeadingBank scope="reading-3-headings" group={paragraphHeadingGroup} answers={answers} onAnswer={setAnswer} />
    </section>
    <section className="space-y-5" aria-label="Questions 19 to 23">
      <h2 className="font-bold">Questions 19–23</h2>
      <p>Choose <b>TRUE</b> if the statement agrees with the information in the passage, <b>FALSE</b> if it contradicts the information, or <b>NOT GIVEN</b> if there is no information on this.</p>
      {[
        "Until 1985 only two species of the originally released Australian deer were not used for farming.",
        "Since 1985 many imported deer have been interbred with the established herds.",
        "Both deer numbers and the price of venison have continually climbed since 2007.",
        "Only a small amount of Australian venison production is consumed domestically.",
        "International investment has had a positive effect on the recovery of the Australian deer industry.",
      ].map((statement, index) => { const number = index + 19; return <div id={`question-${number}`} key={number} className="scroll-m-6 space-y-3 py-4"><div className="flex items-start gap-3 leading-7">{numberBadge(number)}<p className="min-w-0 pt-0.5">{statement}</p></div><div className="space-y-3 pl-11">{["TRUE", "FALSE", "NOT GIVEN"].map((option) => <label key={option} className="flex cursor-pointer items-start gap-3 py-1 leading-6"><input className="mt-1.5" type="radio" name={`question-${number}`} value={option} checked={answers[number] === option} onChange={() => setAnswer(number, option)} /><span>{option}</span></label>)}</div></div>; })}
    </section>
    <section className="space-y-5" aria-label="Questions 24 to 26">
      <h2 className="font-bold">Questions 24–26</h2>
      <p>Complete the sentences below. Use <b>NO MORE THAN THREE WORDS</b> from the text for each answer.</p>
      <p className="py-2 leading-9">A stringent {summaryInput(24)} allows the Australian deer industry to maintain its excellence of product.</p>
      <p className="py-2 leading-9">Herd stock expansion is made difficult by the killing of {summaryInput(25)}, which in turn affects the product supply.</p>
      <p className="py-2 leading-9">Foreign and home markets for Australian venison increased due to the {summaryInput(26)}.</p>
    </section>
  </div>;

  return (
    <main inert={!draftReady} aria-busy={!draftReady} className="flex h-screen flex-col bg-white text-black" style={{ fontFamily: "Arial, sans-serif" }}>
      <header className="flex h-[56px] shrink-0 items-center justify-between border-y border-[#d5d5d5] bg-white px-4">
        <div className="flex items-center gap-7">
          <div className="text-[32px] font-black leading-none tracking-[-2.5px] text-[#e31837]">IELTS<sup className="ml-[-2px] align-top text-[9px] tracking-normal">™</sup></div>
          <div className="self-start mt-1 text-[14px] font-bold leading-5">Test taker ID<div className="text-[13px] font-normal">Time remaining: {minutes}:{seconds}</div></div>
        </div>
        <div className="flex items-center gap-5 text-[#222]">
          
          <button aria-label="Notes" title="Notes"><NotebookPen size={22} /></button>
          <button aria-label="Connection status"><Wifi size={22} /></button>
          <button aria-label="Notifications"><Bell size={22} /></button>
          <button aria-label="Menu"><Menu size={24} /></button>
        </div>
      </header>

      <div className="mx-5 mt-2 mb-1 min-h-[58px] shrink-0 rounded border border-[#d5d5d5] bg-[#f2f2ef] px-4 py-1">
        <h2 className="text-[14px] font-bold leading-5">Part {passageIndex + 1}</h2>
        <p className="text-[14px] leading-5">{passageIndex === 0 ? "Read the text and answer questions 1–13." : passageIndex === 1 ? "Read the text and answer questions 14–26." : "Read the text and answer questions 27–40."}</p>
      </div>

      <div className="relative flex min-h-0 flex-1 overflow-hidden bg-white">
        <section className="h-full min-w-0 shrink-0 overflow-y-auto border-r border-[#999] bg-white" style={{ width: `${paneSplit}%` }} aria-label={`Reading Passage ${passageIndex + 1}`}>
          <article className="space-y-4 px-5 py-4 text-[16px] leading-6">
            <h2 className="text-center text-xl font-bold">{passage.title}</h2>
            {splitParagraphs(passage.text).map((paragraph, index) => {
              const section = paragraph.match(/^([A-H])\.\s*([\s\S]*)$/);
              return <section key={index} className="space-y-2">{section ? <><div className="flex items-center gap-2"><h3 className="shrink-0 font-bold">{section[1]}</h3>{passageIndex === 1 && <HeadingDrop scope="reading-3-headings" group={paragraphHeadingGroup} paragraph={section[1]} answers={answers} onAnswer={setAnswer} />}</div><p>{section[2]}</p></> : <p>{paragraph}</p>}</section>;
            })}
          </article>
        </section>
        <section className="h-full min-w-0 shrink-0 overflow-y-auto bg-white pb-20" style={{ width: `${100 - paneSplit}%` }} aria-label="Reading questions">{passageIndex === 0 ? questions : passageIndex === 1 ? deerQuestions : thamesQuestions}</section>
        <div role="separator" aria-label="Resize passage and question panels" aria-orientation="vertical" aria-valuemin={25} aria-valuemax={75} aria-valuenow={Math.round(paneSplit)} tabIndex={0} onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)} onPointerMove={movePaneDivider} onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)} onPointerCancel={(event) => event.currentTarget.releasePointerCapture(event.pointerId)} onKeyDown={(event) => { if (event.key === "ArrowLeft") setPaneSplit((value) => Math.max(25, value - 2)); if (event.key === "ArrowRight") setPaneSplit((value) => Math.min(75, value + 2)); }} style={{ left: `${paneSplit}%` }} className="absolute top-0 z-20 h-full w-3 -translate-x-1/2 cursor-col-resize touch-none outline-none focus-visible:ring-2 focus-visible:ring-[#2185d0]"><span className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 bg-[#999]" /><span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-[#555] bg-white text-[20px] leading-none shadow-sm">↔</span></div>
      </div>

      <PartNavigation floating current={passageIndex + 1} total={3} onChange={(part) => setPassageIndex(part - 1)} />
      <footer data-ielts-test-footer className="grid shrink-0 grid-cols-3 items-center justify-items-center gap-4 border-t border-[#d5d5d5] bg-white px-3 py-2">
        {testThreePassages.map((item, index) => { const start = index === 0 ? 1 : index === 1 ? 14 : 27; const count = 13 + (index === 2 ? 1 : 0); return <div key={item.title} className="flex flex-col items-center"><button type="button" onClick={() => setPassageIndex(index)} aria-current={passageIndex === index ? "page" : undefined} className={`px-3 py-1 text-[14px] ${passageIndex === index ? "font-bold text-[#111]" : "font-normal text-[#111] hover:underline"}`}>Passage {index + 1}</button><div className="mt-1 flex flex-wrap justify-center gap-1">{Array.from({ length: count }, (_, offset) => { const number = start + offset; return <button key={number} type="button" onClick={() => { setPassageIndex(index); window.setTimeout(() => document.getElementById(`question-${number}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50); }} className={`h-6 min-w-6 rounded-sm border px-0.5 text-[13px] ${answers[number] ? "border-[#2185d0] font-semibold" : "border-transparent hover:border-[#2185d0]"}`}>{number}</button>; })}</div></div>; })}
      </footer>
    </main>
  );
}
