import 'server-only';
import { randomUUID } from 'node:crypto';
import { studentDb, studentTransaction } from '../student/db';
import { fail } from '../student/security';
import { identifier, stringValue, numberValue, object, list, blocks, question } from './validation';
import { resources } from './types';
export function audit(actor: string, event: string, target: string, details: unknown = {}) { studentDb().prepare('INSERT INTO learning_audit VALUES(?,?,?,?,?,?)').run(randomUUID(), actor, event, target, JSON.stringify(details), new Date().toISOString()); }
const kind = (r: string) => r === 'courses' ? 'course' : r === 'modules' ? 'module' : r === 'questions' ? 'question' : r === 'lessons' ? 'lesson' : r === 'assessments' ? 'assessment' : 'practice-set';
function ref(table: string, id: unknown) { if (id && !studentDb().prepare('SELECT 1 FROM ' + table + ' WHERE id=?').get(String(id)))
    fail(400, 'Referenced content does not exist.'); }
function parentChain(table: string, id: string, parent: string | null) { let cursor = parent; const seen = new Set([id]); while (cursor) {
    if (seen.has(cursor))
        fail(400, 'A category/topic cannot contain itself.');
    seen.add(cursor);
    const row = studentDb().prepare('SELECT parent_id FROM ' + table + ' WHERE id=?').get(cursor);
    if (!row)
        fail(400, 'Parent does not exist.');
    cursor = row.parent_id ? String(row.parent_id) : null;
} }
export function getContent(resource: string, id: string) {
    const d = studentDb();
    let row;
    if (['courses', 'modules', 'questions'].includes(resource)) {
        row = d.prepare('SELECT * FROM learning_content WHERE id=? AND kind=?').get(id, kind(resource));
        if (!row)
            fail(404, 'Content not found.');
        return { ...JSON.parse(String(row.data)), id: String(row.id), title: String(row.title), status: String(row.status), version: Number(row.version) };
    }
    if (resource === 'categories') {
        row = d.prepare('SELECT * FROM categories WHERE id=?').get(id);
        if (!row)
            fail(404, 'Category not found.');
        return { id: String(row.id), title: String(row.name), description: String(row.description), icon: String(row.icon), position: Number(row.position), parentId: row.parent_id, active: !!row.active, status: row.active ? 'published' : 'draft', version: 0 };
    }
    if (resource === 'topics') {
        row = d.prepare('SELECT * FROM topics WHERE id=?').get(id);
        if (!row)
            fail(404, 'Topic not found.');
        return { id: String(row.id), title: String(row.title), slug: String(row.slug), categoryId: String(row.category_id), parentId: row.parent_id, position: Number(row.position), active: !!row.active, status: row.active ? 'published' : 'draft', version: 0 };
    }
    row = d.prepare('SELECT * FROM lessons WHERE id=? AND kind=?').get(id, kind(resource));
    if (!row)
        fail(404, 'Material not found.');
    return { ...JSON.parse(String(row.metadata)), id: String(row.id), title: String(row.title), instructions: String(row.instructions), topicId: String(row.topic_id), courseId: row.course_id, moduleId: row.module_id, difficulty: String(row.difficulty), position: Number(row.position), status: row.archived ? 'archived' : row.published ? 'published' : 'draft', version: Number(row.version), questionIds: d.prepare('SELECT question_id,marks FROM practice_set_questions WHERE set_id=? ORDER BY position').all(id).map(q => ({ id: String(q.question_id), marks: Number(q.marks) })) };
}
export function saveContent(resource: string, input: Record<string, unknown>, actor: string) {
    if (!resources.some(r => r === resource))
        fail(404, 'Unknown content area.');
    const d = studentDb(), id = input.id ? identifier(input.id) : randomUUID(), title = stringValue(input.title || (resource === 'questions' ? String(input.prompt || '').slice(0, 200) : ''), 'title', 200, true), status = stringValue(input.status, 'status', 20) || 'draft';
    if (!['draft', 'published', 'archived'].includes(status))
        fail(400, 'Invalid publication status.');
    return studentTransaction(() => {
        let existing: Record<string, unknown> | undefined;
        try {
            existing = getContent(resource, id);
        }
        catch (e) {
            if ((e as {
                status?: number;
            }).status !== 404)
                throw e;
        }
        if (existing && input.version !== undefined && Number(input.version) !== existing.version)
            fail(409, 'This content was changed elsewhere. Reload it before saving.');
        if (['courses', 'modules', 'questions'].includes(resource) && d.prepare('SELECT 1 FROM learning_content WHERE id=? AND kind<>?').get(id, kind(resource)))
            fail(409, 'This ID is already used by another content type.');
        if (['lessons', 'practice-sets', 'assessments'].includes(resource) && d.prepare('SELECT 1 FROM lessons WHERE id=? AND kind<>?').get(id, kind(resource)))
            fail(409, 'This ID is already used by another material type.');
        const published = status === 'published', now = new Date().toISOString();
        if (resource === 'categories' || resource === 'topics') {
            const table = resource, parent = input.parentId ? identifier(input.parentId) : null;
            parentChain(table, id, parent);
            if (resource === 'categories') {
                d.prepare('INSERT INTO categories(id,name,description,icon,position,active,parent_id) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,description=excluded.description,icon=excluded.icon,position=excluded.position,active=excluded.active,parent_id=excluded.parent_id').run(id, title, stringValue(input.description, 'description'), stringValue(input.icon, 'icon', 30) || 'book', numberValue(input.position, 0, 100000), Number(published), parent);
            }
            else {
                ref('categories', input.categoryId);
                if (!input.categoryId)
                    fail(400, 'Choose a category.');
                if (parent && d.prepare('SELECT category_id FROM topics WHERE id=?').get(parent)?.category_id !== input.categoryId)
                    fail(400, 'Parent topic must use the same category.');
                d.prepare('INSERT INTO topics(id,category_id,slug,title,parent_id,position,active) VALUES(?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,parent_id=excluded.parent_id,position=excluded.position,active=excluded.active').run(id, String(input.categoryId), identifier(input.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), 'topic slug'), title, parent, numberValue(input.position, 0, 100000), Number(published));
            }
            audit(actor, 'content.saved', id, { resource, status });
            return { id };
        }
        const categoryId = input.categoryId ? identifier(input.categoryId) : null, topicId = input.topicId ? identifier(input.topicId) : null;
        ref('categories', categoryId);
        ref('topics', topicId);
        if (topicId && categoryId && d.prepare('SELECT category_id FROM topics WHERE id=?').get(topicId)?.category_id !== categoryId)
            fail(400, 'The topic does not belong to the selected category.');
        const difficulty = stringValue(input.difficulty, 'difficulty', 40), data = { ...input, id, title, status, difficulty };
        if (['courses', 'modules', 'questions'].includes(resource)) {
            let payload: Record<string, unknown> = { ...data };
            if (resource === 'questions') {
                const q = question({ ...data, id }, published);
                if (published && (!categoryId || !topicId))
                    fail(400, 'Choose a category and topic before publishing.');
                payload = { ...data, ...q.content, accepted: q.key.accepted, pairs: q.key.pairs, sequence: q.key.sequence, explanation: q.key.explanation, sampleAnswer: q.key.sampleAnswer, criteria: q.key.criteria, marks: numberValue(input.marks, 0.01, 1000, 1), tags: list(input.tags, 30).map(v => stringValue(v, 'tag', 80)) };
            }
            if (resource === 'courses') {
                payload = { ...data, slug: identifier(input.slug || id, 'course slug'), description: stringValue(input.description, 'description'), fullDescription: stringValue(input.fullDescription, 'full description', 20000), objectives: stringValue(input.objectives, 'objectives', 10000), duration: numberValue(input.duration, 0, 100000), coverId: input.coverId ? identifier(input.coverId) : '', visibility: input.visibility === 'enrolled' ? 'enrolled' : 'all-students' };
                if (published && !categoryId)
                    fail(400, 'Choose a course category.');
                if (published && payload.coverId && !d.prepare("SELECT 1 FROM learning_media WHERE id=? AND mime LIKE 'image/%'").get(String(payload.coverId)))
                    fail(400, 'Choose a valid cover image.');
            }
            let parent: string | null = null;
            if (resource === 'modules') {
                parent = input.courseId ? identifier(input.courseId) : null;
                if (!parent || !d.prepare("SELECT 1 FROM learning_content WHERE id=? AND kind='course'").get(parent))
                    fail(400, 'Choose a course for the module.');
                payload = { ...data, courseId: parent, position: numberValue(input.position, 0, 100000) };
            }
            d.prepare('INSERT INTO learning_content VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET parent_id=excluded.parent_id,title=excluded.title,slug=excluded.slug,category_id=excluded.category_id,topic_id=excluded.topic_id,difficulty=excluded.difficulty,status=excluded.status,data=excluded.data,version=excluded.version,updated_at=excluded.updated_at').run(id, kind(resource), parent, title, resource === 'courses' ? String(payload.slug) : id, categoryId, topicId, difficulty, status, JSON.stringify(payload), existing ? Number(existing.version) + 1 : 1, existing ? String(d.prepare('SELECT created_at FROM learning_content WHERE id=?').get(id)!.created_at) : now, now);
            if (resource === 'questions' && !published) {
                const sets = d.prepare('SELECT set_id FROM practice_set_questions WHERE question_id=?').all(id);
                for (const set of sets)
                    d.prepare('UPDATE lessons SET published=0,version=version+1,updated_at=? WHERE id=?').run(now, String(set.set_id));
            }
        }
        else {
            if (!topicId)
                fail(400, 'Choose a topic.');
            const courseId = input.courseId ? identifier(input.courseId) : null, moduleId = input.moduleId ? identifier(input.moduleId) : null;
            if (courseId && !d.prepare("SELECT 1 FROM learning_content WHERE id=? AND kind='course'").get(courseId))
                fail(400, 'Invalid course.');
            if (moduleId && (!courseId || d.prepare("SELECT parent_id FROM learning_content WHERE id=? AND kind='module'").get(moduleId)?.parent_id !== courseId))
                fail(400, 'Choose a module from the selected course.');
            const rich = blocks(input.blocks), metadata = { description: stringValue(input.description, 'description'), objectives: stringValue(input.objectives, 'objectives', 10000), blocks: rich, duration: numberValue(input.duration, 0, 100000), timeLimit: numberValue(input.timeLimit, 0, 86400), passingScore: numberValue(input.passingScore, 0, 100), showExplanations: input.showExplanations !== false, allowRetries: input.allowRetries !== false };
            const chosen = list(input.questionIds, 100).map(v => { const q = typeof v === 'string' ? { id: v, marks: 1 } : object(v); return { id: identifier(q.id, 'question ID'), marks: numberValue(q.marks, 0.01, 1000, 1) }; });
            if (new Set(chosen.map(q => q.id)).size !== chosen.length)
                fail(400, 'A question cannot occur twice in the same set.');
            if (published && resource !== 'lessons' && !chosen.length)
                fail(400, 'Add at least one question before publishing.');
            if (published && resource === 'lessons' && !rich.length)
                fail(400, 'Add lesson content before publishing.');
            if (published) {
                for (const b of rich) {
                    if (['image', 'audio', 'pdf'].includes(b.type)) {
                        const media = b.mediaId && d.prepare('SELECT mime FROM learning_media WHERE id=?').get(b.mediaId);
                        if (!media)
                            fail(400, 'Choose a valid attachment for each media block.');
                        if (b.type === 'image' && !String(media.mime).startsWith('image/') || b.type === 'audio' && !String(media.mime).startsWith('audio/') || b.type === 'pdf' && media.mime !== 'application/pdf')
                            fail(400, 'The attachment type does not match its block.');
                    }
                    if (b.type === 'practice' && (!b.practiceId || !d.prepare("SELECT 1 FROM lessons WHERE id=? AND kind<>'lesson' AND published=1 AND archived=0").get(b.practiceId)))
                        fail(400, 'Publish the linked practice first.');
                }
            }
            const snapshots = chosen.map(q => { const bank = getContent('questions', q.id); if (published && bank.status !== 'published')
                fail(400, 'Publish all selected questions first.'); return { ...question(bank, published), marks: q.marks, bankId: q.id }; });
            d.prepare('INSERT INTO lessons(id,topic_id,title,instructions,published,version,kind,course_id,module_id,difficulty,position,metadata,archived,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET topic_id=excluded.topic_id,title=excluded.title,instructions=excluded.instructions,published=excluded.published,version=excluded.version,course_id=excluded.course_id,module_id=excluded.module_id,difficulty=excluded.difficulty,position=excluded.position,metadata=excluded.metadata,archived=excluded.archived,updated_at=excluded.updated_at').run(id, topicId, title, stringValue(input.instructions, 'instructions', 10000), Number(published), existing ? Number(existing.version) + 1 : 1, kind(resource), courseId, moduleId, difficulty, numberValue(input.position, 0, 100000), JSON.stringify(metadata), Number(status === 'archived'), existing ? String(d.prepare('SELECT created_at FROM lessons WHERE id=?').get(id)!.created_at) : now, now);
            d.prepare('DELETE FROM practice_set_questions WHERE set_id=?').run(id);
            d.prepare('DELETE FROM questions WHERE lesson_id=?').run(id);
            snapshots.forEach((q, i) => { d.prepare('INSERT INTO practice_set_questions VALUES(?,?,?,?)').run(id, q.bankId, i, q.marks); d.prepare('INSERT INTO questions VALUES(?,?,?,?,?)').run(id + ':' + i, id, i, JSON.stringify({ ...q.content, id: id + ':' + i, marks: q.marks }), JSON.stringify(q.key)); });
        }
        audit(actor, 'content.saved', id, { resource, status, previousVersion: existing?.version });
        return { id };
    });
}
export function contentAction(resource: string, id: string, action: string, actor: string) { const record = getContent(resource, id); if (action === 'duplicate') {
    const copy: Record<string, unknown> = { ...record, id: randomUUID(), title: String(record.title) + ' (copy)', status: 'draft', version: undefined };
    if (resource === 'courses')
        copy.slug = copy.id;
    if (resource === 'topics')
        copy.slug = copy.id;
    return saveContent(resource, copy, actor);
} if (['publish', 'unpublish', 'archive', 'restore'].includes(action))
    return saveContent(resource, { ...record, status: action === 'publish' ? 'published' : action === 'archive' ? 'archived' : 'draft' }, actor); fail(400, 'Unsupported action. Use archive to preserve referenced content.'); }
