import 'server-only';
import { studentDb } from '../student/db';
import type { Category } from './types';
function activeChain(table: string, id: string) { const d = studentDb(), seen = new Set<string>(); let cursor: string | null = id; while (cursor) {
    if (seen.has(cursor))
        return false;
    seen.add(cursor);
    const row = d.prepare('SELECT active,parent_id FROM ' + table + ' WHERE id=?').get(cursor);
    if (!row || !row.active)
        return false;
    cursor = row.parent_id ? String(row.parent_id) : null;
} return true; }
export function learningCategories(): Category[] { const d = studentDb(); return d.prepare('SELECT * FROM categories WHERE active=1 ORDER BY position,name').all().filter(r => activeChain('categories', String(r.id))).map(r => ({ slug: String(r.id), name: String(r.name), description: String(r.description), icon: String(r.icon), position: Number(r.position), parentId: r.parent_id ? String(r.parent_id) : null, topics: d.prepare('SELECT title FROM topics WHERE category_id=? AND active=1 ORDER BY position,title').all(String(r.id)).map(t => String(t.title)) })); }
export function learningCategory(slug: string) { return learningCategories().find(c => c.slug === slug); }
export function categoryTopics(categoryId: string) { return studentDb().prepare('SELECT * FROM topics WHERE category_id=? AND active=1 ORDER BY position,title').all(categoryId).filter(r => activeChain('topics', String(r.id))); }
export function courseVisible(courseId: string | null, studentId?: string) { if (!courseId)
    return true; const row = studentDb().prepare("SELECT data,category_id FROM learning_content WHERE id=? AND kind='course' AND status='published'").get(courseId); if (!row || row.category_id && !activeChain('categories', String(row.category_id)))
    return false; const data = JSON.parse(String(row.data)); return data.visibility !== 'enrolled' || !!studentId && !!studentDb().prepare('SELECT 1 FROM learning_enrolments WHERE student_id=? AND course_id=?').get(studentId, courseId); }
export function lessonVisible(id: string, studentId?: string) { const d = studentDb(), row = d.prepare('SELECT l.*,t.active topic_active,c.active category_active FROM lessons l JOIN topics t ON t.id=l.topic_id JOIN categories c ON c.id=t.category_id WHERE l.id=? AND l.published=1 AND l.archived=0').get(id); return row && row.topic_active && row.category_active && activeChain('topics', String(row.topic_id)) && activeChain('categories', String(d.prepare('SELECT category_id FROM topics WHERE id=?').get(String(row.topic_id))!.category_id)) && (!row.module_id || !!d.prepare("SELECT 1 FROM learning_content WHERE id=? AND kind='module' AND status='published' AND parent_id=?").get(String(row.module_id), String(row.course_id))) && courseVisible(row.course_id ? String(row.course_id) : null, studentId) ? row : null; }
