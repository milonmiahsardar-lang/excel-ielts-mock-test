"use client";

import PartNavigation from "./PartNavigation";
import { HeadingBank, HeadingDrop } from "./HeadingDragAndDrop";

import ParagraphInformationTable from "./ParagraphInformationTable";
import { SummaryGap } from "./SummaryWithoutClues";

import { saveSection, useAnswerDraft, useCountdown } from "@/lib/results/client";

import { useMemo, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Bell, Menu, NotebookPen, Wifi } from "lucide-react";
import { testTwoReadingSource } from "./test2-reading-data";

type Answers = Record<number, string>;
type Pair = readonly [string, string];

const passageMarkers = [
  { start: "READING PASSAGE 1", end: "Questions 1-6", range: "1–13", title: "One Who Hopes" },
  { start: "READING PASSAGE 2", end: "Questions 14-18", range: "14–26", title: "Second Nature" },
  { start: "READING PASSAGE 3", end: "Questions 27-31", range: "27–40", title: "Children’s Language Study" },
] as const;

const passageText = passageMarkers.map(({ start, end, title }) => {
  const begin = testTwoReadingSource.indexOf(start) + start.length;
  const finish = testTwoReadingSource.indexOf(end, begin);
  return testTwoReadingSource.slice(begin, finish).trim()
    .replace(/^You should spend[^\n]*\n?/m, "")
    .replace(new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i"), "")
    .trim();
});

const headingList: Pair[] = [
  ["i", "A non-exclusive language"], ["ii", "Fewer languages, more results"], ["iii", "Language is personal"],
  ["iv", "What’s fashionable in language"], ["v", "From the written word to the spoken word"],
  ["vi", "A real language"], ["vii", "Harmony through language"], ["viii", "The mechanics of a language"], ["ix", "Lost in translation"],
];
const people: Pair[] = [["A", "Christopher Peterson"], ["B", "David Fajgenbaum"], ["C", "Suzanne Segerstrom"], ["D", "Tanya Streeter"], ["E", "Todd Kashdan"], ["F", "Kenneth Pedeleose"], ["G", "Cynthia Pury"]];
const yesNo = ["YES", "NO", "NOT GIVEN"];
const trueFalse = ["TRUE", "FALSE", "NOT GIVEN"];

const multipleChoice = [
  { number: 7, prompt: "What advantage is there to learning Esperanto as one’s first foreign language?", options: ["Its pronunciation rules follow those of most European languages.", "There are no grammar rules to learn.", "It can make the learning of other foreign languages less complicated.", "Its verbs are not conjugated."] },
  { number: 8, prompt: "What do its critics say of Esperanto?", options: ["It is only used in artificial situations.", "It requires emotional involvement.", "It cannot translate works of literature.", "It lacks depth of expression."] },
  { number: 9, prompt: "How could Esperanto help on a global level?", options: ["It would eliminate the need for conferences.", "More aid money would reach those who need it.", "The world population would be speaking only one language.", "More funds could be made available for learning foreign languages."] },
];

function extractParagraphs(raw: string, allowUndottedLabels = false) {
  return raw.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean).map((block) => {
    const clean = block.replace(/^---\s*$/gm, "").replace(/^You should spend[^\n]*\n?/m, "").trim();
    const labelled = clean.match(allowUndottedLabels ? /^([A-H])(?:\.\s*|\s+)([\s\S]*)$/ : /^([A-H])\.\s*([\s\S]*)$/);
    return labelled ? { label: labelled[1], text: labelled[2] } : { label: "", text: clean };
  }).filter(({ text }) => text && !/^PART [123]$/i.test(text) && !/^READING PASSAGE [123]$/i.test(text));
}

function NumberBadge({ number }: { number: number }) {
  return <span className="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-sm border border-[#2185d0] bg-white px-1 font-medium leading-none">{number}</span>;
}

const paragraphHeadingGroup = {
  options: headingList.map(([label, text]) => ({ label, text })),
  questions: "BCDEFG".split("").map((letter, index) => ({ number: index + 1, prompt: "Paragraph " + letter })),
};

export default function TestTwoReading() {
  const router = useRouter();
  const [passage, setPassage] = useState(1);
  const timeLeft = useCountdown(2, "reading");
  const [answers, setAnswers] = useState<Answers>({});
  const draftReady=useAnswerDraft("reading",2,answers,setAnswers);
  const [paneSplit, setPaneSplit] = useState(50);
  const displayedPassage = useMemo(() => extractParagraphs(passageText[passage - 1], passage === 2), [passage]);

  const movePaneDivider = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!bounds || bounds.width === 0) return;
    setPaneSplit(Math.min(75, Math.max(25, ((event.clientX - bounds.left) / bounds.width) * 100)));
  };

const setAnswer = (number: number, value: string) => setAnswers((current) => ({ ...current, [number]: value }));
  const summaryInput = (number: number) => <SummaryGap number={number} answers={answers} onAnswer={setAnswer} />;

  const select = (number: number, choices: readonly Pair[]) => <select id={`question-${number}`} aria-label={`Answer for question ${number}`} value={answers[number] || ""} onChange={(event) => setAnswer(number, event.target.value)} className="w-48 max-w-full border border-gray-400 bg-white px-2 py-1 outline-none focus:border-[#2185d0]"><option value="">Select</option>{choices.map(([key, label]) => <option key={key} value={key}>{key} — {label}</option>)}</select>;
  const shortRow = (number: number, content: ReactNode) => <div id={`question-row-${number}`} key={number} className="flex scroll-m-6 items-start gap-3 py-3 leading-7"><NumberBadge number={number} /><div className="min-w-0">{content}</div></div>;

  const radio = (number: number, prompt: string, options: string[], values = options) => <div id={`question-${number}`} key={number} className="scroll-m-6 space-y-3 py-4"><div className="flex items-start gap-3 leading-7"><NumberBadge number={number} /><p className="min-w-0 pt-0.5">{prompt}</p></div><div className="space-y-3 pl-11">{options.map((label, index) => <label key={index} className="flex cursor-pointer items-start gap-3 py-1 leading-6"><input className="mt-1.5" type="radio" name={`question-${number}`} value={values[index]} checked={answers[number] === values[index]} onChange={() => setAnswer(number, values[index])} /><span>{label}</span></label>)}</div></div>;
  const bank = (title: string, items: readonly Pair[]) => <div className="mx-auto w-fit min-w-48 max-w-full space-y-2 border border-[#aaa] bg-white px-8 py-4"><h3 className="text-center font-bold">{title}</h3>{items.map(([key, label]) => <p key={key} className="py-1"><b className="mr-2">{key}</b>{label}</p>)}</div>;
  const submitToWriting = async () => { sessionStorage.setItem("ieltsAnswersTest2Reading", JSON.stringify(answers)); try { await saveSection("reading",2,answers,true); router.replace("/listening/instructions?test=2"); } catch(error){window.alert((error as Error).message);} };
  const minutes = Math.floor(timeLeft / 60);
  const seconds = String(timeLeft % 60).padStart(2, "0");

  const passageOneQuestions = <div className="space-y-8 px-5 py-5 text-[16px] leading-7">
    <section className="space-y-5"><h2 className="font-bold">Questions 1–6</h2><p>Choose the correct heading for paragraphs B–G from the list below. Write the correct number, i–ix.</p><h3 className="font-bold">List of Headings</h3><HeadingBank scope="reading-2-headings" group={paragraphHeadingGroup} answers={answers} onAnswer={setAnswer} /></section>
    <section className="space-y-5"><h2 className="font-bold">Questions 7–9</h2><p>Choose the correct letter, A, B, C or D.</p>{multipleChoice.slice(0, 3).map(({ number, prompt, options }) => radio(number, prompt, options, ["A", "B", "C", "D"]))}</section>
    <section className="space-y-5"><h2 className="font-bold">Questions 10–13</h2><p>Do the following statements agree with the views of the writer? Choose YES, NO or NOT GIVEN.</p>{[
      "Supporters of Esperanto say it gives everyone an equal voice.", "Esperanto is the only artificially-constructed language.", "Esperanto can be learned as part of a self-study course.", "Esperanto can be used equally in formal and casual situations.",
    ].map((prompt, index) => radio(index + 10, prompt, yesNo))}</section>
  </div>;

  const passageTwoQuestions = <div className="space-y-8 px-5 py-5 text-[16px] leading-7">
    <section className="space-y-5"><h2 className="font-bold">Questions 14–18</h2><p>Complete the summary below.</p><p>Choose <b>NO MORE THAN THREE WORDS</b> from the passage for each answer.</p><p>Write your answers in boxes <b>14–18</b>.</p>
      <p className="py-2 leading-9">Psychologists have traditionally believed that a personality {summaryInput(14)} was impossible and that by a {summaryInput(15)}, a person’s character tends to be fixed. This is not true according to positive psychologists, who say that our personal qualities can be seen as habitual behaviour. One of the easiest qualities to acquire is {summaryInput(16)}. However, regardless of the quality, it is necessary to learn a wide variety of different {summaryInput(17)} in order for a new quality to develop; for example, a person must understand and feel some {summaryInput(18)} in order to increase their happiness.</p>
    </section>
    <section className="space-y-5"><h2 className="font-bold">Questions 19–22</h2><p>Match each statement with the correct person, A–G.</p>{bank("List of People", people)}
      {["People must accept that they do not know much when first trying something new.", "It is important for people to actively notice when good things happen.", "Courage can be learned once its origins in a sense of responsibility are understood.", "It is possible to overcome shyness when faced with the need to speak in public."].map((prompt, index) => shortRow(index + 19, <>{prompt} {select(index + 19, people)}</>))}</section>
    <section className="space-y-5"><h2 className="font-bold">Questions 23–26</h2><p>The Reading Passage has eight sections, <b>A–H</b>.</p><p>Which section contains the following information?</p><p>Choose the correct letter, <b>A–H</b>, in boxes <b>23–26</b> below.</p>
      <ParagraphInformationTable questions={[
        "a mention of how rational thinking enabled someone to achieve physical goals",
        "an account of how someone overcame a sad experience",
        "a description of how someone decided to rethink their academic career path",
        "an example of how someone risked his career out of a sense of duty",
      ].map((prompt, index) => ({ number: index + 23, prompt }))} letters={"ABCDEFGH".split("")} answers={answers} onAnswer={setAnswer} /></section>
  </div>;

  const passageThreeQuestions = <div className="space-y-8 px-5 py-5 text-[16px] leading-7">
    <section className="space-y-5"><h2 className="font-bold">Questions 27–31</h2><p>Reading Passage 3 has eight paragraphs, <b>A–H</b>.</p><p>Which paragraphs contain the following information?</p><p>Write the correct letter, <b>A–H</b>, in boxes <b>27–31</b> below.</p><p><b>NB</b> You may use any letter more than once.</p>
      <ParagraphInformationTable questions={[
        "the possibility of carrying out research on children before they start talking",
        "the difficulties in deducing theories from systematic experiment",
        "the differences between analysing children’s and adults’ language",
        "the ability to record children without them seeing the researcher",
        "the drawbacks of recording children in an environment they know",
      ].map((prompt, index) => ({ number: index + 27, prompt }))} letters={"ABCDEFGH".split("")} answers={answers} onAnswer={setAnswer} /></section>
    <section className="space-y-5"><h2 className="font-bold">Questions 32–35</h2><p>Do the following statements agree with the information in the passage? Choose TRUE, FALSE or NOT GIVEN.</p>{[
      "In the 19th century, researchers studied their own children’s language.", "Attempts to elicit very young children’s opinions about language are likely to fail.", "Radio microphones are used because they enable researchers to communicate with a number of children in different rooms.", "Many children enjoy the interaction with the researcher.",
    ].map((prompt, index) => radio(index + 32, prompt, trueFalse))}</section>
    <section className="space-y-5"><h2 className="font-bold">Questions 36–40</h2><p>Complete the summary below.</p><p>Choose <b>NO MORE THAN TWO WORDS</b> from the passage for each answer.</p><p>Write your answers in boxes <b>36–40</b> below.</p><h3 className="pt-3 text-center font-bold">Ways of investigating children’s language</h3>
      <p className="py-2 leading-9">One method of carrying out research is to record children’s spontaneous language use. This can be done in their homes, where, however, it may be difficult to ensure that the recording is of acceptable {summaryInput(36)}. Another venue which is often used is a {summaryInput(37)}, where the researcher can avoid distracting the child. A drawback of this method is that it does not allow children to demonstrate their comprehension.</p>
      <p className="py-2 leading-9">An alternative approach is to use methodology from the field of {summaryInput(38)}. In this case, a number of children are asked to carry out a {summaryInput(39)}, and the results are subjected to a {summaryInput(40)}.</p></section>
  </div>;

  const questionPane = [passageOneQuestions, passageTwoQuestions, passageThreeQuestions][passage - 1];
  const starts = [1, 14, 27];
  const counts = [13, 13, 14];

  return <main inert={!draftReady} aria-busy={!draftReady} className="flex h-screen flex-col bg-white text-black" style={{ fontFamily: "Arial, sans-serif" }}>
    <header className="h-[56px] shrink-0 border-y border-[#d5d5d5] bg-white px-4 flex items-center justify-between">
      <div className="flex items-center gap-7"><div className="text-[32px] leading-none font-black tracking-[-2.5px] text-[#e31837]">IELTS<sup className="text-[9px] tracking-normal align-top ml-[-2px]">™</sup></div><div className="self-start mt-1 text-[14px] leading-5 font-bold">Test taker ID<div className="font-normal text-[13px]">Time remaining: {minutes}:{seconds}</div></div></div>
      <div className="flex items-center gap-5 text-[#222]"><button aria-label="Notes" title="Notes"><NotebookPen size={22} /></button><button aria-label="Connection status"><Wifi size={22} /></button><button aria-label="Notifications"><Bell size={22} /></button><button aria-label="Menu"><Menu size={24} /></button></div>
    </header>
    <div className="mx-5 mt-2 mb-1 min-h-[58px] shrink-0 rounded border border-[#d5d5d5] bg-[#f2f2ef] px-4 py-1 text-black"><h2 className="text-[14px] leading-5 font-bold">Part {passage}</h2><p className="text-[14px] leading-5">Read the text and answer questions {passageMarkers[passage - 1].range}.</p></div>
    <div className="relative flex min-h-0 flex-1 overflow-hidden bg-white">
      <section style={{ width: `${paneSplit}%` }} className="h-full min-w-0 shrink-0 overflow-y-auto border-r border-[#999] bg-white" aria-label="Reading passage area"><article className="space-y-4 px-5 py-4 text-[16px] leading-6"><h2 className="text-center text-xl font-bold">{passageMarkers[passage - 1].title}</h2>{displayedPassage.map(({ label, text }, index) => <section key={index} className="space-y-2">{label && <div className="flex items-center gap-2"><h3 className="shrink-0 font-bold">{label}</h3>{passage === 1 && <HeadingDrop scope="reading-2-headings" group={paragraphHeadingGroup} paragraph={label} answers={answers} onAnswer={setAnswer} />}</div>}<p>{text}</p></section>)}</article></section>
      <section style={{ width: `${100 - paneSplit}%` }} className="h-full min-w-0 shrink-0 overflow-y-auto bg-white pb-20" aria-label="Reading question area">{questionPane}</section>
      <div role="separator" aria-label="Resize passage and question panels" aria-orientation="vertical" aria-valuemin={25} aria-valuemax={75} aria-valuenow={Math.round(paneSplit)} tabIndex={0} onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)} onPointerMove={movePaneDivider} onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)} onPointerCancel={(event) => event.currentTarget.releasePointerCapture(event.pointerId)} onKeyDown={(event) => { if (event.key === "ArrowLeft") setPaneSplit((value) => Math.max(25, value - 2)); if (event.key === "ArrowRight") setPaneSplit((value) => Math.min(75, value + 2)); }} style={{ left: `${paneSplit}%` }} className="absolute top-0 z-20 h-full w-3 -translate-x-1/2 cursor-col-resize touch-none outline-none focus-visible:ring-2 focus-visible:ring-[#2185d0]"><span className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 bg-[#999]" /><span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center border border-[#555] bg-white text-[20px] leading-none shadow-sm">↔</span></div>
    </div>
    <PartNavigation floating current={passage} total={3} onChange={setPassage} />
      <footer data-ielts-test-footer className="grid shrink-0 grid-cols-3 items-center justify-items-center gap-4 border-t border-[#d5d5d5] bg-white px-3 py-1">{[1, 2, 3].map((item) => { const start = starts[item - 1]; const count = counts[item - 1]; return <div key={item} className="flex flex-col items-center"><button onClick={() => setPassage(item)} className="text-[14px] font-bold">Passage {item}</button><div className="mt-1 flex flex-wrap justify-center gap-1">{Array.from({ length: count }, (_, offset) => { const number = start + offset; return <button key={number} onClick={() => { setPassage(item); window.setTimeout(() => document.getElementById(`question-${number}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50); }} className={`h-6 min-w-6 rounded-sm border px-0.5 text-[13px] ${answers[number] ? "border-[#2185d0] font-semibold" : "border-transparent hover:border-[#2185d0]"}`}>{number}</button>; })}</div></div>; })}</footer>
  </main>;
}
