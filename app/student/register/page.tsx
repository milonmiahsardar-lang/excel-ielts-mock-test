import { currentStudent } from '@/lib/student/auth';
import { redirect } from 'next/navigation';
import StudentForm from '../components/Forms';
import { PageHeading } from '../components/UI';
import styles from '../portal.module.css';
export default async function Page() { if (await currentStudent())
    redirect('/student/dashboard'); return <main className={styles.auth + ' ' + styles.authWide}><section className={styles.card}><PageHeading label="Excel Institute" title="Create your student account" description="Your next step towards confident English starts here."/><StudentForm mode="register"/></section></main>; }
