import { requireStudent } from '@/lib/student/auth';
import StudentForm from '../../components/Forms';
import { PageHeading, dateLabel } from '../../components/UI';
import styles from '../../portal.module.css';
export default async function Profile() { const student = await requireStudent(); return <><PageHeading label="Account" title="My Profile" description="Keep your personal information and learning goals up to date."/><section className={styles.card} style={{ maxWidth: 800 }}><p className={styles.subtle}>Joined {dateLabel(student.joinedAt)}</p><StudentForm mode="profile" student={student}/></section></>; }
