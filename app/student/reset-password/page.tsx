import StudentForm from '../components/Forms';
import { PageHeading } from '../components/UI';
import styles from '../portal.module.css';
export default async function Page({ searchParams }: {
    searchParams: Promise<{
        token?: string;
    }>;
}) { const { token } = await searchParams; return <main className={styles.auth}><section className={styles.card}><PageHeading label="Account recovery" title="Reset your password" description="Choose a new password for your student account."/>{token && /^[a-f0-9]{64}$/.test(token) ? <StudentForm mode="reset-password" token={token}/> : <p role="alert" className={styles.error}>This reset link is invalid. Please request a new link.</p>}</section></main>; }
