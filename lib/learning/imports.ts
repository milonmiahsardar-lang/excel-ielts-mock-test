import 'server-only';
import { randomUUID } from 'node:crypto';
import { studentDb } from '../student/db';
import { fail } from '../student/security';
import { question, object, list, stringValue } from './validation';
import { getContent, saveContent, audit } from './service';
import { parseCSV, parseXLSX, csv, xlsx } from './tabular';
export const importColumns = ['id', 'categoryId', 'topicId', 'type', 'difficulty', 'prompt', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation', 'marks', 'structured'];
export function parseImport(filename: string, encoded: string) { if (encoded.length > 6 * 1024 * 1024)
    fail(413, 'Import files must be at most 4 MB.'); const bytes = Buffer.from(encoded, 'base64'); if (bytes.length > 4 * 1024 * 1024)
    fail(413, 'Import files must be at most 4 MB.'); if (filename.toLowerCase().endsWith('.json')) {
    const data = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
    const rows = list(data, 1000).map(object);
    return { headers: [...new Set(rows.flatMap(Object.keys))], rows };
} const data = filename.toLowerCase().endsWith('.xlsx') ? parseXLSX(bytes) : filename.toLowerCase().endsWith('.csv') ? parseCSV(bytes.toString('utf8').replace(/^\uFEFF/, '')) : null; if (!data)
    fail(400, 'Choose CSV, XLSX or JSON.'); if (!data.length)
    return { headers: [], rows: [] }; const headers = data[0]; if (new Set(headers).size !== headers.length)
    fail(400, 'Duplicate import column names.'); return { headers, rows: data.slice(1, 1001).map(row => Object.fromEntries(headers.map((h, i) => [h, row[i] || '']))) }; }
export function previewImport(rows: unknown, mapping: Record<string, unknown>, categoryId: string, overwrite: boolean) { const result: {
    row: number;
    record: Record<string, unknown> | null;
    error: string;
}[] = [], seen = new Set<string>(); list(rows, 1000).forEach((value, index) => { try {
    const raw = object(value), mapped: Record<string, unknown> = {};
    for (const [target, source] of Object.entries(mapping))
        if (typeof source === 'string')
            mapped[target] = raw[source];
    let data: Record<string, unknown> = { ...raw, ...mapped };
    if (data.structured) {
        const structured = typeof data.structured === 'string' ? JSON.parse(data.structured) : object(data.structured);
        data = { ...data, ...structured };
    }
    data.prompt=data.prompt||data.question;data.type=String(data.type||data.question_type||'').replaceAll('_','-');if(data.type==='fill-in-blanks')data.type='fill-in-the-blanks';
            const category=categoryId||String(data.categoryId||data.category||'');const categoryRows=studentDb().prepare('SELECT id FROM categories WHERE id=? OR lower(name)=lower(?)').all(category,category);if(categoryRows.length!==1)fail(400,'Category is missing or ambiguous. Use a category ID.');data.categoryId=String(categoryRows[0].id);
            const topic=String(data.topicId||data.topic||'');const topicRows=studentDb().prepare('SELECT id FROM topics WHERE category_id=? AND (id=? OR lower(title)=lower(?))').all(String(data.categoryId),topic,topic);if(topicRows.length!==1)fail(400,'Topic is missing or ambiguous. Use a topic ID.');data.topicId=String(topicRows[0].id);
            const id = data.id ? stringValue(data.id, 'ID', 80) : randomUUID();
    data = { ...data, id, title: data.title || data.prompt, status: data.status || 'draft', categoryId: categoryId || data.categoryId, marks: Number(data.marks) || 1 };
    if (!data.options) {
        data.options = ['a', 'b', 'c', 'd'].filter(k => data['option_' + k]).map(k => ({ id: k.toUpperCase(), text: String(data['option_' + k]) }));
    }
    if (!data.accepted)
        data.accepted = data.correct_answer ? [String(data.correct_answer)] : [];
    question(data, true);
    if (!studentDb().prepare('SELECT 1 FROM topics WHERE id=? AND category_id=?').get(String(data.topicId), String(data.categoryId)))
        fail(400, 'Choose a valid category/topic.');
    const fingerprint = String(data.categoryId) + ':' + String(data.prompt).trim().toLowerCase();
    if (seen.has(fingerprint))
        fail(400, 'Repeated question in this import.');
    seen.add(fingerprint);
    const existing = studentDb().prepare("SELECT id FROM learning_content WHERE kind='question' AND (id=? OR (category_id=? AND lower(trim(json_extract(data,'$.prompt')))=?))").get(id, String(data.categoryId), String(data.prompt).trim().toLowerCase());
    if (existing && !overwrite)
        fail(409, 'Duplicate existing question; overwrite is not enabled.');
    if (existing) {
        data.id = String(existing.id);
        data.version = getContent('questions', String(existing.id)).version;
    }
    result.push({ row: index + 2, record: data, error: '' });
}
catch (e) {
    result.push({ row: index + 2, record: null, error: e instanceof Error ? e.message : 'Invalid row.' });
} }); return result; }
export function commitImport(data: Record<string, unknown>, actor: string) { const preview = previewImport(data.rows, object(data.mapping || {}), String(data.categoryId || ''), data.overwrite === true), results: {
    row: number;
    id?: string;
    error?: string;
}[] = []; for (const row of preview) {
    if (!row.record) {
        results.push({ row: row.row, error: row.error });
        continue;
    }
    try {
        const saved = saveContent('questions', row.record, actor);
        results.push({ row: row.row, id: saved.id });
    }
    catch (e) {
        results.push({ row: row.row, error: e instanceof Error ? e.message : 'Unable to save.' });
    }
} audit(actor, 'questions.imported', 'batch', { saved: results.filter(r => r.id).length, failed: results.filter(r => r.error).length }); return { results }; }
export function exportQuestions(format: string, template = false) { if(!template&&Number(studentDb().prepare("SELECT count(*) n FROM learning_content WHERE kind='question'").get()!.n)>10000)fail(400,'This collection exceeds 10000 questions. Use the complete Learning database backup instead.'); const records = template ? [] : studentDb().prepare("SELECT id FROM learning_content WHERE kind='question' ORDER BY created_at LIMIT 10000").all().map(r => getContent('questions', String(r.id))); if (format === 'json')
    return { bytes: Buffer.from(JSON.stringify(records, null, 2)), mime: 'application/json', extension: 'json' }; const rows = [importColumns, ...records.map(r => importColumns.map(key => key === 'structured' ? JSON.stringify(r) : String(r[key] ?? '')))]; return format === 'xlsx' ? { bytes: xlsx(rows), mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: 'xlsx' } : { bytes: Buffer.from(csv(rows)), mime: 'text/csv; charset=utf-8', extension: 'csv' }; }
