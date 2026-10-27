export type ContentStatus = 'draft' | 'published' | 'archived';
export type Block = {
    type: 'heading' | 'paragraph' | 'rule' | 'example' | 'bullets' | 'numbered' | 'table' | 'image' | 'audio' | 'pdf' | 'practice';
    text?: string;
    rows?: string[][];
    mediaId?: string;
    practiceId?: string;
    level?: number;
};
export type Category = {
    slug: string;
    name: string;
    description: string;
    icon: string;
    topics: string[];
    position: number;
    parentId: string | null;
};
export const questionTypes = ['multiple-choice', 'fill-in-the-blanks', 'sentence-completion', 'true-false', 'true-false-not-given', 'matching', 'sentence-rearrangement', 'error-correction', 'short-answer', 'free-text', 'error-identification'] as const;
export const resources = ['courses', 'modules', 'categories', 'topics', 'lessons', 'questions', 'practice-sets', 'assessments'] as const;
export type Resource = typeof resources[number];
export type ContentRecord = Record<string, unknown> & {
    id: string;
    title: string;
    status: string;
    version: number;
};
