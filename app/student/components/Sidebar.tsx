'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { House, BookOpen, ClipboardList, TrendingUp, History, User, Settings, LogOut, Menu } from 'lucide-react';
import styles from '../portal.module.css';
const links = [{ name: 'Dashboard', path: '/student/dashboard', Icon: House }, { name: 'My Practice', path: '/student/practice', Icon: BookOpen }, {name:'Courses',path:'/student/courses',Icon:BookOpen},{ name: 'IELTS Mock Tests', path: '/student/mock-tests', Icon: ClipboardList }, { name: 'My Progress', path: '/student/progress', Icon: TrendingUp }, { name: 'Learning History', path: '/student/history', Icon: History }, { name: 'My Profile', path: '/student/profile', Icon: User }, { name: 'Account Settings', path: '/student/settings', Icon: Settings }];
export function Logout() { const [busy, setBusy] = useState(false), [error, setError] = useState(''), router = useRouter(); return <><button type="button" className={styles.navLink} disabled={busy} onClick={async () => { setBusy(true); setError(''); try {
    const response = await fetch('/api/student/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    if (!response.ok)
        throw Error('Unable to sign out. Please retry.');
    router.replace('/student/login');
    router.refresh();
}
catch (e) {
    setError(e instanceof Error ? e.message : 'Unable to sign out.');
    setBusy(false);
} }}><LogOut aria-hidden="true"/>{busy ? 'Signing out...' : 'Logout'}</button>{error && <p role="alert" className={styles.error}>{error}</p>}</>; }
export default function Sidebar() { const path = usePathname(), [open, setOpen] = useState(false); return <aside className={styles.sidebar}><button className={styles.mobileMenu} aria-expanded={open} aria-controls="student-navigation" onClick={() => setOpen(!open)}><Menu aria-hidden="true"/>Portal navigation</button><nav id="student-navigation" aria-label="Student navigation" className={styles.navBody + ' ' + (open ? styles.navOpen : '')}>{links.map(({ name, path: href, Icon }, i) => <div key={href}>{(i === 0 || name === 'My Profile') && <p className={styles.navHeading}>{i === 0 ? 'Main' : 'Account'}</p>}<Link href={href} className={styles.navLink} aria-current={path === href || path.startsWith(href + '/') ? 'page' : undefined} onClick={() => setOpen(false)}><Icon aria-hidden="true"/>{name}</Link></div>)}<Logout /></nav></aside>; }
