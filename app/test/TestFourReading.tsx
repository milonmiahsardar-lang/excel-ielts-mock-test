"use client";

import PartNavigation from "./PartNavigation";
import SentenceEndings from "./SentenceEndings";
import { HeadingBank, HeadingDrop } from "./HeadingDragAndDrop";

import { saveSection, useAnswerDraft, useCountdown } from "@/lib/results/client";

import { useState, type PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import { Bell, Menu, NotebookPen, Wifi } from "lucide-react";
import { testFourPassages } from "./test4-reading-data";

function splitParagraphs(text: string) {
  return text.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
}

const headings = ["Easy publicity", "Increasing outbreaks of disease", "Some real reasons", "All or nothing", "Autism on the rise", "Past successes", "A sad consequence", "An unfortunate coincidence", "A simple explanation", "Some dubious evidence"];
const roman = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];
const mcOptions = [
  ["sometimes caused by vaccinations.", "a very subtle neurological disorder.", "most likely inherited.", "increasing."],
  ["the cause of falling vaccination rates.", "defended by the medical journal.", "verified by other studies.", "funded by patients."],
  ["have removed most smallpox from the world.", "are supported by solid evidence.", "are defended on some websites.", "are no longer necessary."],
  ["believe vaccinations are generally good.", "can be impersonal and uncaring.", "are often supported by politicians.", "are often quite cheap."],
];
const reasons = ["Believing they cause problems", "Wanting to save money", "Wanting freedom of choice", "Not believing drug manufacturers", "The pain of vaccinations", "The influence of creationists", "Preferring alternative medicine"];

const paragraphHeadingGroup = {
  options: headings.map((text, index) => ({ label: roman[index], text })),
  questions: "BCDEFGH".split("").map((letter, index) => ({ number: index + 27, prompt: "Paragraph " + letter })),
};

export default function TestFourReading() {
  const router = useRouter();
  const [passageIndex, setPassageIndex] = useState(0);
  const timeLeft = useCountdown(4, "reading");
  const [paneSplit, setPaneSplit] = useState(50);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const draftReady=useAnswerDraft("reading",4,answers,setAnswers);
  const passage = testFourPassages[passageIndex];
  const setAnswer = (number: number, value: string) => setAnswers((current) => ({ ...current, [number]: value }));
  const toggleReason = (letter: string) => setAnswers((current) => {
    const selected = [current[34],current[35],current[36]].filter(Boolean);
    const next=selected.includes(letter)?selected.filter(item=>item!==letter):selected.length<3?[...selected,letter]:selected;
    return {...current,34:next[0]||"",35:next[1]||"",36:next[2]||""};
  });
  const movePaneDivider = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!bounds || bounds.width === 0) return;
    setPaneSplit(Math.min(75, Math.max(25, ((event.clientX - bounds.left) / bounds.width) * 100)));
  };
const handleContinue = async () => {
    sessionStorage.setItem("ieltsAnswersTest4Reading", JSON.stringify(answers));
    try { await saveSection("reading",4,answers,true); router.replace("/listening/instructions?test=4"); } catch(error){window.alert((error as Error).message);}
  };
  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, "0");

  const passageOneQuestions = <div className="space-y-8 px-5 py-5 text-[16px] leading-7">
    <section className="space-y-5" aria-label="Questions 1 to 6"><h2 className="font-bold">Questions 1–6</h2><p>Choose the correct answer.</p><p>Choose one answer for each question.</p>{[["RSS stands for", ["Relationship Stress Syndrome", "Relocation Sickness Syndrome", "Relocation Stress Symptoms", "Relocation Stress Syndrome"]], ["When Dr Molveldt fell ill in 2009,", ["she was worried she had psychological problems.", "no one could work out what was wrong with her.", "she thought she missed Pietermaritzburg.", "she realised she had RSS."]], ["As part of her RSS, Dr Molveldt’s old neighbour", ["had backache.", "had headaches.", "had skin problems.", "was happy one day but sad the next."]], ["Initially, Dr Molveldt’s data came from", ["patients of medical practices and hospital emergency departments.", "hospital emergency department patients only.", "patients of medical practices only.", "other research."]], ["In Dr Molveldt’s study, the relationship between the number of people who move house in the general population and those who also visit a doctor within one month of relocation is", ["twice as many.", "three times as many.", "half as many.", "two-thirds as many."]], ["Some of Dr Molveldt’s data on serious accidents came from", ["a Pietermaritzburg database.", "Durban and Cape Town databases.", "a database for all South Africa.", "international databases."]]].map(([prompt, options], index) => { const number = index + 1; return <div id={`question-${number}`} key={number} className="scroll-m-6 space-y-2 py-2"><h3 className="font-semibold">{number}. {prompt}</h3>{(options as string[]).map((option) => <label key={option} className="flex cursor-pointer items-center gap-5 py-1"><input type="radio" name={`question-${number}`} checked={answers[number] === option} onChange={() => setAnswer(number, option)} /><span>{option}</span></label>)}</div>; })}</section>
    <section className="space-y-5" aria-label="Questions 7 to 13"><h2 className="font-bold">Questions 7–13</h2><p>Complete each sentence with the correct ending, A–J, below.</p><p>Choose the correct ending for each question.</p><SentenceEndings questions={["Some people who had had accidents due to alcohol", "Serious accident rates and relocation rates", "Dr Molveldt thinks moving house is more stressful", "Test subjects and Dr Molveldt", "According to Dr Molveldt, relationship breakdown", "Children suffer most when moving if", "Both the writer and Dr Molveldt suggest"].map((prompt, index) => ({ number: index + 7, prompt }))} options={["was one result of relocation.", "had also recently moved house.", "was unlikely to be caused by moving.", "than having a baby.", "their family is also split up at the same time.", "disagreed about the stress caused by moving.", "than getting married.", "were no higher than other categories.", "they go to new schools.", "people should consider moving very carefully."].map((text, index) => ({ label: String.fromCharCode(65 + index), text }))} answers={answers} onAnswer={setAnswer} /></section>
  </div>;  const passageThreeQuestions = <div className="space-y-8 px-5 py-5 text-[16px] leading-7">
    <section className="space-y-5" aria-label="Questions 27 to 33">
      <h2 className="font-bold">Questions 27–33</h2>
      <p>Reading Passage Three has seven paragraphs, A–H.</p>
      <p>Choose the correct heading for Paragraphs B–H from the list of headings.</p>
      <p>Choose the correct number, i–x, for each answer.</p>
      <h3 className="font-bold">List of Headings</h3><HeadingBank scope="reading-4-headings" group={paragraphHeadingGroup} answers={answers} onAnswer={setAnswer} />
    </section>
    <section id="question-34" className="space-y-5" aria-label="Questions 34 to 36">
      <h2 className="font-bold">Questions 34–36</h2>
      <p>Choose <b>THREE</b> answers from the list and choose the correct letter, A–G, next to the questions.</p>
      <p>For which <b>THREE</b> reasons, A–G, do anti-vaccinationists oppose vaccinations?</p>
      {reasons.map((option, index) => { const letter = String.fromCharCode(65 + index); const selected = [answers[34],answers[35],answers[36]].includes(letter); return <label key={letter} className="flex cursor-pointer items-center gap-5 py-1"><input type="checkbox" checked={Boolean(selected)} onChange={() => toggleReason(letter)} /><span>{option}</span></label>; })}
    </section>
    <section className="space-y-5" aria-label="Questions 37 to 40">
      <h2 className="font-bold">Questions 37–40</h2>
      <p>Choose the correct answer.</p>
      {["Autism", "The 1998 paper was", "Vaccinations", "Alternative medicine practitioners"].map((prompt, groupIndex) => { const number = groupIndex + 37; return <div id={`question-${number}`} key={prompt} className="scroll-m-6 space-y-2 py-2"><h3 className="font-semibold">{number}. {prompt}</h3>{mcOptions[groupIndex].map((option, optionIndex) => { const letter = String.fromCharCode(65 + optionIndex); return <label key={letter} className="flex cursor-pointer items-center gap-5 py-1"><input type="radio" name={`question-${number}`} checked={answers[number] === letter} onChange={() => setAnswer(number, letter)} /><span>{option}</span></label>; })}</div>; })}
    </section>
  </div>;
  const passageTwoQuestions = <div className="space-y-8 px-5 py-5 text-[16px] leading-7">
    <section className="space-y-5" aria-label="Questions 14 to 17"><h2 className="font-bold">Questions 14–17</h2><p>Answer the questions.</p><p>Write <b>NO MORE THAN TWO WORDS</b> from the passage for each answer.</p>{["What aspect of family names should make us think more about them?", "Originally, what was needed to distinguish two same first names?", "What legislation began the process of using family names?", "What made family names, in time, necessary?"].map((question, index) => { const number = index + 14; return <div id={`question-${number}`} key={number} className="scroll-m-6 space-y-2 py-2"><p><b>{number}.</b> {question}</p><input aria-label={`Answer for question ${number}`} value={answers[number] as string || ""} onChange={(event) => setAnswer(number, event.target.value)} className="h-8 w-36 border border-[#8ca2b8] bg-white px-2 outline-none focus:border-[#2185d0]" autoComplete="off" /></div>; })}</section>
    <section className="space-y-5" aria-label="Questions 18 to 22"><h2 className="font-bold">Questions 18–22</h2><p>Choose the correct letter, A–F, next to the questions.</p><p>What system was used for the formation of the following names?</p><div className="mx-auto w-fit max-w-full space-y-1 border border-[#aaa] bg-white px-5 py-3">{[["A", "Personal belief"], ["B", "Place of residence"], ["C", "Mistake"], ["D", "Mononym"], ["E", "Profession"], ["F", "Geographic feature"]].map(([letter, label]) => <p key={letter} className="py-1"><b className="mr-3">{letter}</b>{label}</p>)}</div>{["Bono", "da Vinci", "Pershing", "Heyward", "Guilfoyle"].map((name, index) => { const number = index + 18; return <div id={`question-${number}`} key={name} className="grid scroll-m-6 grid-cols-[8rem_7rem] items-center gap-3 py-1"><span><b>{number}.</b> {name}</span><select aria-label={`Answer for question ${number}`} value={answers[number] as string || ""} onChange={(event) => setAnswer(number, event.target.value)} className="w-28 border border-gray-400 bg-white px-2 py-1 outline-none focus:border-[#2185d0]"><option value="">Select</option>{[["A", "Personal belief"], ["B", "Place of residence"], ["C", "Mistake"], ["D", "Mononym"], ["E", "Profession"], ["F", "Geographic feature"]].map(([letter, label]) => <option key={letter} value={letter}>{letter} — {label}</option>)}</select></div>; })}</section>
    <section className="space-y-5" aria-label="Questions 23 to 26"><h2 className="font-bold">Questions 23–26</h2><p>Complete the sentences.</p><p>Write <b>NO MORE THAN TWO WORDS</b> from the passage for each answer.</p>{["‘Mac’ in Scottish means", "In order to be easier to write, foreign names often had", "Spelling changes in names can make it hard to know their", "The term ‘upper name’ is used because of Asia’s"].map((prompt, index) => { const number = index + 23; return <div id={`question-${number}`} key={number} className="scroll-m-6 py-2"><p><b>{number}.</b> {prompt}</p><input aria-label={`Answer for question ${number}`} value={answers[number] as string || ""} onChange={(event) => setAnswer(number, event.target.value)} className="h-8 w-36 border border-[#8ca2b8] bg-white px-2 outline-none focus:border-[#2185d0]" autoComplete="off" /></div>; })}</section>
  </div>;
  const answerPane = passageIndex === 2 ? passageThreeQuestions : passageIndex === 1 ? passageTwoQuestions : passageOneQuestions;

  return (
    <main inert={!draftReady} aria-busy={!draftReady} className="flex h-screen flex-col bg-white text-black" style={{ fontFamily: "Arial, sans-serif" }}>
      <header className="flex h-[56px] shrink-0 items-center justify-between border-y border-[#d5d5d5] bg-white px-4">
        <div className="flex items-center gap-7"><div className="text-[32px] font-black leading-none tracking-[-2.5px] text-[#e31837]">IELTS<sup className="ml-[-2px] align-top text-[9px] tracking-normal">™</sup></div><div className="self-start mt-1 text-[14px] font-bold leading-5">Test taker ID<div className="text-[13px] font-normal">Time remaining: {minutes}:{seconds}</div></div></div>
        <div className="flex items-center gap-5 text-[#222]"><button aria-label="Notes" title="Notes"><NotebookPen size={22} /></button><button aria-label="Connection status"><Wifi size={22} /></button><button aria-label="Notifications"><Bell size={22} /></button><button aria-label="Menu"><Menu size={24} /></button></div>
      </header>
      <div className="mx-5 mt-2 mb-1 min-h-[58px] shrink-0 rounded border border-[#d5d5d5] bg-[#f2f2ef] px-4 py-1"><h2 className="text-[14px] font-bold leading-5">Part {passageIndex + 1}</h2><p className="text-[14px] leading-5">{passageIndex === 2 ? "Read the passage and answer questions 27–40." : passageIndex === 1 ? "Read the passage and answer questions 14–26." : "Read the passage and answer questions 1–13."}</p></div>
      <div className="relative flex min-h-0 flex-1 overflow-hidden bg-white">
        <section className="h-full min-w-0 shrink-0 overflow-y-auto border-r border-[#999] bg-white" style={{ width: `${paneSplit}%` }} aria-label={`Reading Passage ${passageIndex + 1}`}><article className="space-y-4 px-5 py-4 text-[16px] leading-6"><h2 className="text-center text-xl font-bold">{passage.title}</h2>{splitParagraphs(passage.text).map((paragraph, index) => { const section = paragraph.match(/^([A-H])\.\s*([\s\S]*)$/); return <section key={index} className="space-y-2">{section ? <><div className="flex items-center gap-2"><h3 className="shrink-0 font-bold">{section[1]}</h3>{passageIndex === 2 && <HeadingDrop scope="reading-4-headings" group={paragraphHeadingGroup} paragraph={section[1]} answers={answers} onAnswer={setAnswer} />}</div><p>{section[2]}</p></> : <p>{paragraph}</p>}</section>; })}</article></section>
        <section className="h-full min-w-0 shrink-0 overflow-y-auto bg-white pb-20" style={{ width: `${100 - paneSplit}%` }} aria-label="Reading questions">{answerPane}</section>
        <div role="separator" aria-label="Resize passage and question panels" aria-orientation="vertical" aria-valuemin={25} aria-valuemax={75} aria-valuenow={Math.round(paneSplit)} tabIndex={0} onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)} onPointerMove={movePaneDivider} onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)} onPointerCancel={(event) => event.currentTarget.releasePointerCapture(event.pointerId)} onKeyDown={(event) => { if (event.key === "ArrowLeft") setPaneSplit((value) => Math.max(25, value - 2)); if (event.key === "ArrowRight") setPaneSplit((value) => Math.min(75, value + 2)); }} style={{ left: `${paneSplit}%` }} className="absolute top-0 z-20 h-full w-3 -translate-x-1/2 cursor-col-resize touch-none outline-none focus-visible:ring-2 focus-visible:ring-[#2185d0]"><span className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 bg-[#999]" /><span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-[#555] bg-white text-[20px] leading-none shadow-sm">↔</span></div>
      </div>
      <PartNavigation floating current={passageIndex + 1} total={3} onChange={(part) => setPassageIndex(part - 1)} />
      <footer data-ielts-test-footer className="grid shrink-0 grid-cols-3 items-center justify-items-center gap-4 border-t border-[#d5d5d5] bg-white px-3 py-2">{testFourPassages.map((item, index) => <div key={item.title} className="flex flex-col items-center"><button type="button" onClick={() => setPassageIndex(index)} aria-current={passageIndex === index ? "page" : undefined} className={`px-3 py-1 text-[14px] ${passageIndex === index ? "font-bold text-[#111]" : "font-normal text-[#111] hover:underline"}`}>Passage {index + 1}</button>{<div className="mt-1 flex flex-wrap justify-center gap-1">{Array.from({ length: index === 0 || index === 1 ? 13 : 14 }, (_, offset) => { const number = (index === 0 ? 1 : index === 1 ? 14 : 27) + offset; return <button key={number} type="button" onClick={() => { setPassageIndex(index); window.setTimeout(() => (document.getElementById(`question-${number}`) || document.getElementById(index === 0 ? "question-1" : index === 1 ? "question-14" : "question-34"))?.scrollIntoView({ behavior: "smooth", block: "center" }), 50); }} className={`h-6 min-w-6 rounded-sm border px-0.5 text-[13px] ${answers[number] ? "border-[#2185d0] font-semibold" : "border-transparent hover:border-[#2185d0]"}`}>{number}</button>; })}</div>}</div>)}</footer>    </main>
  );
}





