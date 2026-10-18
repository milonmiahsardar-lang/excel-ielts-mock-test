"use client";

import { Fragment, useId, useState, type DragEvent } from "react";

type Props = {
  paragraphs: string[];
  options: readonly { label: string; text: string }[];
  answers: Record<number, string>;
  onAnswer: (number: number, value: string) => void;
  optionTitle?: string;
  allowReuse?: boolean;
};

// Presentation only: answer values remain the original option letters.
export default function SummaryWithClues({ paragraphs, options, answers, onAnswer, optionTitle, allowReuse = false }: Props) {
  const scope = useId();
  const [selected, setSelected] = useState<string | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const numbers = paragraphs.flatMap(text => [...text.matchAll(/\{\{(\d+)\}\}/g)].map(match => Number(match[1])));
  const valid = (value: string) => options.some(option => option.label === value);
  const place = (number: number, value: string) => {
    if (!valid(value)) return;
    const previous = answers[number] || "";
    if (!allowReuse) {
      const source = numbers.find(item => item !== number && answers[item] === value);
      if (source !== undefined) onAnswer(source, previous);
    }
    onAnswer(number, value);
    setSelected(null);
    setOver(null);
    setAnnouncement(`Question ${number}: ${options.find(option => option.label === value)?.text}`);
  };
  const startDrag = (event: DragEvent, value: string) => {
    event.dataTransfer.setData("application/x-ielts-summary", JSON.stringify({ scope, value }));
    event.dataTransfer.effectAllowed = "move";
    setSelected(value);
  };
  const drop = (event: DragEvent, number?: number) => {
    event.preventDefault();
    setOver(null);
    try {
      const data = JSON.parse(event.dataTransfer.getData("application/x-ielts-summary"));
      if (data.scope !== scope || !valid(data.value)) return;
      if (number !== undefined) place(number, data.value);
      else numbers.filter(item => answers[item] === data.value).forEach(item => onAnswer(item, ""));
    } catch { /* Ignore text or clues dragged from another question group. */ }
    setSelected(null);
  };
  const gap = (number: number) => {
    const option = options.find(item => item.label === answers[number]);
    return <button
      type="button" id={`question-${number}`} aria-label={`Question ${number}${option ? `: ${option.text}` : ": empty gap"}`}
      aria-describedby={`${scope}-help`} draggable={Boolean(option)}
      onDragStart={event => { if (option) startDrag(event, option.label); }}
      onDragEnd={() => { setSelected(null); setOver(null); }}
      onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setOver(number); }}
      onDragLeave={() => setOver(null)} onDrop={event => drop(event, number)}
      onClick={() => { if (selected) place(number, selected); else if (option) setSelected(option.label); }}
      onKeyDown={event => {
        if (event.key === "Delete" || event.key === "Backspace") { event.preventDefault(); onAnswer(number, ""); }
        if (event.key === "Escape") setSelected(null);
      }}
      className={`mx-1 inline-flex min-h-8 min-w-[116px] max-w-full scroll-m-6 items-center justify-center rounded-md border border-dashed px-2 py-0.5 align-middle leading-6 text-black outline-none focus-visible:border-[#2185d0] focus-visible:ring-1 focus-visible:ring-[#2185d0] ${over === number ? "border-[#2185d0] bg-blue-50" : "border-[#777] bg-white"} ${option ? "cursor-grab font-normal" : "font-bold"}`}
    >{option?.text || number}</button>;
  };
  const richText = (text: string) => text.split(/(\{\{\d+\}\}|\*\*[^*]+\*\*|\n)/g).map((part, index) => {
    const match = part.match(/^\{\{(\d+)\}\}$/);
    if (match) return <Fragment key={index}>{gap(Number(match[1]))}</Fragment>;
    if (part.startsWith("**") && part.endsWith("**")) return <b key={index}>{part.slice(2, -2)}</b>;
    return part === "\n" ? <br key={index} /> : <Fragment key={index}>{part}</Fragment>;
  });
  return <div>
    <p id={`${scope}-help`} className="sr-only">Drag a clue into a numbered gap, or select a clue then activate a gap. Press Delete on a filled gap to clear it. Drag a filled clue back to the list to remove it.</p>
    <div className="space-y-4">{paragraphs.map((paragraph, index) => <p key={index} className="py-2 leading-9">{richText(paragraph)}</p>)}</div>
    <div role="group" aria-label={optionTitle || "Summary clues"} className="mt-12 flex min-h-10 flex-wrap items-center gap-2 pb-2"
      onDragOver={event => event.preventDefault()} onDrop={event => drop(event)}>
      {options.map(option => {
        const used = !allowReuse && numbers.some(number => answers[number] === option.label);
        if (used) return null;
        return <button key={option.label} type="button" draggable aria-pressed={selected === option.label}
          aria-label={`${option.label}: ${option.text}`} aria-describedby={`${scope}-help`}
          onDragStart={event => startDrag(event, option.label)} onDragEnd={() => { setSelected(null); setOver(null); }}
          onClick={() => setSelected(selected === option.label ? null : option.label)}
          className={`cursor-grab rounded border bg-white px-2 py-0.5 leading-6 text-black outline-none focus-visible:ring-2 focus-visible:ring-[#2185d0] active:cursor-grabbing ${selected === option.label ? "border-[#2185d0] ring-1 ring-[#2185d0]" : "border-[#999]"}`}
        >{option.text}</button>;
      })}
    </div>
    <span role="status" aria-live="polite" className="sr-only">{announcement}</span>
  </div>;
}
