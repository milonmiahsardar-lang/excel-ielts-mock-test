import 'server-only';
import { currentUser } from '../results/auth';
import { fail, rateLimit } from '../student/security';
export async function learningAdmin() { const user = await currentUser('admin'); if (!user || user.role !== 'admin')
    fail(403, 'Administrator access is required.'); return user; }
export function sameOrigin(request: Request) { const url = new URL(request.url), host = request.headers.get('host') || url.host; let origin: string; try {
    origin = new URL(process.env.APP_ORIGIN || url.protocol + '//' + host).origin;
}
catch {
    fail(403, 'Invalid request origin.');
} if (request.headers.get('origin') !== origin)
    fail(403, 'Invalid request origin.'); }
export async function learningBody(request: Request, actor: string) { sameOrigin(request); rateLimit('cms:' + actor, 600); if (!request.headers.get('content-type')?.includes('application/json'))
    fail(415, 'JSON required.'); const bytes = await boundedBytes(request, 8 * 1024 * 1024); let data: unknown; try {
    data = JSON.parse(bytes.toString('utf8'));
}
catch {
    fail(400, 'Invalid JSON.');
} if (!data || typeof data !== 'object' || Array.isArray(data))
    fail(400, 'Invalid request.'); return data as Record<string, unknown>; }
export async function boundedBytes(request: Request, limit: number) { if (Number(request.headers.get('content-length') || 0) > limit)
    fail(413, 'File/request exceeds the size limit.'); const reader = request.body?.getReader(); if (!reader)
    fail(400, 'Request body required.'); const chunks: Uint8Array[] = []; let total = 0; while (true) {
    const next = await reader.read();
    if (next.done)
        break;
    total += next.value.length;
    if (total > limit) {
        await reader.cancel();
        fail(413, 'File/request exceeds the size limit.');
    }
    chunks.push(next.value);
} return Buffer.concat(chunks); }
