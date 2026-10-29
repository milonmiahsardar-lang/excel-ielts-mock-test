import { studentActor } from '@/lib/student/auth';
import { requestBody, studentEndpoint, fail, rateLimit } from '@/lib/student/security';
import { bookings, slots, register, launch } from '@/lib/partial-tests/service';
import { setSession } from '@/lib/results/auth';
export const runtime = 'nodejs';
export async function GET() { return studentEndpoint(async () => { const student = await studentActor(); return { slots: slots(), bookings: bookings(student.id) }; }); }
export async function POST(request: Request) {
    return studentEndpoint(async () => {
        const data = await requestBody(request), student = await studentActor();
        rateLimit('partial-tests:' + student.id, 60);
        if (data.action === 'register') return register(student.id, data.slotId);
        if (data.action === 'start') {
            const result = await launch(student, data.bookingId);
            await setSession(result.user);
            return { candidateId: result.user.id, destination: result.destination };
        }
        fail(400, 'Invalid partial test action.');
    });
}
