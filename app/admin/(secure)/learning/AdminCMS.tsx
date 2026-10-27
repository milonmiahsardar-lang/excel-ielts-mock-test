/* eslint-disable @next/next/no-img-element -- Authenticated private media needs browser cookies and bypasses public image optimization. */
'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { questionTypes, type Block } from '@/lib/learning/types';
import { LessonContent } from '@/app/student/components/LessonContent';
import { QuestionInput } from '@/app/student/components/PracticeEngine';
import type { PracticeQuestion, PracticeAnswer } from '@/lib/student/types';
import ContentEditor, { cmsRequest, type Lookup } from './ContentEditor';
import ImportPanel from './ImportPanel';
import styles from './cms.module.css';
import p from '@/app/student/portal.module.css';
const navigation = [['Overview', 'overview', 'Dashboard'], ['', 'students', 'Student Management'], ['', 'courses', 'Courses'], ['', 'categories', 'Practice Categories'], ['', 'lessons', 'Lessons'], ['', 'questions', 'Question Bank'], ['', 'practice-sets', 'Practice Sets'], ['', 'assessments', 'Assessments'], ['', 'analytics', 'Student Performance'], ['Content Management', 'media', 'Media Library'], ['', 'drafts', 'Drafts'], ['', 'published', 'Published Content'], ['', 'import', 'Content Import / Export'], ['Administration', 'settings', 'Content Settings'], ['', 'audit', 'Admin Activity Log']];
const emptyLookup: Lookup = { categories: [], topics: [], courses: [], modules: [], media: [] };
type Row = Record<string, unknown>;
function PlainTable({ rows }: {
    rows: Row[];
}) { if (!rows.length)
    return <p>No records yet.</p>; const keys = Object.keys(rows[0]); return <div className={p.tableWrap}><table className={p.table}><thead><tr>{keys.map(k => <th key={k}>{k.replaceAll('_', ' ')}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{keys.map(k => <td key={k}>{r[k] === null ? '-' : typeof r[k] === 'object' ? JSON.stringify(r[k]) : String(r[k])}</td>)}</tr>)}</tbody></table></div>; }
function Preview({ record, onClose }: {
    record: Row;
    onClose: () => void;
}) { const [answer, setAnswer] = useState<PracticeAnswer>(''), [setAnswers, updateSetAnswers] = useState<Record<string, PracticeAnswer>>({}); const questions = record.questions as (PracticeQuestion & {
    key?: unknown;
})[] | undefined; return <section className={styles.editor}><button className={p.secondary} onClick={onClose}>Close Preview</button><p className={styles.notice}>Admin preview only. This does not create an attempt or affect scores/progress.</p><h2>{String(record.title || record.prompt || 'Preview')}</h2><p>{String(record.description || '')}</p><p>{String(record.instructions || '')}</p><p style={{ whiteSpace: 'pre-wrap' }}>{String(record.prompt || '')}</p><p style={{ whiteSpace: 'pre-wrap' }}>{String(record.passage || '')}</p>{record.type ? <><QuestionInput question={record as unknown as PracticeQuestion} value={answer} onChange={setAnswer}/><p>Correct answer: {JSON.stringify(record.accepted || record.pairs || record.sequence || 'Manual review')}</p><p>{String(record.explanation || '')}</p></> : null}{record.blocks ? <LessonContent blocks={record.blocks as Block[]}/> : null}{record.fullDescription ? <p style={{ whiteSpace: 'pre-wrap' }}>{String(record.fullDescription)}</p> : null}{record.outline ? <PlainTable rows={record.outline as Row[]}/> : null}{questions?.map((q, i) => <article key={q.id} className={styles.block}><h3>{i + 1}. {q.prompt}</h3><QuestionInput question={q} value={setAnswers[q.id]} onChange={v => updateSetAnswers(old => ({ ...old, [q.id]: v }))}/></article>)}</section>; }
export default function AdminCMS({ section }: {
    section: string;
}) {
    const router = useRouter(), [navOpen, setNavOpen] = useState(false), [target, setTarget] = useState('lessons'), [filters, setFilters] = useState<Record<string, string>>({}), [page, setPage] = useState(1), [listing, setListing] = useState<{
        rows: Row[];
        total: number;
        pages: number;
    }>({ rows: [], total: 0, pages: 1 }), [lookup, setLookup] = useState<Lookup>(emptyLookup), [summary, setSummary] = useState<Row>({}), [editing, setEditing] = useState<{
        resource: string;
        record: Row;
    } | null>(null), [preview, setPreview] = useState<Row | null>(null), [detail, setDetail] = useState<Row | null>(null), [selected, setSelected] = useState<string[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState(''), [settings, setSettings] = useState('');
    const resource = section === 'drafts' || section === 'published' ? target : section;
    const fixedStatus = section === 'drafts' ? 'draft' : section === 'published' ? 'published' : '';
    const query = new URLSearchParams({ ...filters, page: String(page), ...(fixedStatus ? { status: fixedStatus } : {}) }).toString();
    const serial = useRef(0);
    const load = useCallback(async () => { const ticket = ++serial.current; setBusy(true); setError(''); try {
        const meta = await cmsRequest('lookup');
        const data = section === 'overview' || section === 'analytics' ? await cmsRequest(section) : section === 'settings' ? await cmsRequest('settings') : section !== 'import' ? await cmsRequest(resource + '?' + query) : null;
        if (ticket !== serial.current)
            return;
        setLookup(meta);
        if (section === 'overview' || section === 'analytics')
            setSummary(data);
        else if (section === 'settings')
            setSettings(data.welcomeMessage || '');
        else if (section !== 'import')
            setListing(data);
    }
    catch (e) {
        if (ticket === serial.current)
            setError(e instanceof Error ? e.message : 'Unable to load content.');
    }
    finally {
        if (ticket === serial.current)
            setBusy(false);
    } }, [section, resource, query]);
    useEffect(() => { const invalidate = () => { serial.current++; }; const timer = setTimeout(() => void load(), 150); return () => { clearTimeout(timer); invalidate(); }; }, [load]);
    async function command(id: string, action: string) { if (action === 'archive' && !window.confirm('Archive this content? It will be hidden from new student access. Historical attempts are preserved.'))
        return; setBusy(true); try {
        await cmsRequest(resource, { id, action, confirm: action === 'archive' });
        setMessage('Content updated.');
        await load();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Update failed.');
    }
    finally {
        setBusy(false);
    } }
    async function open(id: string, mode: 'edit' | 'preview') { setError(''); try {
        const record = await cmsRequest(resource + '?id=' + encodeURIComponent(id) + (mode === 'preview' ? '&preview=1' : ''));
        if (mode === 'preview')
            setPreview(record);
        else
            setEditing({ resource, record });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to open content.');
    } }
    const filter = (key: string, value: string) => { setFilters(old => ({ ...old, [key]: value })); setPage(1); setSelected([]); };
    const title = navigation.find(n => n[1] === section)?.[2] || section.replaceAll('-', ' ');
    const editable = ['courses', 'modules', 'categories', 'topics', 'lessons', 'questions', 'practice-sets', 'assessments'].includes(resource);
    const stats = summary.stats as Record<string, number> | undefined;
    return <div className={styles.portalScope + ' ' + styles.shell}><aside><button className={styles.navToggle} aria-expanded={navOpen} onClick={() => setNavOpen(!navOpen)}>Learning CMS Navigation</button><nav aria-label="Learning CMS" className={styles.nav + ' ' + (navOpen ? styles.navOpen : '')}>{navigation.map(([group, href, label]) => <div key={href}>{group && <p>{group}</p>}<Link href={'/admin/learning/' + (href === 'overview' ? '' : href)} aria-current={section === href ? 'page' : undefined} onClick={() => { setNavOpen(false); setEditing(null); setDetail(null); setPreview(null); setFilters({}); setPage(1); }}>{label}</Link></div>)}</nav></aside><main className={styles.main}><p className={p.eyebrow}>Excel Institute / Learning CMS</p><h1 className={styles.title}>{title}</h1><p className={styles.muted}>Manage Student Portal materials. IELTS mock tests remain separate.</p>{error && <p role="alert" className={p.error}>{error}</p>}{message && <p role="status" className={p.success}>{message}</p>}{busy && <p role="status">Loading...</p>}{editing && <ContentEditor key={editing.resource + String(editing.record.id || 'new')} resource={editing.resource} initial={editing.record} lookup={lookup} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); setMessage('Content saved.'); void load(); router.refresh(); }}/>}{preview && <Preview record={preview} onClose={() => setPreview(null)}/>}
 {(section === 'overview' || section === 'analytics') && <><div className={styles.stats}>{Object.entries(stats || {}).map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</div><section className={styles.section}><h2>Recent Student Activity</h2><PlainTable rows={(summary.recent || []) as Row[]}/></section>{section === 'analytics' && <><p className={styles.notice}>Active students (practice in the last 30 days): {String(summary.activeStudents ?? 0)}. Average objectively graded accuracy: {summary.accuracy === null ? '-' : String(summary.accuracy) + '%'}. Writing/speaking remain ungraded unless reviewed.</p>{[['Most Practised Categories', 'categories'], ['Most Difficult Topics', 'topics'], ['Course Completion', 'courses']].map(([heading, key]) => <section className={styles.section} key={key}><h2>{heading}</h2><PlainTable rows={(summary[key] || []) as Row[]}/></section>)}</>}{section === 'overview' && <div className={styles.toolbar}><Link className={p.button} href="/admin/learning/questions">Open Question Bank</Link><Link className={p.secondary} href="/admin/learning/courses">Manage Courses</Link></div>}</>}
 {section === 'import' && <ImportPanel lookup={lookup}/>}
 {section === 'settings' && <section className={p.card}><h2>Portal Content Settings</h2><label className={p.field}>Dashboard Welcome Message (optional)<textarea rows={4} maxLength={500} value={settings} onChange={e => setSettings(e.target.value)}/></label><button className={p.button} disabled={busy} onClick={async () => { try {
        await cmsRequest('settings', { welcomeMessage: settings });
        setMessage('Settings saved.');
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to save.');
    } }}>Save Settings</button><p className={styles.notice}>Publication is immediate when you choose Publish. Scheduled publication is not enabled. Upload limits and storage paths are server-controlled.</p></section>}
 {!['overview', 'analytics', 'settings', 'import'].includes(section) && <>
 <div className={styles.toolbar}>{editable && <button className={p.button} onClick={() => { setPreview(null); setEditing({ resource, record: { status: 'draft', ...(resource === 'questions' ? { type: 'multiple-choice', options: ['A', 'B', 'C', 'D'].map(id => ({ id, text: '' })) } : {}) } }); }}>Add {resource.replaceAll('-', ' ')}</button>}{['courses', 'modules'].includes(resource) && <Link className={p.secondary} href={'/admin/learning/' + (resource === 'courses' ? 'modules' : 'courses')}>{resource === 'courses' ? 'Manage Modules' : 'Manage Courses'}</Link>}{['categories', 'topics'].includes(resource) && <Link className={p.secondary} href={'/admin/learning/' + (resource === 'categories' ? 'topics' : 'categories')}>{resource === 'categories' ? 'Manage Topics' : 'Manage Categories'}</Link>}{(section === 'drafts' || section === 'published') && <select aria-label="Content area" value={target} onChange={e => setTarget(e.target.value)}>{['lessons', 'courses', 'questions', 'practice-sets', 'assessments', 'modules'].map(v => <option key={v}>{v}</option>)}</select>}</div>
 {resource === 'media' && <section className={styles.notice}><label>Upload image (8 MB), audio or PDF (20 MB) <input type="file" accept="image/jpeg,image/png,image/gif,image/webp,audio/mpeg,audio/wav,audio/ogg,audio/mp4,application/pdf" onChange={async (e) => { const file = e.target.files?.[0]; if (!file)
            return; setBusy(true); setError(''); try {
            const response = await fetch('/api/admin/learning/media-upload', { method: 'POST', headers: { 'x-file-name': encodeURIComponent(file.name) }, body: file }), data = await response.json();
            if (!response.ok)
                throw Error(data.error);
            setMessage('Media uploaded.');
            await load();
        }
        catch (error) {
            setError(error instanceof Error ? error.message : 'Upload failed.');
        }
        finally {
            setBusy(false);
        } }}/></label><p>Files use private persistent storage and authenticated access. Referenced files cannot be deleted.</p></section>}
 <div className={styles.toolbar}><input aria-label="Search content" placeholder={resource === 'students' ? 'Search student name or email' : 'Search title / question text'} value={filters.q || ''} onChange={e => filter('q', e.target.value)}/>{editable && <><select aria-label="Category filter" value={filters.category || ''} onChange={e => filter('category', e.target.value)}><option value="">All categories</option>{lookup.categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select><select aria-label="Topic filter" value={filters.topic || ''} onChange={e => filter('topic', e.target.value)}><option value="">All topics</option>{lookup.topics.filter(t => !filters.category || t.categoryId === filters.category).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></>}{(editable || resource === 'students') && <select aria-label="Difficulty filter" value={filters.difficulty || ''} onChange={e => filter('difficulty', e.target.value)}><option value="">All levels</option>{['Beginner', 'Elementary', 'Intermediate', 'Upper Intermediate', 'Advanced'].map(v => <option key={v}>{v}</option>)}</select>}{!fixedStatus && editable && <select aria-label="Publication filter" value={filters.status || ''} onChange={e => filter('status', e.target.value)}><option value="">All statuses</option>{['draft', 'published', 'archived'].map(v => <option key={v}>{v}</option>)}</select>}{resource === 'questions' && <select aria-label="Question type filter" value={filters.type || ''} onChange={e => filter('type', e.target.value)}><option value="">All question types</option>{questionTypes.map(v => <option key={v}>{v}</option>)}</select>}{resource === 'media' && <select aria-label="Media type" value={filters.type || ''} onChange={e => filter('type', e.target.value)}><option value="">All files</option><option value="image/">Images</option><option value="audio/">Audio</option><option value="application/pdf">PDF</option></select>}<input type="date" aria-label="Created date filter" value={filters.date || ''} onChange={e => filter('date', e.target.value)}/><select aria-label="Sort records" value={filters.sort || ''} onChange={e => filter('sort', e.target.value)}><option value="">Newest first</option><option value="title">Title</option></select><select aria-label="Sort direction" value={filters.direction || 'desc'} onChange={e => filter('direction', e.target.value)}><option value="desc">Descending</option><option value="asc">Ascending</option></select></div>
 {resource === 'questions' && selected.length > 0 && <div className={styles.toolbar}><span>{selected.length} selected</span><button className={p.secondary} onClick={() => setEditing({ resource: 'practice-sets', record: { status: 'draft', questionIds: selected.map(id => ({ id, marks: 1 })) } })}>Build Practice Set</button>{['publish', 'unpublish', 'archive'].map(action => <button key={action} className={p.secondary} disabled={busy} onClick={async () => { if (action === 'archive' && !window.confirm('Archive the selected questions and unpublish affected sets?'))
            return; try {
            const response = await cmsRequest(resource, { action: 'bulk', ids: selected, operation: action, confirm: action === 'archive' });
            setMessage(response.results.map((r: {
                id: string;
                error?: string;
            }) => r.error || 'Updated ' + r.id).join('; '));
            setSelected([]);
            await load();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Unable to update.');
        } }}>{action}</button>)}</div>}
 {detail && <section className={styles.editor}><button className={p.secondary} onClick={() => setDetail(null)}>Close Student Detail</button><h2>Student Learning Profile</h2><PlainTable rows={[detail.student as Row]}/><h3>Practice History</h3><PlainTable rows={(detail.history || []) as Row[]}/><h3>Performance</h3><PlainTable rows={((detail.stats as Row)?.performance || []) as Row[]}/><h3>Linked Mock Results</h3><PlainTable rows={((detail.mock as Row)?.completed || []) as Row[]}/><div className={styles.toolbar}><select id="enrol-course" aria-label="Enrol in course"><option value="">Choose a course</option>{lookup.courses.map(c => <option value={c.id} key={c.id}>{c.title}</option>)}</select><button className={p.secondary} onClick={async () => { try {
            const courseId = (document.getElementById('enrol-course') as HTMLSelectElement).value;
            await cmsRequest('students', { id: (detail.student as Row).id, action: 'enrol', courseId });
            setMessage('Student enrolled.');
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Unable to enrol.');
        } }}>Enrol Student</button></div></section>}
 {resource === 'media' ? <div className={styles.mediaGrid}>{listing.rows.map(row => <figure key={String(row.id)}>{String(row.mime).startsWith('image/') ? <img src={'/api/learning/media/' + row.id} alt={String(row.title)}/> : String(row.mime).startsWith('audio/') ? <audio controls src={'/api/learning/media/' + row.id}/> : <a className={p.textLink} href={'/api/learning/media/' + row.id}>Download PDF</a>}<figcaption>{String(row.title)}<br />{Math.round(Number(row.bytes) / 1024)} KB</figcaption><div className={styles.actions}><button onClick={async () => { const name = window.prompt('New display name', String(row.title)); if (!name)
            return; try {
            await cmsRequest('media', { id: row.id, title: name });
            await load();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Rename failed.');
        } }}>Rename</button><button onClick={async () => { if (!window.confirm('Permanently delete this unused media file?'))
            return; try {
            await cmsRequest('media', { id: row.id, action: 'delete', confirm: true });
            await load();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Delete failed.');
        } }}>Delete</button></div></figure>)}</div> : <div className={p.tableWrap}><table className={p.table}><thead><tr>{resource === 'questions' && <th><input type="checkbox" aria-label="Select all questions on this page" checked={!!listing.rows.length && selected.length === listing.rows.length} onChange={e => setSelected(e.target.checked ? listing.rows.map(r => String(r.id)) : [])}/></th>}<th scope="col">{resource === 'students' ? 'Student' : 'Title / Event'}</th><th scope="col">Status / Details</th><th scope="col">Date / Order</th><th scope="col">Actions</th></tr></thead><tbody>{listing.rows.map(row => <tr key={String(row.id)}>{resource === 'questions' && <td><input type="checkbox" aria-label={'Select ' + row.title} checked={selected.includes(String(row.id))} onChange={e => setSelected(e.target.checked ? [...selected, String(row.id)] : selected.filter(id => id !== row.id))}/></td>}<td><strong>{String(row.title || '')}</strong>{row.email ? <p>{String(row.email)}</p> : null}{!!row.id && <p className={styles.muted}>{String(row.id)}</p>}</td><td>{resource === 'students' ? <>{row.active ? 'Active' : 'Inactive'} &middot; {String(row.level)}<br />{String(row.attempts)} attempts ? {row.accuracy === null ? '-' : String(row.accuracy) + '%'}<br />{String(row.completed_lessons)} lessons</> : resource === 'audit' ? <><span>{String(row.actor_id)}</span><p>{String(row.details)}</p></> : <>{String(row.status || '')}<p>{String(row.difficulty || '')}</p></>}</td><td>{String(row.updated_at || row.created_at || row.joined_at || row.position || '-')}</td><td><div className={styles.actions}>{editable ? <><button onClick={() => void open(String(row.id), 'edit')}>Edit</button><button onClick={() => void open(String(row.id), 'preview')}>Preview</button><button onClick={() => void command(String(row.id), 'duplicate')}>Duplicate</button>{['publish', 'unpublish', row.status === 'archived' ? 'restore' : 'archive'].map(action => <button key={action} disabled={busy} onClick={() => void command(String(row.id), action)}>{action}</button>)}</> : resource === 'students' ? <><button onClick={async () => { try {
            setDetail(await cmsRequest('students?id=' + row.id));
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Unable to load student.');
        } }}>View Progress</button><button onClick={async () => { if (!window.confirm((row.active ? 'Deactivate' : 'Activate') + ' this student account? Deactivation revokes portal sessions.'))
            return; try {
            await cmsRequest('students', { id: row.id, action: 'access', active: !row.active, confirm: true });
            await load();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Access change failed.');
        } }}>{row.active ? 'Deactivate' : 'Activate'}</button></> : null}</div></td></tr>)}</tbody></table>{!listing.rows.length && !busy && <p className={p.empty}>No records match your filters.</p>}</div>}
 <div className={styles.pager}><button className={p.secondary} disabled={page <= 1 || busy} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {listing.pages} &middot; {listing.total} records</span><button className={p.secondary} disabled={page >= listing.pages || busy} onClick={() => setPage(page + 1)}>Next</button></div></>}
 </main></div>;
}
