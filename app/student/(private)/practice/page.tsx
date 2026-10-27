import Link from 'next/link';
import {learningCategories} from '@/lib/learning/catalog';
import { CategoryCard, PageHeading } from '../../components/UI';
import styles from '../../portal.module.css';
export default function Practice() { const categories=learningCategories(); return <><PageHeading label="My Practice" title="What would you like to work on?" description="Find your focus. Practice materials will be added to these categories soon."/><p className={styles.lead}><Link className={styles.textLink} href="/student/courses">Explore available courses</Link></p><div className={styles.grid}>{categories.map(category => <CategoryCard key={category.slug} category={category}/>)}</div></>; }
