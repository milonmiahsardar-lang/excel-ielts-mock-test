import { requirePage } from '@/lib/results/auth';
import { registrations, slots, today } from '@/lib/mock-bookings/service';
import MockBookingsAdmin from './MockBookingsAdmin';
export default async function Page() { await requirePage('admin'); return <MockBookingsAdmin slots={slots(true)} registrations={registrations()} today={today()}/>; }
