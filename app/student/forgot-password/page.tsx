import { currentStudent } from '@/lib/student/auth';
import { redirect } from 'next/navigation';
import StudentForm from '../components/Forms';
import { PageHeading } from '../components/UI';
import styles from '../portal.module.css';
export default async function Page() { if (await currentStudent())
    redirect('/student/dashboard'); return <main className={styles.auth + ' ' + ''}><section className={styles.card}><PageHeading label="Excel Institute" title="Forgot your password?" description="Enter your email to request a secure password reset link."/><StudentForm mode="forgot-password"/></section></main>; }
