'use client';
import MediaPicker from './MediaPicker';
import { useRef } from 'react';
import type { Block } from '@/lib/learning/types';
import { LessonContent } from '@/app/student/components/LessonContent';
import styles from './cms.module.css';
const types = ['heading', 'paragraph', 'rule', 'example', 'bullets', 'numbered', 'table', 'image', 'audio', 'pdf', 'practice'] as const;
type Media = {
    id: string;
    title: string;
    mime: string;
};
function TextBlock({ block, onChange }: {
    block: Block;
    onChange: (b: Block) => void;
}) { const ref = useRef<HTMLTextAreaElement>(null); function wrap(mark: string) { const node = ref.current; if (!node)
    return; const start = node.selectionStart, end = node.selectionEnd, text = block.text || ''; onChange({ ...block, text: text.slice(0, start) + mark + text.slice(start, end) + mark + text.slice(end) }); node.focus(); } return <><div className={styles.actions}><button type="button" onClick={() => wrap('**')}><strong>Bold</strong></button><button type="button" onClick={() => wrap('_')}><em>Italic</em></button></div><textarea ref={ref} aria-label="Block text" value={block.text || ''} onChange={e => onChange({ ...block, text: e.target.value })}/></>; }
export default function BlockEditor({ value, onChange }: {
    value: Block[];
    onChange: (blocks: Block[]) => void;
    media: Media[];
}) { function update(i: number, b: Block) { onChange(value.map((old, j) => i === j ? b : old)); } function move(i: number, delta: number) { const copy = [...value], j = i + delta; if (j < 0 || j >= copy.length)
    return; [copy[i], copy[j]] = [copy[j], copy[i]]; onChange(copy); } return <section><p className={styles.muted}>Build rich lessons from safe text blocks. Select text and use Bold/Italic. Lists use one item per line; table columns use tabs. HTML is treated as plain text.</p>{value.map((b, i) => <div className={styles.block} key={i}><div className={styles.toolbar}><strong>{i + 1}. {b.type}</strong><div className={styles.actions}><button type="button" disabled={!i} onClick={() => move(i, -1)}>Move up</button><button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)}>Move down</button><button type="button" onClick={() => onChange(value.filter((_, j) => i !== j))}>Remove block</button></div></div>{b.type === 'table' ? <label>Rows (tab-separated columns)<textarea value={b.rows?.map(r => r.join('\t')).join('\n') || ''} onChange={e => update(i, { ...b, rows: e.target.value.split('\n').map(line => line.split('\t')) })}/></label> : <TextBlock block={b} onChange={next => update(i, next)}/>} {['image','audio','pdf'].includes(b.type)&&<MediaPicker label={b.type+' attachment'} type={b.type==='pdf'?'application/pdf':b.type+'/'} value={b.mediaId?[b.mediaId]:[]} onChange={ids=>update(i,{...b,mediaId:ids[0]||''})}/>}{b.type === 'practice' && <label>Practice set ID<input value={b.practiceId || ''} onChange={e => update(i, { ...b, practiceId: e.target.value })}/></label>}</div>)}<div className={styles.toolbar}><label>Add block <select value="" onChange={e => { if (e.target.value)
    onChange([...value, { type: e.target.value as Block['type'], text: '' }]); }}><option value="">Choose block type</option>{types.map(t => <option key={t}>{t}</option>)}</select></label></div><details><summary>Live lesson preview</summary><div className={styles.preview}><LessonContent blocks={value}/></div></details></section>; }
