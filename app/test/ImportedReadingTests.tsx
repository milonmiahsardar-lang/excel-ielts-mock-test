"use client";

import PartNavigation from "./PartNavigation";
import SentenceEndings from "./SentenceEndings";
import { HeadingBank, HeadingDrop, headingQuestion } from "./HeadingDragAndDrop";
import ParagraphInformationTable from "./ParagraphInformationTable";
import SummaryWithoutClues from "./SummaryWithoutClues";
import { saveSection, useAnswerDraft, useCountdown } from "@/lib/results/client";

import { Fragment, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";
import { Bell, Menu, NotebookPen, Wifi } from "lucide-react";
import type { ImportedReadingTest, ReadingQuestionGroup } from "./imported-reading-types";
import test7 from "./test7-import.json";
import test8 from "./test8-import.json";
import test9 from "./test9-import.json";
import test10 from "./test10-import.json";

const tests: Record<number, ImportedReadingTest> = {
  7: test7 as ImportedReadingTest,
  8: test8 as ImportedReadingTest,
  9: test9 as ImportedReadingTest,
  10: test10 as ImportedReadingTest,
};

export default function ImportedReadingTests({ testNumber }: { testNumber: number }) {
  const router = useRouter();
  const test = tests[testNumber];
  const [passageIndex, setPassageIndex] = useState(0);
  const timeLeft = useCountdown(testNumber, "reading");
  const [paneSplit, setPaneSplit] = useState(50);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const draftReady=useAnswerDraft("reading",testNumber,answers,setAnswers);
  const passage = test.passages[passageIndex];
  const setAnswer = (number: number, value: string) => setAnswers((current) => ({ ...current, [number]: value }));

const movePaneDivider = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!bounds || bounds.width === 0) return;
    setPaneSplit(Math.min(75, Math.max(25, ((event.clientX - bounds.left) / bounds.width) * 100)));
  };
  const handleContinue = async () => {
    sessionStorage.setItem(`ieltsAnswersTest${testNumber}Reading`, JSON.stringify(answers));
    try { await saveSection("reading",testNumber,answers,true); router.replace(`/listening/instructions?test=${testNumber}`); } catch(error){window.alert((error as Error).message);}
  };
  const selectMultiple = (numbers: number[], value: string) => {
    setAnswers((current) => {
      const chosen = numbers.map((number) => current[number]).filter(Boolean);
      const next = chosen.includes(value)
        ? chosen.filter((item) => item !== value)
        : chosen.length < numbers.length ? [...chosen, value] : chosen;
      const updated = { ...current };
      numbers.forEach((number, index) => { updated[number] = next[index] || ""; });
      return updated;
    });
  };
  const textInput = (number: number, showNumber = true) => (
    <span className="inline-flex items-center whitespace-nowrap align-middle">
      {showNumber && <span className="mx-1 inline-flex min-w-5 items-center justify-center font-semibold align-middle">{number}</span>}
      <input id={`question-${number}`} aria-label={`Answer for question ${number}`} value={answers[number] || ""} onChange={(event) => setAnswer(number, event.target.value)} className="mx-1 inline-block h-8 w-36 scroll-m-6 border border-[#2185d0] bg-white px-2 align-middle outline-none focus:border-[#2185d0]" autoComplete="off" />
    </span>
  );
  const richText = (text: string, showNumbers = true) => text.split(/(\{\{\d+\}\}|\*\*[^*]+\*\*|\n)/g).map((part, index) => {
    const blank = part.match(/^\{\{(\d+)\}\}$/);
    if (blank) return <Fragment key={index}>{textInput(Number(blank[1]), showNumbers)}</Fragment>;
    if (part.startsWith("**") && part.endsWith("**")) return <b key={index}>{part.slice(2, -2)}</b>;
    if (part === "\n") return <br key={index} />;
    return <Fragment key={index}>{part}</Fragment>;
  });

  const headingSlot = (paragraph: string) => {
    const group = passage.groups.find(group => group.type === "match" && /heading/i.test([group.optionTitle, ...group.instructions].join(" ")) && headingQuestion(group, paragraph));
    if (!group || group.type !== "match") return null;
    return <HeadingDrop scope={testNumber + ":" + group.title} group={group} paragraph={paragraph} answers={answers} onAnswer={setAnswer} />;
  };
  const questionGroup = (group: ReadingQuestionGroup) => {
    switch (group.type) {
      case "choice":
      case "truth":
        return <>
          {group.type === "truth" && <p>{group.labels[0] === "YES"
            ? <>Choose <b>YES</b> if the statement agrees with the writer’s views, <b>NO</b> if the statement contradicts the writer’s views, or <b>NOT GIVEN</b> if it is impossible to say what the writer thinks about this.</>
            : <>Choose <b>TRUE</b> if the statement agrees with the information, <b>FALSE</b> if the statement contradicts the information, or <b>NOT GIVEN</b> if there is no information on this.</>}</p>}
          {group.questions.map((question) => {
            const options = group.type === "truth" ? group.labels : (question as { options: string[] }).options;
            return <div id={`question-${question.number}`} key={question.number} className="scroll-m-6 space-y-3 py-3">
              <div className="flex items-start gap-3"><b>{question.number}.</b><p>{richText(question.prompt)}</p></div>
              <div className="space-y-2 pl-8">{options.map((option) => <label key={option} className="flex cursor-pointer items-start gap-3 py-1">
                <input type="radio" name={`question-${question.number}`} checked={answers[question.number] === option} onChange={() => setAnswer(question.number, option)} />
                <span>{richText(option)}</span>
              </label>)}</div>
            </div>;
          })}
        </>;
      case "match": {
        if (/ending/i.test([group.optionTitle, ...group.instructions].join(" "))) return <SentenceEndings questions={group.questions} options={group.options} optionTitle={group.optionTitle} answers={answers} onAnswer={setAnswer} allowReuse={group.instructions.some(instruction => /more than once/i.test(instruction))} />;
        if (/heading/i.test([group.optionTitle, ...group.instructions].join(" "))) return <>
          {group.optionTitle && <h3 className="font-bold">{group.optionTitle}</h3>}
          <HeadingBank scope={testNumber + ":" + group.title} group={group} answers={answers} onAnswer={setAnswer} />
          {group.examples?.map(example => <p key={example}><b>Example:</b> {richText(example)}</p>)}
        </>;

        const paragraphGrid = !group.optionTitle && group.options.every((option) => option.label === option.text);
        if (paragraphGrid) return <ParagraphInformationTable questions={group.questions} letters={group.options.map(option => option.label)} answers={answers} onAnswer={setAnswer} renderPrompt={richText} />;
        return <>
          {!paragraphGrid && <div className="mx-auto w-fit max-w-full space-y-1 border border-[#aaa] bg-white px-5 py-3">
            {group.optionTitle && <h3 className="text-center font-bold">{group.optionTitle}</h3>}
            {group.options.map((option) => <p key={option.label} className="flex gap-3 py-1"><b>{option.label}</b><span>{richText(option.text)}</span></p>)}
          </div>}
          {group.examples?.map((example) => <p key={example}><b>Example:</b> {richText(example)}</p>)}
          {group.questions.map((question) => <div id={`question-${question.number}`} key={question.number} className="flex scroll-m-6 items-start gap-3 py-2">
            <span><b>{question.number}.</b> {richText(question.prompt)}</span>
            <select aria-label={`Answer for question ${question.number}`} value={answers[question.number] || ""} onChange={(event) => setAnswer(question.number, event.target.value)} className="w-20 shrink-0 border border-gray-400 bg-white px-2 py-1 outline-none focus:border-[#2185d0]">
              <option value="">Select</option>{group.options.map((option) => <option key={option.label}>{option.label}</option>)}
            </select>
          </div>)}
        </>;
      }
      case "fill":
        if (/summary/i.test([group.heading, ...group.instructions].join(" "))) return <SummaryWithoutClues paragraphs={group.paragraphs} answers={answers} onAnswer={setAnswer} />;
        return group.paragraphs.map((paragraph, index) => <p key={index} className="py-2 leading-9">{richText(paragraph, !group.shortAnswers)}</p>);
      case "table":
        return <div className="overflow-x-auto"><table className="w-full border-collapse border border-[#aaa]">
          <thead><tr>{group.columns.map((column, index) => <th key={index} className="border border-[#aaa] px-3 py-2 text-left">{richText(column)}</th>)}</tr></thead>
          <tbody>{group.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border border-[#aaa] px-3 py-3 align-top leading-9">{richText(cell)}</td>)}</tr>)}</tbody>
        </table></div>;
      case "multiple":
        return group.questions.map((question) => {
          const selected = question.numbers.map((number) => answers[number]).filter(Boolean);
          return <div key={question.numbers[0]} className="space-y-3 py-3">
            {question.numbers.map((number) => <span key={number} id={`question-${number}`} className="block scroll-m-6" />)}
            <p><b>{question.numbers[0]}–{question.numbers[question.numbers.length - 1]}.</b> {richText(question.prompt)}</p>
            <div className="space-y-2 pl-8">{question.options.map((option) => <label key={option} className="flex cursor-pointer items-start gap-3 py-1">
              <input type="checkbox" aria-label={option} checked={selected.includes(option)} onChange={() => selectMultiple(question.numbers, option)} disabled={selected.length >= question.numbers.length && !selected.includes(option)} />
              <span>{richText(option)}</span>
            </label>)}</div>
          </div>;
        });
      case "diagram":
        return <><img src={group.image} alt="Ergograph apparatus with numbered label locations 21 to 25." className="h-auto w-full" /><div className="space-y-4">{group.numbers.map((number) => <div key={number}>{textInput(number)}</div>)}</div></>;
    }
  };
  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, "0");

  return <main inert={!draftReady} aria-busy={!draftReady} className="flex h-screen flex-col bg-white text-black" style={{ fontFamily: "Arial, sans-serif" }}>
    <header className="flex h-[56px] shrink-0 items-center justify-between border-y border-[#d5d5d5] bg-white px-4"><div className="flex items-center gap-7"><div className="text-[32px] font-black leading-none tracking-[-2.5px] text-[#e31837]">IELTS<sup className="ml-[-2px] align-top text-[9px] tracking-normal">™</sup></div><div className="self-start mt-1 text-[14px] font-bold leading-5">Test taker ID<div className="text-[13px] font-normal">Time remaining: {minutes}:{seconds}</div></div></div><div className="flex items-center gap-5 text-[#222]"><button aria-label="Notes" title="Notes"><NotebookPen size={22} /></button><button aria-label="Connection status"><Wifi size={22} /></button><button aria-label="Notifications"><Bell size={22} /></button><button aria-label="Menu"><Menu size={24} /></button></div></header>
    <div className="mx-5 mt-2 mb-1 min-h-[58px] shrink-0 rounded border border-[#d5d5d5] bg-[#f2f2ef] px-4 py-1"><h2 className="text-[14px] font-bold leading-5">Part {passageIndex + 1}</h2><p className="text-[14px] leading-5">Read the text and answer questions {passage.start}–{passage.end}.</p></div>
    <div className="relative flex min-h-0 flex-1 overflow-hidden bg-white">
      <section className="h-full min-w-0 shrink-0 overflow-y-auto border-r border-[#999] bg-white" style={{ width: `${paneSplit}%` }} aria-label={`Reading Passage ${passageIndex + 1}`}>
        <article className="space-y-4 px-5 py-4 text-[16px] leading-6"><h2 className="text-center text-xl font-bold">{passage.title}</h2>{passage.paragraphs.map((paragraph, index) => {
          const section = paragraph.match(/^([A-Z])\s*\n+([\s\S]*)$/);
          return <section key={index} className="space-y-2">{section ? <><div className="flex items-center gap-2"><h3 className="shrink-0 font-bold">{section[1]}</h3>{headingSlot(section[1])}</div><p>{richText(section[2])}</p></> : <p>{richText(paragraph)}</p>}</section>;
        })}</article>
      </section>
      <section className="h-full min-w-0 shrink-0 overflow-y-auto bg-white" style={{ width: `${100 - paneSplit}%` }} aria-label="Reading questions">
        <div className="space-y-8 px-5 py-5 text-[16px] leading-7">{passage.groups.map((group, index) => <section key={index} className="space-y-5" aria-label={group.title}>
          <h2 className="font-bold">{group.title}</h2>{group.instructions.map((instruction, instructionIndex) => <p key={instructionIndex}>{richText(instruction)}</p>)}
          {group.heading && <h3 className={`pt-2 font-bold ${group.type === "fill" && /summary/i.test([group.heading, ...group.instructions].join(" ")) ? "text-center" : ""}`}>{group.heading}</h3>}{questionGroup(group)}
        </section>)}</div>
      </section>
      <div role="separator" aria-label="Resize passage and question panels" aria-orientation="vertical" aria-valuemin={25} aria-valuemax={75} aria-valuenow={Math.round(paneSplit)} tabIndex={0} onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)} onPointerMove={movePaneDivider} onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)} onPointerCancel={(event) => event.currentTarget.releasePointerCapture(event.pointerId)} onKeyDown={(event) => { if (event.key === "ArrowLeft") setPaneSplit((value) => Math.max(25, value - 2)); if (event.key === "ArrowRight") setPaneSplit((value) => Math.min(75, value + 2)); }} style={{ left: `${paneSplit}%` }} className="absolute top-0 z-20 h-full w-3 -translate-x-1/2 cursor-col-resize touch-none outline-none focus-visible:ring-2 focus-visible:ring-[#2185d0]"><span className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 bg-[#999]" /><span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-[#555] bg-white text-[20px] leading-none shadow-sm">↔</span></div>
    </div>
    <PartNavigation current={passageIndex + 1} total={3} onChange={(part) => setPassageIndex(part - 1)} />
      <footer data-ielts-test-footer className="grid shrink-0 grid-cols-3 items-center justify-items-center gap-4 border-t border-[#d5d5d5] bg-white px-3 py-2">{test.passages.map((item, index) => <div key={item.title} className="flex flex-col items-center"><button type="button" onClick={() => setPassageIndex(index)} aria-current={passageIndex === index ? "page" : undefined} className={`px-3 py-1 text-[14px] ${passageIndex === index ? "font-bold text-[#111]" : "font-normal text-[#111] hover:underline"}`}>Passage {index + 1}</button><div className="mt-1 flex flex-wrap justify-center gap-1">{Array.from({ length: item.end - item.start + 1 }, (_, offset) => {
      const number = item.start + offset;
      return <button key={number} type="button" onClick={() => { setPassageIndex(index); window.setTimeout(() => document.getElementById(`question-${number}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50); }} className={`h-6 min-w-6 rounded-sm border px-0.5 text-[13px] ${answers[number] ? "border-[#2185d0] font-semibold" : "border-transparent hover:border-[#2185d0]"}`}>{number}</button>;
    })}</div></div>)}</footer>
  </main>;
}
