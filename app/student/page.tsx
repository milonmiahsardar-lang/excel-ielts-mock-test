import { currentStudent } from '@/lib/student/auth';
import { redirect } from 'next/navigation';
export default async function Student() { redirect(await currentStudent() ? '/student/dashboard' : '/student/login'); }
