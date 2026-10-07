import { notFound } from 'next/navigation';
import { requirePage } from '@/lib/results/auth';
import { candidate } from '@/lib/results/candidates';
import EditCandidate from './EditCandidate';
export default async function EditPage({params}:{params:Promise<{id:string}>}){await requirePage('admin');const {id}=await params;const value=candidate(id);if(!value)notFound();return <EditCandidate candidate={value}/>;}
