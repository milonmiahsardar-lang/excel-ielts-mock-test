import 'server-only';
import { studentDb } from './db';
import {lessonVisible} from '../learning/catalog';
import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
export type HistoryFilter = {
    category?: string;
    date?: string;
    status?: string;
};
export function history(studentId: string, filters: HistoryFilter = {}) {
    const clauses = ['a.student_id=?'], values: string[] = [studentId];
    if (filters.category) {
        clauses.push('t.category_id=?');
        values.push(filters.category);
    }
    if (filters.date && /^\d{4}-\d{2}-\d{2}$/.test(filters.date)) {
        clauses.push("date(a.started_at,'+6 hours')=?");
        values.push(filters.date);
    }
    if (['in-progress', 'completed', 'pending-review'].includes(filters.status || '')) {
        clauses.push('a.status=?');
        values.push(filters.status!);
    }
    const attempts=studentDb().prepare('SELECT a.id,a.lesson_id,a.started_at,a.status,a.question_count,a.correct_count,a.elapsed_seconds,t.title topic,c.name category,\'practice\' activity_kind FROM practice_attempts a JOIN lessons l ON l.id=a.lesson_id JOIN topics t ON t.id=l.topic_id JOIN categories c ON c.id=t.category_id WHERE '+clauses.join(' AND ')+' ORDER BY a.started_at DESC LIMIT 200').all(...values);
    if(filters.status&&filters.status!=='completed')return attempts;
    const lectureClauses=['lc.student_id=?'],lectureValues:string[]=[studentId];if(filters.category){lectureClauses.push('t.category_id=?');lectureValues.push(filters.category);}if(filters.date&&/^\d{4}-\d{2}-\d{2}$/.test(filters.date)){lectureClauses.push("date(lc.completed_at,'+6 hours')=?");lectureValues.push(filters.date);}
    const lessons=studentDb().prepare("SELECT lc.lesson_id id,lc.lesson_id,lc.completed_at started_at,'completed' status,0 question_count,NULL correct_count,NULL elapsed_seconds,t.title topic,c.name category,'lesson' activity_kind FROM lesson_completions lc JOIN lessons l ON l.id=lc.lesson_id JOIN topics t ON t.id=l.topic_id JOIN categories c ON c.id=t.category_id WHERE "+lectureClauses.join(' AND ')+' ORDER BY lc.completed_at DESC LIMIT 200').all(...lectureValues);
    return [...attempts,...lessons].sort((a,b)=>String(b.started_at).localeCompare(String(a.started_at))).slice(0,200);
}
export function practiceStats(studentId: string) { const d = studentDb(), r = d.prepare("SELECT COUNT(*) sessions,COUNT(DISTINCT lesson_id) lessons,SUM(CASE WHEN correct_count IS NOT NULL THEN correct_count ELSE 0 END) correct,SUM(CASE WHEN correct_count IS NOT NULL THEN question_count ELSE 0 END) graded FROM practice_attempts WHERE student_id=? AND submitted_at IS NOT NULL").get(studentId)!; const completedIds=new Set(d.prepare("SELECT lesson_id FROM practice_attempts WHERE student_id=? AND submitted_at IS NOT NULL UNION SELECT lesson_id FROM lesson_completions WHERE student_id=?").all(studentId,studentId).map(r=>String(r.lesson_id)));const available=d.prepare("SELECT id FROM lessons WHERE published=1 AND archived=0 AND (kind='lesson' OR EXISTS(SELECT 1 FROM questions WHERE lesson_id=lessons.id))").all().filter(r=>lessonVisible(String(r.id),studentId));const total=available.length,availableCompleted=available.filter(r=>completedIds.has(String(r.id))).length; const performance = d.prepare('SELECT c.id,c.name,SUM(a.correct_count) correct,SUM(a.question_count) total FROM categories c LEFT JOIN topics t ON t.category_id=c.id LEFT JOIN lessons l ON l.topic_id=t.id LEFT JOIN practice_attempts a ON a.lesson_id=l.id AND a.student_id=? AND a.correct_count IS NOT NULL GROUP BY c.id ORDER BY c.name').all(studentId); const activity = d.prepare("SELECT date(submitted_at,'+6 hours') day,COUNT(*) count FROM practice_attempts WHERE student_id=? AND submitted_at IS NOT NULL AND date(submitted_at,'+6 hours')>=date('now','+6 hours','-30 days') GROUP BY day ORDER BY day").all(studentId).map(r => ({ label: String(r.day), value: Number(r.count) })); return { sessions: Number(r.sessions), completedLessons: completedIds.size, accuracy: Number(r.graded) ? Math.round(Number(r.correct) / Number(r.graded) * 100) : null, progress: total ? Math.min(100, Math.round(availableCompleted / total * 100)) : null, performance, activity }; }
export type MockOverview = {
    linked: boolean;
    unavailable: boolean;
    assignments: {
        id: string;
        test: number;
        mode: string;
        status: string;
    }[];
    completed: {
        id: string;
        test: number;
        mode: string;
        date: string;
        released: boolean;
        listening: number | null;
        reading: number | null;
        writing: number | null;
    }[];
    average: number | null;
};
export function mockOverview(studentId: string): MockOverview { const empty: MockOverview = { linked: false, unavailable: false, assignments: [], completed: [], average: null }, link = studentDb().prepare('SELECT candidate_id FROM mock_links WHERE student_id=?').get(studentId); if (!link)
    return empty; const file = resolve(/*turbopackIgnore: true*/ process.env.RESULTS_DB_PATH || 'private/results.sqlite'); if (!existsSync(/*turbopackIgnore: true*/ file))
    return { ...empty, linked: true, unavailable: true }; let mock: DatabaseSync | undefined; try {
    mock = new DatabaseSync(file, { readOnly: true });
    const candidate = String(link.candidate_id);
    if (!mock.prepare("SELECT 1 FROM users WHERE id=? AND role='student'").get(candidate))
        return { ...empty, linked: true, unavailable: true };
    const assignments = mock.prepare("SELECT id,test_id,mode,status FROM test_assignments WHERE candidate_id=? AND status IN ('ASSIGNED','IN_PROGRESS') AND (expires_at IS NULL OR expires_at>?) ORDER BY test_id").all(candidate, new Date().toISOString()).map(r => ({ id: String(r.id), test: Number(r.test_id), mode: String(r.mode), status: String(r.status) }));
    const completed = mock.prepare('SELECT id,test_id,mode,submitted_at,released,data FROM attempts WHERE student_id=? AND submitted_at IS NOT NULL ORDER BY submitted_at DESC').all(candidate).map(r => { let data: Record<string, unknown> = {}; try {
        data = JSON.parse(String(r.data));
    }
    catch { } const released = !!r.released, band = (value: unknown) => { const n = (value as {
        band?: unknown;
    } | null)?.band; return released && typeof n === 'number' && Number.isFinite(n) ? n : null; }; const mark = data.marking as {
        overall?: unknown;
    } | null; return { id: String(r.id), test: Number(r.test_id), mode: String(r.mode), date: String(r.submitted_at), released, listening: band(data.listening), reading: band(data.reading), writing: released && typeof mark?.overall === 'number' ? mark.overall : null }; });
    const scores = completed.flatMap(r => [r.listening, r.reading, r.writing]).filter((n): n is number => n !== null);
    return { linked: true, unavailable: false, assignments, completed, average: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10 : null };
}
catch {
    return { ...empty, linked: true, unavailable: true };
}
finally {
    mock?.close();
} }
export function activityPeriod() { const now = Date.now() + 6 * 3600000, today = new Date(now).toISOString().slice(0, 10); return { today, week: new Date(now - 6 * 86400000).toISOString().slice(0, 10), month: today.slice(0, 7) }; }
