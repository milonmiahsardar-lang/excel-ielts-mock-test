import { learningAdmin, learningBody, sameOrigin, boundedBytes } from '@/lib/learning/permissions';
import { studentEndpoint, fail, rateLimit } from '@/lib/student/security';
import { contentList, overview, lookup, analytics, studentDetail, preview, courseCompletionRates } from '@/lib/learning/queries';
import { getContent, saveContent, contentAction, audit } from '@/lib/learning/service';
import { studentDb, studentTransaction } from '@/lib/student/db';
import { parseImport, previewImport, commitImport, exportQuestions } from '@/lib/learning/imports';
import { object, identifier, stringValue, list } from '@/lib/learning/validation';
import { uploadMedia, removeMedia } from '@/lib/learning/media';
export const runtime = 'nodejs';
export async function GET(request: Request, { params }: {
    params: Promise<{
        resource: string;
    }>;
}) { const { resource } = await params; if (resource === 'export') {
    let download: Response | undefined;
    const denied = await studentEndpoint(async () => { await learningAdmin(); const url = new URL(request.url), format = url.searchParams.get('format') || 'json', result = exportQuestions(format, url.searchParams.get('template') === '1'); download = new Response(new Uint8Array(result.bytes), { headers: { 'Content-Type': result.mime, 'Content-Disposition': 'attachment; filename="learning-questions.' + result.extension + '"', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); return null; });
    return download || denied;
} return studentEndpoint(async () => { await learningAdmin(); const url = new URL(request.url), id = url.searchParams.get('id'); if (resource === 'overview')
    return overview(); if (resource === 'lookup')
    return lookup(); if (resource === 'analytics')
    return { ...analytics(), courses: courseCompletionRates() }; if (resource === 'students' && id)
    return studentDetail(identifier(id)); if (resource === 'settings')
    return Object.fromEntries(studentDb().prepare('SELECT key,value FROM learning_settings').all().map(r => [String(r.key), String(r.value)])); if (id)
    return url.searchParams.get('preview') === '1' ? preview(resource, identifier(id)) : getContent(resource, identifier(id)); return contentList(resource, url.searchParams); }); }
export async function POST(request: Request, { params }: {
    params: Promise<{
        resource: string;
    }>;
}) {
    return studentEndpoint(async () => {
        const admin = await learningAdmin(), { resource } = await params;
        if (resource === 'media-upload') {
            sameOrigin(request);
            rateLimit('cms-media:' + admin.id, 60);
            return uploadMedia(decodeURIComponent(request.headers.get('x-file-name') || 'Upload'), await boundedBytes(request, 20 * 1024 * 1024), admin.id);
        }
        const data = await learningBody(request, admin.id);
        if (resource === 'import') {
            if (data.action === 'parse')
                return parseImport(stringValue(data.filename, 'file name', 180, true), stringValue(data.base64, 'file data', 6 * 1024 * 1024, true));
            if (data.action === 'preview')
                return { rows: previewImport(data.rows, object(data.mapping || {}), String(data.categoryId || ''), data.overwrite === true) };
            if (data.action === 'commit')
                return commitImport(data, admin.id);
            fail(400, 'Invalid import action.');
        }
        if (resource === 'settings') {
            const message = stringValue(data.welcomeMessage, 'welcome message', 500);
            studentDb().prepare('INSERT INTO learning_settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run('welcomeMessage', message);
            audit(admin.id, 'settings.updated', 'welcomeMessage');
            return { ok: true };
        }
        if (resource === 'students') {
            const id = identifier(data.id);
            if (!studentDb().prepare('SELECT 1 FROM students WHERE id=?').get(id))
                fail(404, 'Student not found.');
            if (data.action === 'access') {
                if (data.confirm !== true)
                    fail(400, 'Confirm the access change.');
                studentTransaction(() => { studentDb().prepare('UPDATE students SET active=? WHERE id=?').run(Number(data.active === true), id); if (data.active !== true)
                    studentDb().prepare('DELETE FROM sessions WHERE student_id=?').run(id); audit(admin.id, 'student.access-changed', id, { active: data.active === true }); });
                return { ok: true };
            }
            if (data.action === 'enrol') {
                const courseId = identifier(data.courseId);
                if (!studentDb().prepare("SELECT 1 FROM learning_content WHERE id=? AND kind='course'").get(courseId))
                    fail(400, 'Course not found.');
                studentDb().prepare('INSERT OR IGNORE INTO learning_enrolments VALUES(?,?,?)').run(id, courseId, new Date().toISOString());
                audit(admin.id, 'student.enrolled', id, { courseId });
                return { ok: true };
            }
            fail(400, 'Unsupported student action.');
        }
        if (resource === 'media') {
            const id = identifier(data.id);
            if (data.action === 'delete') {
                if (data.confirm !== true)
                    fail(400, 'Confirm file deletion.');
                return removeMedia(id, admin.id);
            }
            studentDb().prepare('UPDATE learning_media SET name=? WHERE id=?').run(stringValue(data.title, 'file name', 180, true), id);
            audit(admin.id, 'media.renamed', id);
            return { ok: true };
        }
        if (data.action === 'bulk') {
            const ids = list(data.ids, 25).map(v => identifier(v));
            if (data.operation === 'archive' && data.confirm !== true)
                fail(400, 'Confirm archiving.');
            return { results: ids.map(id => { try {
                    return contentAction(resource, id, String(data.operation), admin.id);
                }
                catch (e) {
                    return { id, error: e instanceof Error ? e.message : 'Unable to update.' };
                } }) };
        }
        if (data.action && data.action !== 'save') {
            if (data.action === 'archive' && data.confirm !== true)
                fail(400, 'Confirm archiving.');
            return contentAction(resource, identifier(data.id), String(data.action), admin.id);
        }
        return saveContent(resource, data, admin.id);
    });
}
