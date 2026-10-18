"use client";

import { Fragment } from "react";

type AnswerProps = {
  number: number;
  answers: Record<number, string>;
  onAnswer: (number: number, value: string) => void;
};

export function SummaryGap({ number, answers, onAnswer }: AnswerProps) {
  const value = answers[number] || "";
  return <input
    id={`question-${number}`} aria-label={`Answer for question ${number}`}
    type="text" value={value} placeholder={String(number)}
    onChange={event => onAnswer(number, event.target.value)}
    autoComplete="off" spellCheck={false}
    className="mx-1 inline-block h-[34px] w-36 max-w-full scroll-m-6 rounded-md border border-dashed border-[#777] bg-white px-2 align-middle leading-6 text-black outline-none placeholder:font-bold placeholder:text-black placeholder:opacity-100 focus:border-[#2185d0] focus:ring-1 focus:ring-[#2185d0]"
    style={{ textAlign: value ? "left" : "center" }}
  />;
}

export default function SummaryWithoutClues({ paragraphs, answers, onAnswer }: Omit<AnswerProps, "number"> & { paragraphs: string[] }) {
  const richText = (text: string) => text.split(/(\{\{\d+\}\}|\*\*[^*]+\*\*|\n)/g).map((part, index) => {
    const blank = part.match(/^\{\{(\d+)\}\}$/);
    if (blank) return <SummaryGap key={index} number={Number(blank[1])} answers={answers} onAnswer={onAnswer} />;
    if (part.startsWith("**") && part.endsWith("**")) return <b key={index}>{part.slice(2, -2)}</b>;
    return part === "\n" ? <br key={index} /> : <Fragment key={index}>{part}</Fragment>;
  });
  return <div className="space-y-4">{paragraphs.map((paragraph, index) => <p key={index} className="py-2 leading-9">{richText(paragraph)}</p>)}</div>;
}
