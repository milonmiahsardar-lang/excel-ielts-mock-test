import 'server-only';
import { studentDb } from '../student/db';
import { practiceStats, history, mockOverview } from '../student/data';
import { getContent } from './service';
import { fail } from '../student/security';
export function overview() { const d = studentDb(), count = (sql: string) => Number(d.prepare(sql).get()!.n); return { stats: { 'Registered Students': count('SELECT count(*) n FROM students'), 'Courses': count("SELECT count(*) n FROM learning_content WHERE kind='course'"), 'Lessons': count("SELECT count(*) n FROM lessons WHERE kind='lesson'"), 'Practice Questions': count("SELECT count(*) n FROM learning_content WHERE kind='question'"), 'Published Materials': count("SELECT (SELECT count(*) FROM learning_content WHERE status='published')+(SELECT count(*) FROM lessons WHERE published=1 AND archived=0) n"), 'Draft Materials': count("SELECT (SELECT count(*) FROM learning_content WHERE status='draft')+(SELECT count(*) FROM lessons WHERE published=0 AND archived=0) n"), 'Practice Attempts': count('SELECT count(*) n FROM practice_attempts') }, recent: d.prepare('SELECT s.name,a.status,a.started_at,l.title FROM practice_attempts a JOIN students s ON s.id=a.student_id JOIN lessons l ON l.id=a.lesson_id ORDER BY a.started_at DESC LIMIT 10').all() }; }
export function lookup() { const d = studentDb(); return { categories: d.prepare('SELECT id,name title FROM categories ORDER BY position,name').all(), topics: d.prepare('SELECT id,title,category_id categoryId,parent_id parentId FROM topics ORDER BY position,title').all(), courses: d.prepare("SELECT id,title FROM learning_content WHERE kind='course' AND status<>'archived' ORDER BY title").all(), modules: d.prepare("SELECT id,title,parent_id courseId FROM learning_content WHERE kind='module' AND status<>'archived' ORDER BY title").all(), media: d.prepare('SELECT id,name title,mime FROM learning_media ORDER BY created_at DESC LIMIT 200').all() }; }
export function contentList(resource: string, params: URLSearchParams) {
    const d = studentDb(), q = (params.get('q') || '').slice(0, 200), page = Math.max(1, Math.min(100000, Number(params.get('page')) || 1)), clauses: string[] = [], values: (string | number)[] = [];
    let table = '', title = 'title', extra = '', select = '*';
    if (['courses', 'modules', 'questions'].includes(resource)) {
        table = 'learning_content';
        clauses.push('kind=?');
        values.push(resource === 'courses' ? 'course' : resource === 'modules' ? 'module' : 'question');
        select = 'id,title,status,difficulty,category_id,topic_id,version,created_at,updated_at';
        if (q) {
            clauses.push('(title LIKE ? OR data LIKE ?)');
            values.push('%' + q + '%', '%' + q + '%');
        }
        if (params.get('type')) {
            clauses.push("json_extract(data,'$.type')=?");
            values.push(params.get('type')!);
        }
    }
    else if (['lessons', 'practice-sets', 'assessments'].includes(resource)) {
        table = 'lessons';
        clauses.push('kind=?');
        values.push(resource === 'lessons' ? 'lesson' : resource === 'assessments' ? 'assessment' : 'practice-set');
        select = "id,title,CASE WHEN archived=1 THEN 'archived' WHEN published=1 THEN 'published' ELSE 'draft' END status,difficulty,topic_id,version,position,created_at,updated_at";
        if (q) {
            clauses.push('title LIKE ?');
            values.push('%' + q + '%');
        }
    }
    else if (resource === 'categories') {
        table = 'categories';
        title = 'name';
        select = "id,name title,description,position,CASE WHEN active=1 THEN 'published' ELSE 'draft' END status";
        if (q) {
            clauses.push('name LIKE ?');
            values.push('%' + q + '%');
        }
    }
    else if (resource === 'topics') {
        table = 'topics';
        select = "id,title,category_id,position,CASE WHEN active=1 THEN 'published' ELSE 'draft' END status";
        if (q) {
            clauses.push('title LIKE ?');
            values.push('%' + q + '%');
        }
    }
    else if (resource === 'media') {
        table = 'learning_media';
        title = 'name';
        select = 'id,name title,mime,bytes,created_at';
        if (q) {
            clauses.push('name LIKE ?');
            values.push('%' + q + '%');
        }
        if (params.get('type')) {
            clauses.push('mime LIKE ?');
            values.push(params.get('type')! + '%');
        }
    }
    else if (resource === 'audit') {
        table = 'learning_audit';
        title = 'event';
        select = 'id,event title,actor_id,target_id,details,created_at';
        if (q) {
            clauses.push('(event LIKE ? OR target_id LIKE ?)');
            values.push('%' + q + '%', '%' + q + '%');
        }
    }
    else if (resource === 'students') {
        table = 'students s JOIN profiles p ON p.student_id=s.id';
        title = 's.name';
        select = "s.id,s.name title,s.email,s.joined_at,s.active,p.level,p.goal,(SELECT count(*) FROM practice_attempts a WHERE a.student_id=s.id) attempts,(SELECT count(DISTINCT lesson_id) FROM practice_attempts a WHERE a.student_id=s.id AND a.submitted_at IS NOT NULL)+(SELECT count(*) FROM lesson_completions lc WHERE lc.student_id=s.id) completed_lessons,(SELECT round(100.0*sum(correct_count)/sum(question_count),1) FROM practice_attempts a WHERE a.student_id=s.id AND a.correct_count IS NOT NULL) accuracy,(SELECT max(started_at) FROM practice_attempts a WHERE a.student_id=s.id) last_activity";
        if (q) {
            clauses.push('(s.name LIKE ? OR s.email LIKE ?)');
            values.push('%' + q + '%', '%' + q + '%');
        }
        if (params.get('difficulty')) {
            clauses.push('p.level=?');
            values.push(params.get('difficulty')!);
        }
    }
    else
        fail(404, 'Unknown content area.');
    if (['courses', 'modules', 'questions', 'lessons', 'practice-sets', 'assessments', 'topics'].includes(resource)) {
        if (params.get('category') && ['courses', 'modules', 'questions', 'topics'].includes(resource)) {
            clauses.push('category_id=?');
            values.push(params.get('category')!);
        }
        if (params.get('topic') && resource !== 'topics') {
            clauses.push('topic_id=?');
            values.push(params.get('topic')!);
        }
        if (params.get('difficulty') && resource !== 'topics') {
            clauses.push('difficulty=?');
            values.push(params.get('difficulty')!);
        }
    }
    const status = params.get('status');
    if (status && ['courses', 'modules', 'questions'].includes(resource)) {
        clauses.push('status=?');
        values.push(status);
    }
    else if (status && ['lessons', 'practice-sets', 'assessments'].includes(resource)) {
        clauses.push(status === 'archived' ? 'archived=1' : status === 'published' ? 'published=1 AND archived=0' : 'published=0 AND archived=0');
    }
    if (params.get('date') && ['courses', 'modules', 'questions', 'lessons', 'practice-sets', 'assessments', 'media', 'audit'].includes(resource)) {
        clauses.push('date(created_at)=?');
        values.push(params.get('date')!);
    }
    const where = clauses.length ? ' WHERE ' + clauses.join(' AND ') : '';
    const total = Number(d.prepare('SELECT count(*) n FROM ' + table + where).get(...values)!.n), sort = params.get('sort') === 'title' ? title : resource === 'students' ? 's.joined_at' : ['topics', 'categories'].includes(resource) ? 'position' : 'created_at';
    extra = ' ORDER BY ' + sort + (params.get('direction') === 'asc' ? ' ASC' : ' DESC');
    const rows = d.prepare('SELECT ' + select + ' FROM ' + table + where + extra + ' LIMIT 25 OFFSET ?').all(...values, (page - 1) * 25);
    return { rows, total, page, pages: Math.max(1, Math.ceil(total / 25)) };
}
export function studentDetail(id: string) { const student = studentDb().prepare('SELECT s.id,s.name,s.email,s.joined_at,s.active,p.level,p.goal FROM students s JOIN profiles p ON p.student_id=s.id WHERE s.id=?').get(id); if (!student)
    fail(404, 'Student not found.'); return { student, stats: practiceStats(id), history: history(id), mock: mockOverview(id), enrolments: studentDb().prepare('SELECT course_id FROM learning_enrolments WHERE student_id=?').all(id) }; }
export function analytics() { const d = studentDb(); return { ...overview(), activeStudents: Number(d.prepare("SELECT count(DISTINCT student_id) n FROM practice_attempts WHERE datetime(started_at)>=datetime('now','-30 days')").get()!.n), accuracy: d.prepare('SELECT round(100.0*sum(correct_count)/sum(question_count),1) accuracy FROM practice_attempts WHERE correct_count IS NOT NULL').get()!.accuracy, categories: d.prepare('SELECT c.name,count(a.id) attempts FROM categories c LEFT JOIN topics t ON t.category_id=c.id LEFT JOIN lessons l ON l.topic_id=t.id LEFT JOIN practice_attempts a ON a.lesson_id=l.id GROUP BY c.id ORDER BY attempts DESC').all(), topics: d.prepare('SELECT t.title,round(100.0*sum(a.correct_count)/sum(a.question_count),1) accuracy FROM practice_attempts a JOIN lessons l ON l.id=a.lesson_id JOIN topics t ON t.id=l.topic_id WHERE a.correct_count IS NOT NULL GROUP BY t.id ORDER BY accuracy LIMIT 20').all(), courses: d.prepare("SELECT c.title,(SELECT count(*) FROM learning_enrolments e WHERE e.course_id=c.id) enrolled,(SELECT count(DISTINCT lc.student_id) FROM lesson_completions lc JOIN lessons l ON l.id=lc.lesson_id WHERE l.course_id=c.id AND NOT EXISTS(SELECT 1 FROM lessons need WHERE need.course_id=c.id AND need.kind='lesson' AND need.published=1 AND need.archived=0 AND NOT EXISTS(SELECT 1 FROM lesson_completions done WHERE done.lesson_id=need.id AND done.student_id=lc.student_id))) completed FROM learning_content c WHERE c.kind='course'").all() }; }
export function preview(resource: string, id: string) { const record = getContent(resource, id); if (resource === 'courses')
    return { ...record, outline: studentDb().prepare('SELECT title,kind,published,position FROM lessons WHERE course_id=? ORDER BY module_id,position,title').all(id) }; if (['practice-sets', 'assessments'].includes(resource))
    return { ...record, questions: studentDb().prepare('SELECT content,key_json FROM questions WHERE lesson_id=? ORDER BY position').all(id).map(r => ({ ...JSON.parse(String(r.content)), key: JSON.parse(String(r.key_json)) })) }; return record; }
export function courseCompletionRates() { const d = studentDb(); return d.prepare("SELECT id,title FROM learning_content WHERE kind='course'").all().map(c => { const id = String(c.id), participants = d.prepare('SELECT student_id FROM learning_enrolments WHERE course_id=? UNION SELECT lc.student_id FROM lesson_completions lc JOIN lessons l ON l.id=lc.lesson_id WHERE l.course_id=? UNION SELECT a.student_id FROM practice_attempts a JOIN lessons l ON l.id=a.lesson_id WHERE l.course_id=?').all(id, id, id); const required = d.prepare('SELECT id,kind FROM lessons WHERE course_id=? AND published=1 AND archived=0').all(id); const completed = required.length ? participants.filter(p => required.every(l => l.kind === 'lesson' ? !!d.prepare('SELECT 1 FROM lesson_completions WHERE student_id=? AND lesson_id=?').get(String(p.student_id), String(l.id)) : !!d.prepare('SELECT 1 FROM practice_attempts WHERE student_id=? AND lesson_id=? AND submitted_at IS NOT NULL').get(String(p.student_id), String(l.id)))).length : 0; return { title: String(c.title), participants: participants.length, requiredMaterials: required.length, completed, completionRate: participants.length && required.length ? Math.round(completed / participants.length * 100) : null }; }); }
