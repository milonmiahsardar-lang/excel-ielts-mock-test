import { studentDb } from '../student/db';
import { fail, field } from '../student/security';
import { questionTypes, type Block } from './types';
import type { PracticeQuestion, QuestionKey } from '../student/types';
export const stringValue = (v: unknown, label: string, max = 5000, required = false) => field(v ?? '', label, max, required);
export const identifier = (v: unknown, label = 'ID') => { const s = stringValue(v, label, 80, true); if (!/^[A-Za-z0-9][A-Za-z0-9:_-]*$/.test(s))
    fail(400, 'Invalid ' + label + '.'); return s; };
export function numberValue(v: unknown, min: number, max: number, defaultValue = 0) { if (v === undefined || v === '')
    return defaultValue; const n = Number(v); if (!Number.isFinite(n) || n < min || n > max)
    fail(400, 'A numeric value is out of range.'); return n; }
export function list(v: unknown, max = 100): unknown[] { if (v === undefined)
    return []; if (!Array.isArray(v) || v.length > max)
    fail(400, 'Invalid or oversized list.'); return v; }
export function object(v: unknown): Record<string, unknown> { if (!v || typeof v !== 'object' || Array.isArray(v))
    fail(400, 'Invalid structured data.'); return v as Record<string, unknown>; }
export function blocks(v: unknown): Block[] { return list(v, 300).map(value => { const b = object(value), type = stringValue(b.type, 'block type', 30); if (!['heading', 'paragraph', 'rule', 'example', 'bullets', 'numbered', 'table', 'image', 'audio', 'pdf', 'practice'].includes(type))
    fail(400, 'Unsupported lesson block.'); return { type: type as Block['type'], text: stringValue(b.text, 'block text', 15000), rows: b.rows === undefined ? undefined : list(b.rows, 100).map(row => list(row, 20).map(cell => stringValue(cell, 'table cell', 2000))), mediaId: b.mediaId ? identifier(b.mediaId, 'media ID') : undefined, practiceId: b.practiceId ? identifier(b.practiceId, 'practice ID') : undefined, level: numberValue(b.level, 2, 4, 2) }; }); }
export function question(data: Record<string, unknown>, published: boolean): {
    content: PracticeQuestion;
    key: QuestionKey;
} {
    const type = stringValue(data.type, 'question type', 40) || 'multiple-choice';
    if (!questionTypes.some(t => t === type))
        fail(400, 'Unsupported question type.');
    const options = list(data.options).map(v => { const o = object(v); return { id: identifier(o.id, 'option ID'), text: stringValue(o.text, 'option', 300, published) }; }), items = list(data.items).map(v => { const o = object(v); return { id: identifier(o.id, 'item ID'), text: stringValue(o.text, 'item', 300, published) }; });
    for (const values of [options, items])
        if (new Set(values.map(v => v.id)).size !== values.length)
            fail(400, 'Repeated option or item IDs.');
    const accepted = list(data.accepted).map(v => stringValue(v, 'accepted answer', 5000, published)), sequence = list(data.sequence).map(v => identifier(v, 'sequence item')), pairs: Record<string, string> = {};
    if (data.pairs !== undefined)
        for (const [a, b] of Object.entries(object(data.pairs)))
            pairs[identifier(a, 'matching item')] = identifier(b, 'matching option');
    const maxWords = data.maxWords ? numberValue(data.maxWords, 1, 1000) : undefined, minWords = data.minWords ? numberValue(data.minWords, 1, 1000) : undefined;
    const content: PracticeQuestion = { id: String(data.id || ''), type: type as PracticeQuestion['type'], prompt: stringValue(data.prompt ?? data.title, 'question text', 15000, published), options, items, maxWords, minWords, passage: stringValue(data.passage, 'passage reference', 20000), instructions: stringValue(data.instructions, 'instructions', 5000), mediaIds: list(data.mediaIds, 10).map(v => identifier(v, 'media ID')) };
    content.mediaTypes = {};
    for (const id of content.mediaIds || []) {
        const media = studentDb().prepare('SELECT mime FROM learning_media WHERE id=?').get(id);
        if (!media)
            fail(400, 'Attached media does not exist.');
        content.mediaTypes[id] = String(media.mime);
    }
    const key: QuestionKey = { accepted, pairs, sequence, explanation: stringValue(data.explanation, 'explanation', 10000), sampleAnswer: stringValue(data.sampleAnswer, 'sample answer', 10000), criteria: stringValue(data.criteria, 'assessment criteria', 5000) };
    if ((minWords && !Number.isInteger(minWords)) || (maxWords && !Number.isInteger(maxWords)))
        fail(400, 'Word limits must be whole numbers.');
    if (published) {
        if (type === 'multiple-choice' && data.legacy!==true && options.length < 4)
            fail(400, 'Multiple-choice questions require at least four options.');
        if (minWords && maxWords && minWords > maxWords)
            fail(400, 'Minimum words cannot exceed maximum words.');
        if (['multiple-choice', 'true-false', 'true-false-not-given', 'error-identification'].includes(type)) {
            if (options.length < 2 || accepted.length !== 1 || !options.some(o => o.id === accepted[0]))
                fail(400, 'A choice question needs options and one correct option ID.');
            if (type === 'true-false' && options.length !== 2)
                fail(400, 'True/False requires two options.');
            if (type === 'true-false-not-given' && options.length !== 3)
                fail(400, 'True/False/Not Given requires three options.');
        }
        else if (type === 'matching') {
            if (!items.length || !options.length || Object.keys(pairs).length !== items.length || !items.every(i => options.some(o => o.id === pairs[i.id])))
                fail(400, 'Map every left-hand item to a valid right-hand option.');
        }
        else if (type === 'sentence-rearrangement') {
            if (!items.length || sequence.length !== items.length || new Set(sequence).size !== items.length || !items.every(i => sequence.includes(i.id)))
                fail(400, 'Provide each rearrangement item exactly once in the correct sequence.');
        }
        else if (type !== 'free-text' && (!accepted.length || accepted.some(a => !a || !!maxWords && a.split(/\s+/).length > maxWords)))
            fail(400, 'Provide accepted answers that satisfy the word limit.');
    }
    return { content, key };
}
