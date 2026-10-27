import { notFound } from 'next/navigation';
import { requirePage } from '@/lib/results/auth';
import AdminCMS from '../AdminCMS';
export default async function LearningCMS({ params }: {
    params: Promise<{
        section?: string[];
    }>;
}) { await requirePage('admin'); const parts = (await params).section || [], section = parts[0] || 'overview'; if (parts.length > 1 || !['overview', 'students', 'courses', 'modules', 'categories', 'topics', 'lessons', 'questions', 'practice-sets', 'assessments', 'analytics', 'media', 'drafts', 'published', 'import', 'settings', 'audit'].includes(section))
    notFound(); return <AdminCMS key={section} section={section}/>; }
