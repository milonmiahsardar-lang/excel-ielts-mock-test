"use client";

import { useId, type ReactNode } from "react";

type Props = {
  questions: readonly { number: number; prompt: string }[];
  letters: readonly string[];
  answers: Record<number, string>;
  onAnswer: (number: number, value: string) => void;
  renderPrompt?: (prompt: string) => ReactNode;
};

// Inherit the test's typography; only the answer presentation changes.
export default function ParagraphInformationTable({ questions, letters, answers, onAnswer, renderPrompt }: Props) {
  const scope = useId();
  return <div className="w-full overflow-x-auto">
    <table aria-label="Match information to paragraphs" className="w-full table-fixed border-collapse border border-[#bdbdbd] text-left" style={{ minWidth: 320 + letters.length * 36 }}>
      <colgroup><col />{letters.map(letter => <col key={letter} style={{ width: 37 }} />)}</colgroup>
      <thead className="bg-[#efefef]">
        <tr><th scope="col" aria-label="Information" className="border border-[#bdbdbd] px-2.5 py-3" />
          {letters.map(letter => <th scope="col" key={letter} className="border border-[#bdbdbd] px-1 py-3 text-center font-bold">{letter}</th>)}
        </tr>
      </thead>
      <tbody>{questions.map(question => <tr id={`question-${question.number}`} key={question.number} className="scroll-m-6">
        <th scope="row" className="border border-[#bdbdbd] px-2.5 py-2 text-left align-middle font-normal">
          <span className="mr-2 inline-flex min-h-7 min-w-7 items-center justify-center rounded-[1px] border border-black px-1 font-bold align-middle">{question.number}</span>
          {renderPrompt ? renderPrompt(question.prompt) : question.prompt}
        </th>
        {letters.map(letter => <td key={letter} className="border border-[#bdbdbd] p-0 text-center align-middle">
          <label className="flex min-h-12 cursor-pointer items-center justify-center self-stretch px-1 py-3">
            <input type="radio" name={`${scope}-question-${question.number}`} value={letter}
              aria-label={`Question ${question.number}, paragraph ${letter}`}
              checked={answers[question.number] === letter} onChange={() => onAnswer(question.number, letter)}
              className="h-4 w-4 cursor-pointer accent-[#2185d0]" />
          </label>
        </td>)}
      </tr>)}</tbody>
    </table>
  </div>;
}
