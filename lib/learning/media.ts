import 'server-only';
import { randomUUID, createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { resolve, dirname, sep } from 'node:path';
import { studentDatabasePath, studentDb } from '../student/db';
import { fail } from '../student/security';
import { audit } from './service';
import { lessonVisible, courseVisible } from './catalog';
export function mediaDirectory() { const directory = resolve(/*turbopackIgnore: true*/ process.env.STUDENT_MEDIA_DIR || resolve(dirname(studentDatabasePath()), 'learning-media')); if (directory === resolve('public') || directory.startsWith(resolve('public') + sep))
    throw Error('Learning media must be private.'); if (process.env.RAILWAY_ENVIRONMENT_NAME) {
    const mount = process.env.RAILWAY_VOLUME_MOUNT_PATH;
    if (!mount || !directory.startsWith(resolve(mount) + sep))
        throw Error('Learning media requires persistent volume storage.');
} return directory; }
function detect(bytes: Buffer) { const prefix = bytes.subarray(0, 16); if (prefix.subarray(0, 3).equals(Buffer.from([255, 216, 255])))
    return ['image/jpeg', 'jpg']; if (prefix.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])))
    return ['image/png', 'png']; if (/^GIF8[79]a/.test(prefix.toString('ascii')))
    return ['image/gif', 'gif']; if (prefix.toString('ascii', 0, 4) === 'RIFF' && prefix.toString('ascii', 8, 12) === 'WEBP')
    return ['image/webp', 'webp']; if (prefix.toString('ascii', 0, 3) === 'ID3' || bytes[0] === 255 && (bytes[1] & 224) === 224)
    return ['audio/mpeg', 'mp3']; if (prefix.toString('ascii', 0, 4) === 'RIFF' && prefix.toString('ascii', 8, 12) === 'WAVE')
    return ['audio/wav', 'wav']; if (prefix.toString('ascii', 0, 4) === 'OggS')
    return ['audio/ogg', 'ogg']; if (prefix.toString('ascii', 4, 8) === 'ftyp')
    return ['audio/mp4', 'm4a']; if (prefix.toString('ascii', 0, 5) === '%PDF-')
    return ['application/pdf', 'pdf']; fail(400, 'Unsupported file signature. Use JPEG, PNG, GIF, WebP, MP3, WAV, OGG, M4A or PDF.'); }
export function uploadMedia(name: string, bytes: Buffer, actor: string) { if (!bytes.length || bytes.length > 20 * 1024 * 1024)
    fail(413, 'Upload 1 byte to 20 MB.'); const [mime, extension] = detect(bytes); if (mime.startsWith('image/') && bytes.length > 8 * 1024 * 1024)
    fail(413, 'Images must be at most 8 MB.'); const id = randomUUID(), disk = id + '.' + extension, directory = mediaDirectory(); mkdirSync(directory, { recursive: true, mode: 0o700 }); const file = resolve(directory, disk); writeFileSync(file, bytes, { flag: 'wx', mode: 0o600 }); try {
    studentDb().prepare('INSERT INTO learning_media VALUES(?,?,?,?,?,?,?,?)').run(id, name.slice(0, 180), disk, mime, bytes.length, createHash('sha256').update(bytes).digest('hex'), new Date().toISOString(), actor);
    audit(actor, 'media.uploaded', id, { name, bytes: bytes.length });
}
catch (error) {
    unlinkSync(file);
    throw error;
} return { id }; }
export function mediaRecord(id: string) { const row = studentDb().prepare('SELECT * FROM learning_media WHERE id=?').get(id); if (!row)
    fail(404, 'Media not found.'); return row; }
export function readMedia(id: string) { const row = mediaRecord(id); return { row, bytes: readFileSync(resolve(/*turbopackIgnore: true*/ mediaDirectory(), String(row.disk_name))) }; }
export function mediaVisible(id: string, studentId: string) { const d = studentDb(), needle = '%' + id + '%'; if (d.prepare('SELECT 1 FROM practice_attempts WHERE student_id=? AND question_snapshot LIKE ?').get(studentId, needle))
    return true; for (const row of d.prepare('SELECT id FROM lessons WHERE published=1 AND archived=0 AND metadata LIKE ?').all(needle))
    if (lessonVisible(String(row.id), studentId))
        return true; for (const row of d.prepare('SELECT DISTINCT l.id FROM questions q JOIN lessons l ON l.id=q.lesson_id WHERE l.published=1 AND l.archived=0 AND q.content LIKE ?').all(needle))
    if (lessonVisible(String(row.id), studentId))
        return true; for (const row of d.prepare("SELECT id FROM learning_content WHERE kind='course' AND status='published' AND data LIKE ?").all(needle))
    if (courseVisible(String(row.id), studentId))
        return true; return false; }
export function removeMedia(id: string, actor: string) { const d = studentDb(), row = mediaRecord(id), needle = '%' + id + '%'; if (d.prepare('SELECT 1 FROM lessons WHERE metadata LIKE ? UNION SELECT 1 FROM learning_content WHERE data LIKE ? UNION SELECT 1 FROM practice_attempts WHERE question_snapshot LIKE ? LIMIT 1').get(needle, needle, needle))
    fail(409, 'This file is referenced by content or an attempt. Remove unused references, or retain it for history.'); unlinkSync(resolve(/*turbopackIgnore: true*/ mediaDirectory(), String(row.disk_name))); d.prepare('DELETE FROM learning_media WHERE id=?').run(id); audit(actor, 'media.deleted', id); return { ok: true }; }
