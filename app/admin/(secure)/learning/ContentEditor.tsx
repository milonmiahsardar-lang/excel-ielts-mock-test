'use client';
import { useEffect, useState } from 'react';
import { questionTypes, type Block } from '@/lib/learning/types';
import { QuestionInput } from '@/app/student/components/PracticeEngine';
import type { PracticeQuestion } from '@/lib/student/types';
import BlockEditor from './BlockEditor';
import MediaPicker from './MediaPicker';
import styles from './cms.module.css';
import p from '@/app/student/portal.module.css';
export type Lookup = {
    categories: {
        id: string;
        title: string;
    }[];
    topics: {
        id: string;
        title: string;
        categoryId: string;
        parentId?: string;
    }[];
    courses: {
        id: string;
        title: string;
    }[];
    modules: {
        id: string;
        title: string;
        courseId: string;
    }[];
    media: {
        id: string;
        title: string;
        mime: string;
    }[];
};
export async function cmsRequest(resource: string, data?: Record<string, unknown>) { const response = await fetch('/api/admin/learning/' + resource, { method: data ? 'POST' : 'GET', headers: data ? { 'Content-Type': 'application/json' } : {}, body: data ? JSON.stringify(data) : undefined, cache: 'no-store' }), result = await response.json(); if (!response.ok)
    throw Error(result.error || 'Unable to complete this request.'); return result; }
type Item = {
    id: string;
    text: string;
};
export default function ContentEditor({ resource, initial, lookup, onClose, onSaved }: {
    resource: string;
    initial: Record<string, unknown>;
    lookup: Lookup;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [data, setData] = useState<Record<string, unknown>>({ ...initial, status: initial.status || 'draft', type: initial.type || 'multiple-choice' }), [busy, setBusy] = useState(false), [error, setError] = useState(''), [bank, setBank] = useState<{
        id: string;
        title: string;
    }[]>([]), [search, setSearch] = useState(''), [bankPage,setBankPage]=useState(1),[bankPages,setBankPages]=useState(1),[bankTitles,setBankTitles]=useState<Record<string,string>>({}), [previewAnswer, setPreviewAnswer] = useState<import('@/lib/student/types').PracticeAnswer>('');
    const update = (key: string, value: unknown) => setData(old => ({ ...old, [key]: value }));
    const isQuestion = resource === 'questions', isSet = resource === 'practice-sets' || resource === 'assessments', isLesson = resource === 'lessons', isCourse = resource === 'courses', isCategory = resource === 'categories', isTopic = resource === 'topics', isModule = resource === 'modules';
    const options = (data.options || []) as Item[], items = (data.items || []) as Item[], chosen = (data.questionIds || []) as {
        id: string;
        marks: number;
    }[];
    useEffect(() => { if (!isSet)
        return; const controller = new AbortController(); const timer = setTimeout(() => { fetch('/api/admin/learning/questions?q=' + encodeURIComponent(search) + '&status=published&page='+bankPage, { signal: controller.signal }).then(r => r.json()).then(r => { if (r.rows){setBank(r.rows);setBankPages(r.pages||1);setBankTitles(old=>({...old,...Object.fromEntries(r.rows.map((row:{id:string;title:string})=>[row.id,row.title]))}));} }).catch(() => { }); }, 200); return () => { clearTimeout(timer); controller.abort(); }; }, [isSet, search, bankPage]);
    function text(key: string, label: string, multiline = false, type = 'text') { return <label className={p.field} key={key}>{label}{multiline ? <textarea rows={4} value={String(data[key] ?? '')} onChange={e => update(key, e.target.value)}/> : <input type={type} readOnly={!!initial.id && isTopic && key === 'slug'} value={String(data[key] ?? '')} onChange={e => update(key, e.target.value)}/>}</label>; }
    function select(key: string, label: string, values: {
        id: string;
        title: string;
    }[]) { return <label className={p.field}>{label}<select disabled={!!initial.id && isTopic && key === 'categoryId'} value={String(data[key] || '')} onChange={e => { update(key, e.target.value); if (key === 'categoryId')
        update('topicId', ''); if (key === 'courseId')
        update('moduleId', ''); }}><option value="">Choose {label.toLowerCase()}</option>{values.map(v => <option value={v.id} key={v.id}>{v.title}</option>)}</select></label>; }
    function editItems(key: 'options' | 'items', values: Item[]) { return <section className={styles.wide}><h3 className={styles.tableLabel}>{key === 'options' ? 'Answer options' : 'Left items / scrambled words'}</h3>{values.map((item, i) => <div className={styles.toolbar} key={i}><input style={{ maxWidth: 80 }} aria-label="Item ID" value={item.id} onChange={e => update(key, values.map((v, j) => i === j ? { ...v, id: e.target.value } : v))}/><input aria-label="Item text" value={item.text} onChange={e => update(key, values.map((v, j) => i === j ? { ...v, text: e.target.value } : v))}/><button type="button" className={p.secondary} onClick={() => update(key, values.filter((_, j) => j !== i))}>Remove</button></div>)}<button type="button" className={p.secondary} onClick={() => update(key, [...values, { id: key === 'options' ? String.fromCharCode(65 + values.length) : String.fromCharCode(97 + values.length), text: '' }])}>Add {key === 'options' ? 'option' : 'item'}</button></section>; }
    async function save(status: string) { setBusy(true); setError(''); try {
        await cmsRequest(resource, { ...data, status });
        onSaved();
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to save.');
    }
    finally {
        setBusy(false);
    } }
    return <section className={styles.editor} aria-label="Content editor"><div className={styles.toolbar}><h2>{initial.id ? 'Edit' : 'Create'} {resource.replaceAll('-', ' ')}</h2><button type="button" className={p.secondary} onClick={onClose}>Close Editor</button></div><form onSubmit={e => { e.preventDefault(); void save(String(data.status)); }}><fieldset disabled={busy}><div className={p.fields}>{text('title', isQuestion ? 'Question title' : 'Title')}{!!initial.id && <label className={p.field}>ID<input readOnly value={String(initial.id)}/></label>}{isCourse && text('slug', 'Course Slug')}{isTopic && text('slug', 'Topic Slug')}{(isCourse || isQuestion || isTopic || isSet || isLesson) && select('categoryId', 'Category', lookup.categories)}{(isQuestion || isLesson || isSet) && select('topicId', 'Topic', lookup.topics.filter(t => !data.categoryId || t.categoryId === data.categoryId))}{(isCourse || isQuestion || isLesson || isSet) && select('difficulty', 'English Level / Difficulty', ['Beginner', 'Elementary', 'Intermediate', 'Upper Intermediate', 'Advanced'].map(v => ({ id: v, title: v })))}{(isModule || isLesson || isSet) && select('courseId', 'Course', lookup.courses)}{(isLesson || isSet) && select('moduleId', 'Module', lookup.modules.filter(m => !data.courseId || m.courseId === data.courseId))}{(isCategory || isTopic) && select('parentId', 'Parent (optional)', (isCategory ? lookup.categories : lookup.topics.filter(t => !data.categoryId || t.categoryId === data.categoryId)).filter(t => t.id !== data.id))}{!isQuestion && text('position', 'Display Order', false, 'number')}{(isCategory || isCourse || isSet) && text('description', 'Short Description', true)}{isCategory && text('icon', 'Icon (book, pen, headphones, message, layers, file, graduation)')}{isCourse && <>{text('fullDescription', 'Full Description', true)}{text('objectives', 'Learning Objectives', true)}{text('duration', 'Estimated Duration (minutes)', false, 'number')}<MediaPicker label="Cover Image" type="image/" value={data.coverId?[String(data.coverId)]:[]} onChange={ids=>update('coverId',ids[0]||'')}/>{select('visibility', 'Visibility', [{ id: 'all-students', title: 'All registered students' }, { id: 'enrolled', title: 'Enrolled students only' }])}</>}{(isLesson || isSet) && <>{text('instructions', 'Instructions', true)}{text('objectives', 'Learning Objectives', true)}{text('duration', 'Estimated Study Time (minutes)', false, 'number')}</>}
 {isQuestion && <><label className={p.field}>Question Type<select value={String(data.type)} onChange={e => { update('type', e.target.value); if (e.target.value === 'true-false')
        update('options', [{ id: 'TRUE', text: 'True' }, { id: 'FALSE', text: 'False' }]);
    else if (e.target.value === 'true-false-not-given')
        update('options', [{ id: 'TRUE', text: 'True' }, { id: 'FALSE', text: 'False' }, { id: 'NOT_GIVEN', text: 'Not Given' }]);
    else if (e.target.value === 'multiple-choice' && !options.length)
        update('options', ['A', 'B', 'C', 'D'].map(id => ({ id, text: '' }))); }}>{questionTypes.map(type => <option key={type}>{type}</option>)}</select></label>{text('prompt', 'Question Text', true)}{text('passage', 'Reading Passage / Reference (optional)', true)}{text('instructions', 'Additional Instructions', true)}{['multiple-choice', 'true-false', 'true-false-not-given', 'error-identification', 'matching'].includes(String(data.type)) && editItems('options', options)}{['matching', 'sentence-rearrangement'].includes(String(data.type)) && editItems('items', items)}{['multiple-choice', 'true-false', 'true-false-not-given', 'error-identification'].includes(String(data.type)) ? <label className={p.field}>Correct Option<select value={String((data.accepted as string[] || [])[0] || '')} onChange={e => update('accepted', [e.target.value])}><option value="">Choose correct option</option>{options.map(o => <option key={o.id} value={o.id}>{o.id} - {o.text}</option>)}</select></label> : data.type === 'matching' ? <section className={styles.wide}><h3>Correct pairs</h3>{items.map(item => <label key={item.id} className={p.field}>{item.id} - {item.text}<select value={String((data.pairs as Record<string, string> || {})[item.id] || '')} onChange={e => update('pairs', { ...(data.pairs as Record<string, string> || {}), [item.id]: e.target.value })}><option value="">Choose matching option</option>{options.map(o => <option key={o.id} value={o.id}>{o.id} - {o.text}</option>)}</select></label>)}</section> : data.type === 'sentence-rearrangement' ? <label className={p.field}>Correct Item Sequence (IDs separated by commas)<input value={(data.sequence as string[] || []).join(',')} onChange={e => update('sequence', e.target.value.split(',').map(v => v.trim()))}/></label> : data.type === 'free-text' ? <>{text('sampleAnswer', 'Optional Sample Answer (private)', true)}{text('criteria', 'Optional Assessment Criteria', true)}{text('minWords', 'Minimum Words', false, 'number')}</> : <label className={p.field}>Accepted Answers (one per line)<textarea rows={4} value={(data.accepted as string[] || []).join('\n')} onChange={e => update('accepted', e.target.value.split('\n'))}/></label>}{text('maxWords', 'Maximum Words (optional)', false, 'number')}{text('explanation', 'Explanation', true)}{text('marks', 'Marks', false, 'number')}<label className={p.field}>Tags (comma separated)<input value={(data.tags as string[] || []).join(',')} onChange={e => update('tags', e.target.value.split(',').map(v => v.trim()).filter(Boolean))}/></label><section className={styles.wide}><MediaPicker label="Question Media" multiple value={(data.mediaIds||[]) as string[]} onChange={ids=>update('mediaIds',ids)}/></section><details className={styles.wide}><summary>Question preview (no attempt is created)</summary><div className={styles.preview}><h3>{String(data.prompt || '')}</h3><QuestionInput question={{ ...data, id: 'preview', prompt: String(data.prompt || ''), type: String(data.type) } as PracticeQuestion} value={previewAnswer} onChange={setPreviewAnswer}/></div></details></>}
 {isLesson && <div className={styles.wide}><h3>Lesson Content</h3><BlockEditor value={(data.blocks || []) as Block[]} onChange={b => update('blocks', b)} media={lookup.media}/></div>}
 {isSet && <><section className={styles.builder}><h3>Practice Set Builder</h3><p className={styles.muted}>Search published questions, add them, then adjust marks and order. Saving/publishing stores a versioned copy.</p><div className={styles.toolbar}><input aria-label="Search published question bank" placeholder="Search questions" value={search} onChange={e => {setSearch(e.target.value);setBankPage(1);}}/></div>{bank.map(q => <label className={styles.check} key={q.id}><input type="checkbox" checked={chosen.some(c => c.id === q.id)} onChange={e => update('questionIds', e.target.checked ? [...chosen, { id: q.id, marks: 1 }] : chosen.filter(c => c.id !== q.id))}/>{q.title}</label>)}<div className={styles.toolbar}><button type="button" className={p.secondary} disabled={bankPage<=1} onClick={()=>setBankPage(bankPage-1)}>Previous questions</button><span>Page {bankPage} of {bankPages}</span><button type="button" className={p.secondary} disabled={bankPage>=bankPages} onClick={()=>setBankPage(bankPage+1)}>Next questions</button></div><h4>Selected questions ({chosen.length})</h4>{chosen.map((q, i) => <article key={q.id}><strong>{i + 1}. {bankTitles[q.id] || bank.find(b => b.id === q.id)?.title || q.id}</strong><div className={styles.toolbar}><label>Marks <input type="number" min="0.01" step="0.01" value={q.marks} onChange={e => update('questionIds', chosen.map((c, j) => i === j ? { ...c, marks: Number(e.target.value) } : c))}/></label><div className={styles.actions}>{[-1, 1].map(delta => <button type="button" key={delta} disabled={i + delta < 0 || i + delta >= chosen.length} onClick={() => { const copy = [...chosen]; [copy[i], copy[i + delta]] = [copy[i + delta], copy[i]]; update('questionIds', copy); }}>{delta < 0 ? 'Move up' : 'Move down'}</button>)}<button type="button" onClick={() => update('questionIds', chosen.filter(c => c.id !== q.id))}>Remove</button></div></div></article>)}</section>{text('timeLimit', 'Time Limit (seconds, 0 = untimed)', false, 'number')}{text('passingScore', 'Passing Score (%, 0 = none)', false, 'number')}<label className={styles.check}><input type="checkbox" checked={data.showExplanations !== false} onChange={e => update('showExplanations', e.target.checked)}/>Show answer explanations after submission</label><label className={styles.check}><input type="checkbox" checked={data.allowRetries !== false} onChange={e => update('allowRetries', e.target.checked)}/>Allow retries</label></>}
 </div>{error && <p role="alert" className={p.error}>{error}</p>}<div className={styles.toolbar}><button className={p.secondary} type="button" onClick={() => void save('draft')}>Save Draft</button><button className={p.button} type="button" onClick={() => void save('published')}>Publish</button><button className={p.secondary} type="button" onClick={onClose}>Cancel</button>{busy && <span role="status">Saving...</span>}</div></fieldset></form></section>;
}
