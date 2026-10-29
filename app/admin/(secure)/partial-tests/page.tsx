import { requirePage } from '@/lib/results/auth';
import { registrations, slots, today } from '@/lib/partial-tests/service';
import PartialTestsAdmin from './PartialTestsAdmin';
export default async function Page() { await requirePage('admin'); return <PartialTestsAdmin slots={slots(true)} registrations={registrations()} today={today()}/>; }
