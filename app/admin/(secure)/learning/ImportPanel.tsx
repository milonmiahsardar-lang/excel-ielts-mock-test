'use client';
import { useState } from 'react';
import { cmsRequest, type Lookup } from './ContentEditor';
import styles from './cms.module.css';
import p from '@/app/student/portal.module.css';
const fields = ['id', 'categoryId', 'topicId', 'type', 'difficulty', 'prompt', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation', 'marks', 'structured'];
export default function ImportPanel({ lookup }: {
    lookup: Lookup;
}) {
    const [rows, setRows] = useState<Record<string, unknown>[]>([]), [headers, setHeaders] = useState<string[]>([]), [mapping, setMapping] = useState<Record<string, string>>({}), [categoryId, setCategory] = useState(''), [overwrite, setOverwrite] = useState(false), [preview, setPreview] = useState<{
        row: number;
        error: string;
        record?: Record<string, unknown>;
    }[]>([]), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
    async function fileChanged(file?: File) { if (!file)
        return; if (file.size > 4 * 1024 * 1024) {
        setError('Files must be at most 4 MB.');
        return;
    } setBusy(true); setError(''); setPreview([]); try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        let binary = '';
        for (const b of bytes)
            binary += String.fromCharCode(b);
        const result = await cmsRequest('import', { action: 'parse', filename: file.name, base64: btoa(binary) });
        setRows(result.rows);
        setHeaders(result.headers);
        setMapping(Object.fromEntries(fields.filter(f => result.headers.includes(f)).map(f => [f, f])));
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to read file.');
    }
    finally {
        setBusy(false);
    } }
    return <section className={p.card}><h2>Content Import / Export</h2><p>Import up to 1,000 questions per UTF-8 CSV, JSON array or XLSX file (4 MB maximum). XLSX imports the first worksheet; formulas and macros are rejected. Templates contain headers only.</p><div className={styles.toolbar}>{['csv', 'xlsx', 'json'].map(format => <span key={format}><a className={p.secondary} href={'/api/admin/learning/export?format=' + format + '&template=1'}>Download {format.toUpperCase()} Template</a> <a className={p.textLink} href={'/api/admin/learning/export?format=' + format}>Export {format.toUpperCase()}</a></span>)}</div><p className={styles.muted}>Use structured for a complete question JSON object (matching pairs, rearrangement sequences, accepted alternatives and free-text criteria). Simple choice imports may use option_a-d and correct_answer. Category/topic values are database IDs shown in their editors. Imported questions default to Draft.</p><label className={p.field}>Upload File<input type="file" accept=".csv,.xlsx,.json" disabled={busy} onChange={e => void fileChanged(e.target.files?.[0])}/></label>{headers.length > 0 && <><p>{rows.length} rows loaded.</p><div className={p.fields}>{fields.map(field => <label className={p.field} key={field}>{field}<select value={mapping[field] || ''} onChange={e => { setPreview([]); setMapping({ ...mapping, [field]: e.target.value }); }}><option value="">Do not map</option>{headers.map(h => <option key={h}>{h}</option>)}</select></label>)}<label className={p.field}>Override Category (optional)<select value={categoryId} onChange={e => { setCategory(e.target.value); setPreview([]); }}><option value="">Use file category</option>{lookup.categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label></div><label className={styles.check}><input type="checkbox" checked={overwrite} onChange={e => { setOverwrite(e.target.checked); setPreview([]); }}/>Explicitly allow overwriting detected duplicates (history snapshots are retained)</label><div className={styles.toolbar}><button className={p.secondary} disabled={busy} onClick={async () => { setBusy(true); setError(''); try {
        const result = await cmsRequest('import', { action: 'preview', rows, mapping, categoryId, overwrite });
        setPreview(result.rows);
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to validate.');
    }
    finally {
        setBusy(false);
    } }}>Validate &amp; Preview</button><button className={p.button} disabled={busy || !preview.some(row => !row.error)} onClick={async () => { if (overwrite && !window.confirm('Overwrite matching question-bank records? Existing attempt snapshots will remain unchanged.'))
        return; setBusy(true); setError(''); try {
        const result = await cmsRequest('import', { action: 'commit', rows, mapping, categoryId, overwrite });
        setMessage(result.results.filter((r: {
            id?: string;
        }) => r.id).length + ' imported; ' + result.results.filter((r: {
            error?: string;
        }) => r.error).length + ' rejected.');
        setPreview([]);
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Import failed.');
    }
    finally {
        setBusy(false);
    } }}>Import Valid Questions</button></div></>}{error && <p role="alert" className={p.error}>{error}</p>}{message && <p role="status" className={p.success}>{message}</p>}{busy && <p role="status">Processing...</p>}{preview.length > 0 && <div className={p.tableWrap}><table className={p.table}><thead><tr><th>Row</th><th>Question</th><th>Validation</th></tr></thead><tbody>{preview.slice(0, 1000).map(r => <tr key={r.row}><td>{r.row}</td><td>{String(r.record?.prompt || '')}</td><td className={r.error ? styles.errorCell : undefined}>{r.error || 'Valid'}</td></tr>)}</tbody></table></div>}</section>;
}
