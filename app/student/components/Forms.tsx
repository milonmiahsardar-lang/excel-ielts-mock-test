'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { levels, goals } from '@/lib/student/catalog';
import type { Student } from '@/lib/student/types';
import styles from '../portal.module.css';
type Mode = 'register' | 'login' | 'profile' | 'password' | 'forgot-password' | 'reset-password';
function PasswordField({ name, label, newPassword = false, optional = false }: {
    name: string;
    label: string;
    newPassword?: boolean;
    optional?: boolean;
}) { const [show, setShow] = useState(false); return <label className={styles.field}>{label}<span className={styles.password}><input name={name} type={show ? 'text' : 'password'} required={!optional} minLength={newPassword ? 12 : undefined} maxLength={128} autoComplete={newPassword ? 'new-password' : 'current-password'}/><button type="button" aria-label={(show ? 'Hide ' : 'Show ') + label.toLowerCase()} aria-pressed={show} onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button></span>{newPassword && name === 'password' && <small>12-128 characters, including a letter and a number.</small>}</label>; }
export default function StudentForm({ mode, student, token }: {
    mode: Mode;
    student?: Student;
    token?: string;
}) {
    const router = useRouter(), [error, setError] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
    const profile = mode === 'register' || mode === 'profile', newPassword = ['register', 'password', 'reset-password'].includes(mode);
    async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(''); setMessage(''); setBusy(true); const form = event.currentTarget, data = Object.fromEntries(new FormData(form)); try {
        const response = await fetch('/api/student/' + mode, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, ...(token ? { token } : {}) }) });
        const result = await response.json();
        if (!response.ok)
            throw Error(result.error || 'Unable to complete this request.');
        if (result.redirect) {
            router.replace(result.redirect);
            router.refresh();
        }
        else {
            setMessage(result.message || 'Saved.');
            if (mode === 'password')
                form.reset();
            router.refresh();
        }
    }
    catch (e) {
        setError(e instanceof Error ? e.message : 'Connection failed. Please try again.');
    }
    finally {
        setBusy(false);
    } }
    return <form onSubmit={submit} className={styles.form}>{profile && <label className={styles.field}>Full Name<input name="name" required maxLength={120} autoComplete="name" defaultValue={student?.name}/></label>}{!['password', 'reset-password'].includes(mode) && <label className={styles.field}>Email Address<input name="email" type="email" required maxLength={254} autoComplete="email" defaultValue={student?.email}/>{mode === 'profile' && <small>Changing your email requires your current password below.</small>}</label>}{profile && <div className={styles.fields}><label className={styles.field}>Mobile Number <small>Optional</small><input name="mobile" type="tel" maxLength={35} autoComplete="tel" defaultValue={student?.mobile}/></label><label className={styles.field}>Date of Birth <small>Optional</small><input name="dob" type="date" min="1900-01-01" autoComplete="bday" defaultValue={student?.dob}/></label><label className={styles.field}>Country <small>Optional</small><input name="country" maxLength={80} autoComplete="country-name" defaultValue={student?.country}/></label><label className={styles.field}>English Proficiency Level<select name="level" required defaultValue={student?.level || ''}><option value="" disabled>Select your level</option>{levels.map(v => <option key={v}>{v}</option>)}</select></label><label className={styles.field}>Learning Goal<select name="goal" required defaultValue={student?.goal || ''}><option value="" disabled>Select your goal</option>{goals.map(v => <option key={v}>{v}</option>)}</select></label></div>}{mode === 'profile' && <PasswordField name="currentPassword" label="Current Password (only to change email)" optional/>}{mode === 'password' && <PasswordField name="currentPassword" label="Current Password"/>}{(mode === 'login' || newPassword) && <PasswordField name="password" label={mode === 'password' || mode === 'reset-password' ? 'New Password' : 'Password'} newPassword={newPassword}/>} {newPassword && <PasswordField name="confirmPassword" label="Confirm Password" newPassword/>}{error && <p className={styles.error} role="alert">{error}</p>}{message && <p className={styles.success} role="status">{message}</p>}<button disabled={busy} className={styles.button}>{busy ? 'Please wait...' : ({ register: 'Create Account', login: 'Student Login', profile: 'Save Profile', password: 'Change Password', 'forgot-password': 'Request Reset Link', 'reset-password': 'Reset Password' }[mode])}</button>{mode === 'login' && <div className={styles.actions}><Link href="/student/forgot-password" className={styles.textLink}>Forgot password?</Link><Link href="/student/register" className={styles.textLink}>Create account</Link></div>}{mode === 'register' && <p className={styles.subtle}>Already have an account? <Link href="/student/login" className={styles.textLink}>Sign in</Link></p>}{mode === 'forgot-password' && <Link href="/student/login" className={styles.textLink}>Back to login</Link>}</form>;
}
