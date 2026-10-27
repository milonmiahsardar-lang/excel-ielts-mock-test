import { notFound } from 'next/navigation';
import { getLesson, ownedPractice } from '@/lib/student/practice';
import { requireStudent } from '@/lib/student/auth';
import {LessonContent,CompleteLesson} from '../../../../components/LessonContent';
import PracticeEngine from '../../../../components/PracticeEngine';
import { PageHeading } from '../../../../components/UI';
export default async function LessonPage({ params, searchParams }: {
    params: Promise<{
        id: string;
    }>;
    searchParams: Promise<{
        attempt?: string;
    }>;
}) { const student = await requireStudent(), { id } = await params, { attempt } = await searchParams; const initial = attempt ? ownedPractice(student.id, attempt) : undefined; if (initial && initial.lessonId !== id)
    notFound(); const lesson = getLesson(id,student.id) || (initial ? { id, title: 'Saved practice', topicId: '', instructions: 'Review your saved activity.', questions: initial.questions } : null); if (!lesson)
    notFound(); return <><PageHeading label="My Practice" title={lesson.title} description={lesson.instructions}/><section><LessonContent blocks={lesson.blocks||[]}/>{lesson.kind==='lesson'?<CompleteLesson id={lesson.id}/>:<PracticeEngine lesson={lesson} initial={initial}/>}</section></>; }
