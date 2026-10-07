type Question = { number: number; prompt: string };
type GroupBase = { title: string; instructions: string[]; heading?: string };

export type ReadingQuestionGroup = GroupBase & (
  | { type: "choice"; questions: (Question & { options: string[] })[] }
  | { type: "truth"; labels: string[]; questions: Question[] }
  | { type: "match"; optionTitle?: string; options: { label: string; text: string }[]; questions: Question[]; examples?: string[] }
  | { type: "fill"; paragraphs: string[]; shortAnswers?: boolean; optionTitle?: string; options?: { label: string; text: string }[] }
  | { type: "table"; columns: string[]; rows: string[][] }
  | { type: "multiple"; questions: { numbers: number[]; prompt: string; options: string[] }[] }
  | { type: "diagram"; image: string; numbers: number[] }
);

export type ImportedReadingTest = {
  number: number;
  passages: {
    title: string;
    paragraphs: string[];
    start: number;
    end: number;
    groups: ReadingQuestionGroup[];
  }[];
};
