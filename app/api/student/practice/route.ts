import { studentActor } from '@/lib/student/auth';
import { requestBody, studentEndpoint, field, fail } from '@/lib/student/security';
import { ownedPractice, startPractice, submitPractice, savePracticeDraft, completeLesson } from '@/lib/student/practice';
export const runtime = 'nodejs';
export async function GET(request: Request) { return studentEndpoint(async () => { const student = await studentActor(), id = field(new URL(request.url).searchParams.get('id'), 'practice ID', 80, true); return ownedPractice(student.id, id); }); }
export async function POST(request: Request) { return studentEndpoint(async () => { const data = await requestBody(request), student = await studentActor(); if(data.action==='save-draft')return savePracticeDraft(student.id,field(data.id,'practice ID',80,true),data.answers);
if(data.action==='complete-lesson')return completeLesson(student.id,field(data.id,'lesson ID',80,true));
        if (data.action === 'start')
    return startPractice(student.id, field(data.lessonId, 'lesson', 80, true)); if (data.action === 'submit')
    return submitPractice(student.id, field(data.id, 'practice ID', 80, true), data.answers); fail(400, 'Invalid practice action.'); }); }
