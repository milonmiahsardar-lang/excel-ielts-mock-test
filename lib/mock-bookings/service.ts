import 'server-only';
import { randomBytes, randomUUID } from 'node:crypto';
import { studentDb, studentTransaction } from '../student/db';
import { fail, field } from '../student/security';
import type { Student } from '../student/types';
import { db, transaction } from '../results/db';
import { currentUser, passwordHash, userFromRow } from '../results/auth';

export const modules = ['full'] as const;
export type MockModule = typeof modules[number];
export type Slot = { id: string; module: MockModule; test: number; date: string; open: boolean; bookings: number };
export type Booking = { id: string; module: MockModule; test: number; date: string; created: string; status: string };
export function today(now = Date.now()) { return new Date(now + 6 * 3600000).toISOString().slice(0, 10); }
function selection(module: unknown, test: unknown) {
    if (!modules.includes(module as MockModule) || typeof test !== 'number' || !Number.isInteger(test) || (test !== 19 && test !== 20)) fail(400, 'Choose full Mock Test 19 or 20.');
    return { module: module as MockModule, test };
}
function validDate(value: unknown) {
    const date = field(value, 'test date', 10, true);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date || date < today()) fail(400, 'Choose today or a future date. Dates use Bangladesh time.');
    return date;
}
export function slots(admin = false): Slot[] {
    return studentDb().prepare(`SELECT s.*, (SELECT count(*) FROM scheduled_mock_bookings b WHERE b.slot_id=s.id) bookings FROM scheduled_mock_slots s ${admin ? '' : 'WHERE s.open=1 AND s.test_date>=?'} ORDER BY s.test_date,s.module,s.test_id`).all(...(admin ? [] : [today()])).map(r => ({ id: String(r.id), module: r.module as MockModule, test: Number(r.test_id), date: String(r.test_date), open: !!r.open, bookings: Number(r.bookings) }));
}
export function publishSlot(adminId: string, data: Record<string, unknown>) {
    const { module, test } = selection(data.module, data.test), date = validDate(data.date);
    return studentTransaction(() => {
        if (studentDb().prepare('SELECT 1 FROM scheduled_mock_slots WHERE module=? AND test_id=? AND test_date=?').get(module, test, date)) fail(409, 'This date is already listed for that test.');
        const id = randomUUID();
        studentDb().prepare('INSERT INTO scheduled_mock_slots VALUES(?,?,?,?,1,?,?)').run(id, module, test, date, adminId, new Date().toISOString());
        return { id };
    });
}
export function setSlotOpen(id: unknown, open: unknown) {
    const key = field(id, 'date ID', 80, true);
    if (typeof open !== 'boolean') fail(400, 'Invalid date status.');
    if (!studentDb().prepare('UPDATE scheduled_mock_slots SET open=? WHERE id=?').run(Number(open), key).changes) fail(404, 'Test date not found.');
    return { updated: true };
}
export function register(studentId: string, slotId: unknown) {
    const key = field(slotId, 'test date', 80, true);
    return studentTransaction(() => {
        const d = studentDb(), slot = d.prepare('SELECT * FROM scheduled_mock_slots WHERE id=? AND open=1 AND test_date>=?').get(key, today());
        if (!slot) fail(409, 'This test date is no longer available.');
        if (d.prepare('SELECT 1 FROM scheduled_mock_bookings WHERE student_id=? AND module=? AND test_id=?').get(studentId, String(slot.module), Number(slot.test_id))) fail(409, 'You have already registered for this module and test.');
        d.prepare('INSERT OR IGNORE INTO scheduled_mock_candidates VALUES(?,?)').run(studentId, randomUUID());
        const id = randomUUID();
        d.prepare('INSERT INTO scheduled_mock_bookings VALUES(?,?,?,?,?,?,?)').run(id, studentId, key, String(slot.module), Number(slot.test_id), String(slot.test_date), new Date().toISOString());
        return { id };
    });
}
export function bookings(studentId: string): Booking[] {
    const rows = studentDb().prepare('SELECT * FROM scheduled_mock_bookings WHERE student_id=? ORDER BY test_date,module,test_id').all(studentId);
    // No candidate/assignment is created until the student starts on the booked day.
    return rows.map(r => {
        const assignment = db().prepare('SELECT status FROM test_assignments WHERE id=?').get('scheduled-mock-' + r.id);
        const status = assignment?.status === 'SUBMITTED' ? 'Completed' : assignment?.status === 'REVOKED' ? 'Revoked' : assignment?.status === 'IN_PROGRESS' ? 'Started' : String(r.test_date) < today() ? 'Date passed' : String(r.test_date) === today() ? 'Available today' : 'Booked';
        return { id: String(r.id), module: r.module as MockModule, test: Number(r.test_id), date: String(r.test_date), created: String(r.created_at), status };
    });
}
export function registrations() {
    return studentDb().prepare('SELECT b.*,s.name,s.email,p.mobile FROM scheduled_mock_bookings b JOIN students s ON s.id=b.student_id JOIN profiles p ON p.student_id=s.id ORDER BY b.test_date DESC,b.created_at DESC').all().map(r => ({ id: String(r.id), name: String(r.name), email: String(r.email), mobile: String(r.mobile), module: String(r.module), test: Number(r.test_id), date: String(r.test_date), created: String(r.created_at) }));
}
export async function launch(student: Student, bookingId: unknown) {
    const id = field(bookingId, 'registration ID', 80, true), d = studentDb();
    const booking = d.prepare('SELECT b.*,c.candidate_id FROM scheduled_mock_bookings b JOIN scheduled_mock_candidates c ON c.student_id=b.student_id WHERE b.id=? AND b.student_id=?').get(id, student.id);
    if (!booking) fail(404, 'Registration not found.');
    if (booking.test_date !== today()) fail(403, 'This test can only be started on your booked date, in Bangladesh time.');
    const existing = await currentUser('student');
    if (existing && db().prepare("SELECT 1 FROM attempts a JOIN attempt_progress p ON p.attempt_id=a.id WHERE a.student_id=? AND a.submitted_at IS NULL AND p.stage!='NOT_STARTED'").get(existing.id)) fail(409, 'A test is already active in this browser. Return to its original tab.');
    const candidateId = String(booking.candidate_id), assignmentId = 'scheduled-mock-' + id;
    // Only feature-owned identities and assignments are written. Existing mock accounts,
    // links, assignments, content, clocks, scoring and recovery are left untouched.
    return transaction(() => {
        if (db().prepare('SELECT 1 FROM attempts WHERE assignment_id=?').get(assignmentId)) fail(409, 'This test has already been started. Continue in the original test tab, or contact the centre.');
        if (db().prepare("SELECT 1 FROM attempts WHERE student_id=? AND submitted_at IS NULL").get(candidateId)) fail(409, 'Finish your current booked mock test before starting another.');
        let user = db().prepare("SELECT * FROM users WHERE id=? AND role='student'").get(candidateId);
        if (!user) {
            db().prepare("INSERT INTO users(id,registration_id,name,contact,role,password_hash) VALUES(?,?,?,?,'student',?)").run(candidateId, 'MOCK-BOOKING-' + candidateId, student.name, student.email, passwordHash(randomBytes(48).toString('hex')));
            user = db().prepare('SELECT * FROM users WHERE id=?').get(candidateId)!;
        }
        db().prepare("INSERT OR IGNORE INTO test_assignments(id,candidate_id,test_id,assigned_at,expires_at,status,attempt_limit,attempts_used,mode,purpose) VALUES(?,?,?,?,?,'ASSIGNED',1,0,?,'repeat')").run(assignmentId, candidateId, Number(booking.test_id), new Date().toISOString(), new Date(Date.parse(String(booking.test_date) + 'T00:00:00+06:00') + 86400000).toISOString(), String(booking.module));
        const assignment = db().prepare('SELECT * FROM test_assignments WHERE id=?').get(assignmentId)!;
        if (assignment.status !== 'ASSIGNED' || Number(assignment.attempts_used) !== 0) fail(409, 'This registration is no longer available. Contact the centre.');
        return { user: userFromRow(user), destination: `/confirm?test=${booking.test_id}&mode=${booking.module}` };
    });
}
