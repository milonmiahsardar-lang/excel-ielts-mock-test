import { requireStudent } from '@/lib/student/auth';
import Sidebar from '../components/Sidebar';
import styles from '../portal.module.css';
export default async function PrivateLayout({ children }: {
    children: React.ReactNode;
}) { await requireStudent(); return <div className={styles.shell}><Sidebar /><main className={styles.main}>{children}</main></div>; }
