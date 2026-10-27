import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { randomBytes } from 'node:crypto';
import { studentDb } from './db';
import { hashToken, fail } from './security';
import type { Student } from './types';
export const STUDENT_COOKIE = 'excel_student_session';
export function studentById(id: string): Student | null { const row = studentDb().prepare('SELECT s.id,s.name,s.email,s.joined_at,p.mobile,p.dob,p.country,p.level,p.goal FROM students s JOIN profiles p ON p.student_id=s.id WHERE s.id=? AND s.active=1').get(id); return row ? { id: String(row.id), name: String(row.name), email: String(row.email), mobile: String(row.mobile), dob: String(row.dob), country: String(row.country), level: String(row.level), goal: String(row.goal), joinedAt: String(row.joined_at) } : null; }
export async function currentStudent() { const token = (await cookies()).get(STUDENT_COOKIE)?.value; if (!token)
    return null; const row = studentDb().prepare('SELECT student_id FROM sessions WHERE token_hash=? AND expires_at>?').get(hashToken(token), Date.now()); return row ? studentById(String(row.student_id)) : null; }
export async function requireStudent() { const student = await currentStudent(); if (!student)
    redirect('/student/login'); return student; }
export async function studentActor() { const student = await currentStudent(); if (!student)
    fail(401, 'Please sign in to your student account.'); return student; }
export async function clearStudentSession() { const jar = await cookies(), token = jar.get(STUDENT_COOKIE)?.value; if (token)
    studentDb().prepare('DELETE FROM sessions WHERE token_hash=?').run(hashToken(token)); jar.delete(STUDENT_COOKIE); }
export async function setStudentSession(id: string) { await clearStudentSession(); const token = randomBytes(32).toString('hex'), maxAge = 7 * 24 * 60 * 60; studentDb().prepare('DELETE FROM sessions WHERE expires_at<?').run(Date.now()); studentDb().prepare('INSERT INTO sessions VALUES(?,?,?)').run(hashToken(token), id, Date.now() + maxAge * 1000); (await cookies()).set(STUDENT_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' && process.env.CLASSROOM_HTTP !== 'true', path: '/', maxAge }); }
