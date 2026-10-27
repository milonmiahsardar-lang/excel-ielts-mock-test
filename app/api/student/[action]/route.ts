import { requestBody, studentEndpoint, fail } from '@/lib/student/security';
import { registerStudent, loginStudent, updateProfile, changePassword, requestPasswordReset, resetPassword } from '@/lib/student/accounts';
import { clearStudentSession } from '@/lib/student/auth';
export const runtime = 'nodejs';
export async function POST(request: Request, { params }: {
    params: Promise<{
        action: string;
    }>;
}) { return studentEndpoint(async () => { const { action } = await params, data = await requestBody(request); switch (action) {
    case 'register': return registerStudent(data);
    case 'login': return loginStudent(data);
    case 'profile': return updateProfile(data);
    case 'password': return changePassword(data);
    case 'forgot-password': return requestPasswordReset(data);
    case 'reset-password': return resetPassword(data);
    case 'logout':
        await clearStudentSession();
        return { ok: true, redirect: '/student/login' };
    default: fail(404, 'Page not found.');
} }); }
