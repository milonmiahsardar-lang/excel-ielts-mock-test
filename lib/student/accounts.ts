import 'server-only';
import { randomBytes, randomUUID } from 'node:crypto';
import { studentDb, studentTransaction } from './db';
import { clearLimit, emailValue, fail, field, hashPassword, hashToken, matchesPassword, passwordValue, rateLimit } from './security';
import { levels, goals } from './catalog';
import { setStudentSession, studentActor } from './auth';
function profile(data: Record<string, unknown>) { const mobile = field(data.mobile ?? '', 'mobile number', 35), country = field(data.country ?? '', 'country', 80), dob = field(data.dob ?? '', 'date of birth', 10), level = field(data.level, 'English level', 40, true), goal = field(data.goal, 'learning goal', 40, true); if (!levels.some(v => v === level) || !goals.some(v => v === goal))
    fail(400, 'Choose a valid English level and learning goal.'); if (dob && (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || !Number.isFinite(Date.parse(dob)) || new Date(dob).toISOString().slice(0, 10) !== dob || dob > new Date().toISOString().slice(0, 10) || dob < '1900-01-01'))
    fail(400, 'Please enter a valid date of birth.'); return { mobile, country, dob, level, goal }; }
function credential(value: unknown) { if (typeof value !== 'string' || !value || value.length > 128 || value.includes('\0'))
    fail(400, 'Please enter your password.'); return value; }
function confirmed(data: Record<string, unknown>) { const password = passwordValue(data.password); if (password !== data.confirmPassword)
    fail(400, 'Passwords do not match.'); return password; }
export async function registerStudent(data: Record<string, unknown>) { rateLimit('register:global', 60); const name = field(data.name, 'full name', 120, true), email = emailValue(data.email), password = confirmed(data), p = profile(data); if (studentDb().prepare('SELECT 1 FROM students WHERE email=?').get(email))
    fail(409, 'An account with this email already exists. Please sign in.'); const encoded = await hashPassword(password), id = randomUUID(); studentTransaction(() => { if (studentDb().prepare('SELECT 1 FROM students WHERE email=?').get(email))
    fail(409, 'An account with this email already exists. Please sign in.'); studentDb().prepare('INSERT INTO students(id,name,email,password_hash,joined_at) VALUES(?,?,?,?,?)').run(id, name, email, encoded, new Date().toISOString()); studentDb().prepare('INSERT INTO profiles VALUES(?,?,?,?,?,?)').run(id, p.mobile, p.dob, p.country, p.level, p.goal); }); await setStudentSession(id); return { ok: true, redirect: '/student/dashboard' }; }
const dummy = '0123456789abcdef0123456789abcdef:' + '00'.repeat(64);
export async function loginStudent(data: Record<string, unknown>) { const email = emailValue(data.email), password = credential(data.password); rateLimit('login:global', 300); const scope = 'login:' + hashToken(email); rateLimit(scope, 10); const row = studentDb().prepare('SELECT id,password_hash FROM students WHERE email=? AND active=1').get(email); const match = await matchesPassword(password, row ? String(row.password_hash) : dummy); if (!row || !match)
    fail(401, 'Email or password is incorrect.'); clearLimit(scope); await setStudentSession(String(row.id)); return { ok: true, redirect: '/student/dashboard' }; }
export async function updateProfile(data: Record<string, unknown>) { const student = await studentActor(), name = field(data.name, 'full name', 120, true), email = emailValue(data.email), p = profile(data); if (email !== student.email) {
    rateLimit('email:' + student.id, 10);
    const row = studentDb().prepare('SELECT password_hash FROM students WHERE id=?').get(student.id)!;
    if (!await matchesPassword(credential(data.currentPassword), String(row.password_hash)))
        fail(400, 'Current password is incorrect.');
} studentTransaction(() => { if (studentDb().prepare('SELECT 1 FROM students WHERE email=? AND id<>?').get(email, student.id))
    fail(409, 'That email address is already in use.'); studentDb().prepare('UPDATE students SET name=?,email=? WHERE id=?').run(name, email, student.id); studentDb().prepare('UPDATE profiles SET mobile=?,dob=?,country=?,level=?,goal=? WHERE student_id=?').run(p.mobile, p.dob, p.country, p.level, p.goal, student.id); studentDb().prepare('DELETE FROM password_resets WHERE student_id=?').run(student.id); }); return { ok: true, message: 'Profile updated.' }; }
export async function changePassword(data: Record<string, unknown>) { const student = await studentActor(); rateLimit('password:' + student.id, 10); const row = studentDb().prepare('SELECT password_hash FROM students WHERE id=?').get(student.id)!; if (!await matchesPassword(credential(data.currentPassword), String(row.password_hash)))
    fail(400, 'Current password is incorrect.'); const encoded = await hashPassword(confirmed(data)); studentTransaction(() => { studentDb().prepare('UPDATE students SET password_hash=? WHERE id=?').run(encoded, student.id); studentDb().prepare('DELETE FROM sessions WHERE student_id=?').run(student.id); studentDb().prepare('DELETE FROM password_resets WHERE student_id=?').run(student.id); }); await setStudentSession(student.id); return { ok: true, message: 'Password changed. Other student sessions have been signed out.' }; }
export async function requestPasswordReset(data: Record<string, unknown>) { const email = emailValue(data.email); rateLimit('reset:global', 60); rateLimit('reset:' + hashToken(email), 5); const endpoint = process.env.STUDENT_RESET_WEBHOOK_URL, secret = process.env.STUDENT_RESET_WEBHOOK_SECRET, origin = process.env.APP_ORIGIN; if (!endpoint || !secret || !origin)
    return { ok: true, unavailable: true, message: 'Password reset email delivery is not configured. Please contact Excel Institute for help. No email has been sent.' }; if (new URL(endpoint).protocol !== 'https:' || new URL(origin).protocol !== 'https:')
    fail(503, 'Password reset delivery is unavailable. Please contact Excel Institute.'); const row = studentDb().prepare('SELECT id FROM students WHERE email=?').get(email); if (row) {
    const token = randomBytes(32).toString('hex'), tokenHash = hashToken(token);
    studentTransaction(() => { studentDb().prepare('DELETE FROM password_resets WHERE student_id=? OR expires_at<?').run(String(row.id), Date.now()); studentDb().prepare('INSERT INTO password_resets VALUES(?,?,?)').run(tokenHash, String(row.id), Date.now() + 30 * 60 * 1000); });
    try {
        const response = await fetch(endpoint, { method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + secret }, body: JSON.stringify({ to: email, resetUrl: new URL('/student/reset-password?token=' + token, origin).toString(), expiresInMinutes: 30 }), signal: AbortSignal.timeout(10000) });
        if (!response.ok)
            throw Error('Delivery failed');
    }
    catch {
        studentDb().prepare('DELETE FROM password_resets WHERE token_hash=?').run(tokenHash);
        fail(503, 'Password reset delivery is unavailable. Please contact Excel Institute.');
    }
} return { ok: true, message: 'If an account exists for this email, a password reset link has been requested. Please check your inbox.' }; }
export async function resetPassword(data: Record<string, unknown>) { rateLimit('reset-submit:global', 100); const token = field(data.token, 'reset link', 64, true); if (!/^[a-f0-9]{64}$/.test(token))
    fail(400, 'This reset link is invalid or expired.'); const encoded = await hashPassword(confirmed(data)); studentTransaction(() => { const row = studentDb().prepare('SELECT student_id FROM password_resets WHERE token_hash=? AND expires_at>?').get(hashToken(token), Date.now()); if (!row)
    fail(400, 'This reset link is invalid or expired.'); studentDb().prepare('UPDATE students SET password_hash=? WHERE id=?').run(encoded, String(row.student_id)); studentDb().prepare('DELETE FROM sessions WHERE student_id=?').run(String(row.student_id)); studentDb().prepare('DELETE FROM password_resets WHERE student_id=?').run(String(row.student_id)); }); return { ok: true, message: 'Password reset. You can now sign in.', redirect: '/student/login' }; }
