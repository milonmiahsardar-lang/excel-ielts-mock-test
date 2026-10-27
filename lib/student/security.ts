import 'server-only';
import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { studentDb } from './db';
export class StudentError extends Error {
    constructor(public status: number, message: string) { super(message); }
}
export function fail(status: number, message: string): never { throw new StudentError(status, message); }
export const hashToken = (value: string) => createHash('sha256').update(value).digest('hex');
const derive = (password: string, salt: string) => new Promise<Buffer>((resolve, reject) => scrypt(password, salt, 64, (err, key) => err ? reject(err) : resolve(key)));
export async function hashPassword(password: string) { const salt = randomBytes(16).toString('hex'); return salt + ':' + (await derive(password, salt)).toString('hex'); }
export async function matchesPassword(password: string, encoded: string) { const [salt, key] = encoded.split(':'); if (!salt || !key)
    return false; const actual = await derive(password, salt), expected = Buffer.from(key, 'hex'); return actual.length === expected.length && timingSafeEqual(actual, expected); }
export function field(value: unknown, label: string, max = 120, required = false) { if (typeof value !== 'string' || value.length > max || value.includes('\0') || (required && !value.trim()))
    fail(400, 'Please enter a valid ' + label + '.'); return value.trim(); }
export function emailValue(value: unknown) { const email = field(value, 'email address', 254, true).toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    fail(400, 'Please enter a valid email address.'); return email; }
export function passwordValue(value: unknown) { if (typeof value !== 'string' || value.length < 12 || value.length > 128 || !/[a-zA-Z]/.test(value) || !/[0-9]/.test(value))
    fail(400, 'Use 12-128 characters with at least one letter and one number.'); return value; }
export function rateLimit(scope: string, max: number, windowMs = 15 * 60 * 1000) { const d = studentDb(), now = Date.now(); d.prepare('DELETE FROM rate_limits WHERE reset_at<?').run(now); d.prepare('INSERT INTO rate_limits VALUES(?,1,?) ON CONFLICT(scope) DO UPDATE SET count=count+1').run(scope, now + windowMs); const row = d.prepare('SELECT count FROM rate_limits WHERE scope=?').get(scope)!; if (Number(row.count) > max)
    fail(429, 'Too many requests. Please try again in 15 minutes.'); }
export function clearLimit(scope: string) { studentDb().prepare('DELETE FROM rate_limits WHERE scope=?').run(scope); }
export async function requestBody(request: Request) { const url = new URL(request.url), host = request.headers.get('host') || url.host; let expected: string; try {
    expected = new URL(process.env.APP_ORIGIN || url.protocol + '//' + host).origin;
}
catch {
    fail(403, 'Invalid request origin.');
} if (request.headers.get('origin') !== expected)
    fail(403, 'Invalid request origin.'); if (!request.headers.get('content-type')?.includes('application/json'))
    fail(415, 'JSON required.'); const reader = request.body?.getReader(); if (!reader)
    fail(400, 'Request body required.'); const chunks: Uint8Array[] = []; let count = 0; while (true) {
    const next = await reader.read();
    if (next.done)
        break;
    count += next.value.byteLength;
    if (count > 64000) {
        await reader.cancel();
        fail(413, 'Request is too large.');
    }
    chunks.push(next.value);
} let value: unknown; try {
    value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
catch {
    fail(400, 'Invalid request.');
} if (!value || typeof value !== 'object' || Array.isArray(value))
    fail(400, 'Invalid request.'); return value as Record<string, unknown>; }
export async function studentEndpoint(fn: () => Promise<unknown>) { try {
    return Response.json(await fn(), { headers: { 'Cache-Control': 'no-store' } });
}
catch (e) {
    if (e instanceof StudentError)
        return Response.json({ error: e.message }, { status: e.status, headers: { 'Cache-Control': 'no-store' } });
    console.error('Student portal request failed', e instanceof Error ? e.name : 'Unknown error');
    return Response.json({ error: 'Unable to complete this request. Please try again.' }, { status: 500, headers: { 'Cache-Control': 'no-store' } });
} }
