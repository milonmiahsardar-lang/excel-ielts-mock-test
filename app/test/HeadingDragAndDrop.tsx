"use client";

import { useEffect, useState, type DragEvent } from "react";

export type HeadingGroup = {
  options: readonly { label: string; text: string }[];
  questions: readonly { number: number; prompt: string }[];
};
type Props = {
  scope: string;
  group: HeadingGroup;
  answers: Record<number, string>;
  onAnswer: (number: number, value: string) => void;
};
const selected = new Map<string, string>();
const selectionEvent = "ielts:heading-selection";
function select(scope: string, label?: string) {
  if (label) selected.set(scope, label); else selected.delete(scope);
  window.dispatchEvent(new Event(selectionEvent));
}
function drag(event: DragEvent, scope: string, label: string) {
  event.dataTransfer.setData("application/x-ielts-heading", JSON.stringify({ scope, label }));
  event.dataTransfer.effectAllowed = "move";
}
function readDrop(event: DragEvent, scope: string, group: HeadingGroup): string | null {
  try {
    const value = JSON.parse(event.dataTransfer.getData("application/x-ielts-heading"));
    return value.scope === scope && group.options.some(option => option.label === value.label) ? value.label : null;
  } catch { return null; }
}
export function headingQuestion(group: HeadingGroup, paragraph: string) {
  return group.questions.find(question => question.prompt.trim().match(/(?:paragraph|section)\s+([A-Z])\s*$/i)?.[1].toUpperCase() === paragraph.toUpperCase());
}

export function HeadingBank({ scope, group, answers, onAnswer }: Props) {
  const [choice, setChoice] = useState<string | undefined>();
  useEffect(() => {
    const update = () => setChoice(selected.get(scope));
    window.addEventListener(selectionEvent, update); update();
    return () => window.removeEventListener(selectionEvent, update);
  }, [scope]);
  return <div className="space-y-2 rounded-sm border border-[#bdbdbd] bg-[#fafafa] p-2.5"
    role="group" aria-label="Draggable headings"
    onDragOver={event => event.preventDefault()}
    onDrop={event => {
      event.preventDefault();
      const label = readDrop(event, scope, group);
      if (label) group.questions.filter(question => answers[question.number] === label).forEach(question => onAnswer(question.number, ""));
      select(scope);
    }}>
    <p className="sr-only">Drag a heading to the numbered space above a paragraph, or select a heading and activate its paragraph space. Press Delete in a filled space to remove the heading.</p>
    {group.options.map(option => <button key={option.label} type="button" draggable
      aria-pressed={choice === option.label}
      onDragStart={event => drag(event, scope, option.label)}
      onClick={() => select(scope, choice === option.label ? undefined : option.label)}
      className={`flex w-full cursor-grab items-start gap-3 rounded-sm border bg-white px-2.5 py-1.5 text-left leading-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-[#2185d0] active:cursor-grabbing ${choice === option.label ? "border-[#2185d0]" : "border-[#bdbdbd]"}`}>
      <span className="shrink-0">{option.label}.</span><span>{option.text}</span>
    </button>)}
  </div>;
}

export function HeadingDrop({ scope, group, paragraph, answers, onAnswer }: Props & { paragraph: string }) {
  const [over, setOver] = useState(false);
  const question = headingQuestion(group, paragraph);
  if (!question) return null;
  const option = group.options.find(item => item.label === answers[question.number]);
  const place = (label: string) => {
    if (!group.options.some(item => item.label === label)) return;
    const previous = answers[question.number] || "";
    const source = group.questions.find(item => item.number !== question.number && answers[item.number] === label);
    if (source) onAnswer(source.number, previous);
    onAnswer(question.number, label); select(scope); setOver(false);
  };
  return <button type="button" id={`question-${question.number}`} draggable={Boolean(option)}
    aria-label={`Question ${question.number}, heading for paragraph ${paragraph}${option ? `: ${option.text}` : ": drop heading here"}`}
    onDragStart={event => { if (option) drag(event, scope, option.label); }}
    onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setOver(true); }}
    onDragLeave={() => setOver(false)}
    onDrop={event => { event.preventDefault(); const label = readDrop(event, scope, group); if (label) place(label); setOver(false); }}
    onClick={() => { const label = selected.get(scope); if (label) place(label); else if (option) select(scope, option.label); }}
    onKeyDown={event => {
      if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); onAnswer(question.number, ""); }
    }}
    className={`flex min-h-9 min-w-0 flex-1 scroll-m-6 items-center gap-2 border border-dashed px-2 py-1 text-left outline-none focus-visible:ring-1 focus-visible:ring-[#2185d0] ${over ? "border-[#2185d0] bg-blue-50" : "border-[#999] bg-white"} ${option ? "cursor-grab" : "cursor-pointer"}`}>
    <span className="inline-flex min-h-6 min-w-6 shrink-0 items-center justify-center border border-black bg-white px-1 font-bold">{question.number}</span>
    <span>{option ? `${option.label}. ${option.text}` : "Drop heading here"}</span>
  </button>;
}
