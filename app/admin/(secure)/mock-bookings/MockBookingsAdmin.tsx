'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Slot } from '@/lib/mock-bookings/service';
type Registration = { id: string; name: string; email: string; mobile: string; module: string; test: number; date: string; created: string };
export default function MockBookingsAdmin({ slots, registrations, today }: { slots: Slot[]; registrations: Registration[]; today: string }) {
    const router = useRouter(), [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
    async function submit(data: Record<string, unknown>) {
        if (busy) return;
        setBusy(true); setError(''); setMessage('');
        try {
            const response = await fetch('/api/admin/mock-bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            const result = await response.json(); if (!response.ok) throw Error(result.error || 'Unable to save.');
            setMessage('Saved successfully.'); router.refresh();
        } catch (e) { setError(e instanceof Error ? e.message : 'Please try again.'); } finally { setBusy(false); }
    }
    return <div className="space-y-6"><h1 className="text-2xl font-bold">Mock Test Bookings</h1><p>Publish dates for full Mock Tests 19 and 20. Students may take their booked test from home or at the centre. All dates use Bangladesh time. Registrations appear below.</p>{error && <p role="alert" className="text-red-700">{error}</p>}{message && <p role="status">{message}</p>}
        <section className="border bg-white p-6"><h2 className="mb-4 text-xl font-bold">Add an available date</h2><form className="flex flex-wrap items-end gap-4" onSubmit={e => { e.preventDefault(); const data = new FormData(e.currentTarget); void submit({ action: 'publish', module: data.get('module'), test: Number(data.get('test')), date: data.get('date') }); }}><label>Module<select name="module" required className="block border p-2">{['full'].map(m => <option key={m} value={m}>{m[0].toUpperCase() + m.slice(1)}</option>)}</select></label><label>Test<select name="test" required className="block border p-2">{[19, 20].map(n => <option key={n} value={n}>Test {n}</option>)}</select></label><label>Date (Bangladesh)<input name="date" type="date" required min={today} className="block border p-2"/></label><button disabled={busy} className="border px-4 py-2">Publish date</button></form></section>
        <section className="overflow-x-auto border bg-white p-6"><h2 className="mb-4 text-xl font-bold">Available dates</h2><table className="w-full text-left"><thead><tr>{['Module', 'Test', 'Date', 'Registrations', 'Status', ''].map(h => <th key={h} className="border-b p-3">{h}</th>)}</tr></thead><tbody>{slots.map(s => <tr key={s.id}><td className="p-3 capitalize">{s.module}</td><td className="p-3">{s.test}</td><td className="p-3">{s.date}</td><td className="p-3">{s.bookings}</td><td className="p-3">{s.open ? 'Open' : 'Closed'}</td><td className="p-3"><button className="border px-3 py-1" disabled={busy || s.date < today} onClick={() => void submit({ action: 'set-open', id: s.id, open: !s.open })}>{s.open ? 'Close registration' : 'Reopen registration'}</button></td></tr>)}</tbody></table>{!slots.length && <p>No dates published yet.</p>}<p className="mt-4 text-sm">Closing registration stops new bookings. Existing bookings remain valid.</p></section>
        <section className="overflow-x-auto border bg-white p-6"><h2 className="mb-4 text-xl font-bold">Student registrations ({registrations.length})</h2><button className="mb-4 border px-3 py-1" onClick={() => router.refresh()}>Refresh registrations</button><table className="w-full text-left"><thead><tr>{['Student', 'Email', 'Mobile', 'Module', 'Test', 'Booked date', 'Registered (Bangladesh)'].map(h => <th key={h} className="border-b p-3">{h}</th>)}</tr></thead><tbody>{registrations.map(r => <tr key={r.id}><td className="p-3">{r.name}</td><td className="p-3">{r.email}</td><td className="p-3">{r.mobile || '—'}</td><td className="p-3 capitalize">{r.module}</td><td className="p-3">{r.test}</td><td className="p-3">{r.date}</td><td className="p-3">{new Date(r.created).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })}</td></tr>)}</tbody></table>{!registrations.length && <p>No registrations yet.</p>}</section>
    </div>;
}
