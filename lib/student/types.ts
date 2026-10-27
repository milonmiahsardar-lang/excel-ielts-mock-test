export type Student = {
    id: string;
    name: string;
    email: string;
    mobile: string;
    dob: string;
    country: string;
    level: string;
    goal: string;
    joinedAt: string;
};
export type QuestionType = 'multiple-choice' | 'fill-in-the-blanks' | 'short-answer' | 'sentence-completion' | 'matching' | 'true-false' | 'sentence-rearrangement' | 'error-identification' | 'true-false-not-given' | 'error-correction' | 'free-text';
export type PracticeQuestion = {
    id: string;
    type: QuestionType;
    prompt: string;
    options?: {
        id: string;
        text: string;
    }[];
    items?: {
        id: string;
        text: string;
    }[];
    maxWords?: number;
    minWords?: number;
    marks?: number;
    passage?: string;
    instructions?: string;
    mediaIds?: string[];
    mediaTypes?: Record<string,string>;
};
export type QuestionKey = {
    accepted?: string[];
    pairs?: Record<string, string>;
    sequence?: string[];
    explanation: string;
    sampleAnswer?: string;
    criteria?: string;
};
export type PracticeAnswer = string | Record<string, string> | string[];
export type PracticeResult = {
    id: string;
    status: 'completed' | 'pending-review';
    correct: number | null;
    total: number;
    elapsedSeconds: number;
    score?: number | null;
    totalMarks?: number;
    passed?: boolean | null;
    allowRetries?: boolean;
    feedback: {
        id: string;
        status: 'correct' | 'incorrect' | 'pending-review';
        explanation: string;
        expected: string;
    }[];
};
export type Lesson = {
    id: string;
    title: string;
    topicId: string;
    instructions: string;
    questions: PracticeQuestion[];
    kind?: string;
    blocks?: import("../learning/types").Block[];
    policy?: Record<string,unknown>;
};
