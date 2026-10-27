import { currentUser } from '@/lib/results/auth';
import { currentStudent } from '@/lib/student/auth';
import { mediaVisible, readMedia } from '@/lib/learning/media';
import { studentEndpoint, fail } from '@/lib/student/security';
import { identifier } from '@/lib/learning/validation';
export const runtime = 'nodejs';
export async function GET(request: Request, { params }: {
    params: Promise<{
        id: string;
    }>;
}) { let response: Response | undefined; const result = await studentEndpoint(async () => { const { id } = await params; identifier(id); const admin = await currentUser('admin'); if (!admin) {
    const student = await currentStudent();
    if (!student || !mediaVisible(id, student.id))
        fail(404, 'Media not found.');
} const { row, bytes } = readMedia(id), headers: Record<string, string> = { 'Content-Type': String(row.mime), 'Content-Disposition': (row.mime === 'application/pdf' ? 'attachment' : 'inline') + '; filename="learning-media"', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; sandbox", 'Cache-Control': 'private, no-store', 'Accept-Ranges': 'bytes' }; const range = request.headers.get('range'); if (range) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (!match) {
        response = new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + bytes.length } });
        return null;
    }
    const start = Number(match[1]), end = Math.min(bytes.length - 1, match[2] ? Number(match[2]) : bytes.length - 1);
    if (start > end || start >= bytes.length) {
        response = new Response(null, { status: 416 });
        return null;
    }
    headers['Content-Range'] = 'bytes ' + start + '-' + end + '/' + bytes.length;
    response = new Response(new Uint8Array(bytes.subarray(start, end + 1)), { status: 206, headers });
}
else
    response = new Response(new Uint8Array(bytes), { headers }); return null; }); return response || result; }
