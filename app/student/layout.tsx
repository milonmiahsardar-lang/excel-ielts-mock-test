import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import styles from './portal.module.css';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Student Portal | Excel Institute', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default function StudentLayout({ children }: {
    children: React.ReactNode;
}) { return <div className={styles.portal}><header className={styles.topbar}><Link href="/student" className={styles.brand}><Image src="/images/excel-institute-logo.jpg" alt="Excel Institute" width={120} height={42} unoptimized/><span>Student Portal</span></Link><Link href="/" className={styles.subtle}>Back to website</Link></header>{children}</div>; }
