'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Slot, Booking } from '@/lib/partial-tests/service';
import styles from '../../portal.module.css';
const modules = ['listening', 'reading', 'writing'] as const;
const label = (value: string) => value[0].toUpperCase() + value.slice(1);
export default function PartialTests({ slots, bookings }: { slots: Slot[]; bookings: Booking[] }) {
    const router = useRouter(), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
    async function action(data: Record<string, unknown>) {
        if (busy) return;
        setBusy(true); setError(''); setMessage('');
        try {
            const response = await fetch('/api/student/partial-tests', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            const result = await response.json();
            if (!response.ok) throw Error(result.error || 'Unable to complete your request.');
            if (data.action === 'start') {
                if (sessionStorage.getItem('ieltsStudent') !== result.candidateId) {
                    for (const key of Object.keys(sessionStorage)) if (key.startsWith('ielts')) sessionStorage.removeItem(key);
                    sessionStorage.setItem('ieltsStudent', result.candidateId);
                }
                window.location.assign(result.destination);
            } else { setMessage('Registered successfully. Your registration is available to the admin.'); router.refresh(); }
        } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.'); }
        finally { setBusy(false); }
    }
    return <>
        <p className={styles.lead}>Choose a module, test and available date. Take your test from home or at the centre on your booked date. All dates follow Bangladesh time. Start before midnight; the usual test duration applies once started.</p>
        {error && <p role="alert" className={styles.error}>{error}</p>}{message && <p role="status" className={styles.success}>{message}</p>}
        {modules.map(module => <section key={module} className={styles.section}><div className={styles.sectionHeader}><h2>{label(module)}</h2></div><div className={styles.grid}>{Array.from({ length: 5 }, (_, i) => i + 1).map(test => {
            const booked = bookings.find(b => b.module === module && b.test === test), dates = slots.filter(s => s.module === module && s.test === test);
            return <article key={test} className={styles.card}><h3>{label(module)} Test {test}</h3>{booked ? <><p>Booked date: {booked.date}<br/>{booked.status}</p>{booked.status === 'Available today' && <button className={styles.button} disabled={busy} onClick={() => void action({ action: 'start', bookingId: booked.id })}>{busy ? 'Please wait…' : 'Start test'}</button>}</> : dates.length ? <form onSubmit={e => { e.preventDefault(); void action({ action: 'register', slotId: new FormData(e.currentTarget).get('slotId') }); }}><label className={styles.field}>Test date<select name="slotId" required disabled={busy} defaultValue=""><option value="" disabled>Select a date</option>{dates.map(s => <option key={s.id} value={s.id}>{s.date}</option>)}</select></label><button style={{ marginTop: 14 }} className={styles.button} disabled={busy}>{busy ? 'Please wait…' : 'Register'}</button></form> : <p>No dates available yet.</p>}</article>;
        })}</div></section>)}
    </>;
}
