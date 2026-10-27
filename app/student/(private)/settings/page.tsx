import StudentForm from '../../components/Forms';
import { Logout } from '../../components/Sidebar';
import { PageHeading } from '../../components/UI';
import styles from '../../portal.module.css';
export default function Settings() { return <><PageHeading label="Account" title="Account Settings" description="Manage your student password and session."/><div className={styles.split}><section className={styles.card}><h2>Change password</h2><p>Changing your password signs out your other student sessions.</p><StudentForm mode="password"/></section><section className={styles.card}><h2>Sign out</h2><p>Sign out of the Student Portal on this device.</p><Logout /></section></div></>; }
