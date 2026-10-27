import Link from 'next/link';
import { BookOpen, ArrowUpRight,Pencil,Headphones,MessageCircle,Layers,FileText,GraduationCap } from 'lucide-react';
import type {Category} from '@/lib/learning/types';
import styles from '../portal.module.css';
export function PageHeading({ label, title, description }: {
    label: string;
    title: string;
    description?: string;
}) { return <><p className={styles.eyebrow}>{label}</p><h1 className={styles.title}>{title}</h1>{description && <p className={styles.lead}>{description}</p>}</>; }
export function CategoryCard({ category }: {
    category: Category;
}) { const Icon=({book:BookOpen,pen:Pencil,headphones:Headphones,message:MessageCircle,layers:Layers,file:FileText,graduation:GraduationCap} as Record<string,typeof BookOpen>)[category.icon]||BookOpen;return <Link href={'/student/practice/' + category.slug} className={styles.card + ' ' + styles.cardLink}><span className={styles.icon}><Icon aria-hidden="true"/></span><h2>{category.name}</h2><p>{category.description}</p><span className={styles.subtle}>{category.topics.length} topics</span><span style={{ float: 'right', color: '#780c25' }}><ArrowUpRight size={20} aria-hidden="true"/></span></Link>; }
export function EmptyState({ title, description }: {
    title: string;
    description: string;
}) { return <div className={styles.empty}><h2>{title}</h2><p>{description}</p></div>; }
export function ProgressMeter({ value, label }: {
    value: number | null;
    label: string;
}) { return <div><p>{label}: {value === null ? 'No data yet' : value + '%'}</p>{value !== null && <progress className={styles.progress} value={value} max={100} aria-label={label}/>}</div>; }
export function ActivityChart({ title, points }: {
    title: string;
    points: {
        label: string;
        value: number;
    }[];
}) { const max = Math.max(1, ...points.map(p => p.value)); return <section className={styles.card}><h2>{title}</h2>{!points.length ? <p>No activity recorded in this period.</p> : <ul className={styles.chart} aria-label={title}>{points.map(p => <li key={p.label}><span>{p.label}</span><span className={styles.barTrack}><span className={styles.bar} style={{ width: (p.value / max * 100) + '%' }}/></span><span>{p.value}</span></li>)}</ul>}</section>; }
export const dateLabel = (iso: string) => new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short' });
