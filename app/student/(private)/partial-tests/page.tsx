import { requireStudent } from '@/lib/student/auth';
import { bookings, slots } from '@/lib/partial-tests/service';
import { PageHeading } from '../../components/UI';
import PartialTests from './PartialTests';
export default async function PartialTestsPage() {
    const student = await requireStudent();
    return <><PageHeading label="IELTS Partial Tests" title="Book your single-module test"/><PartialTests slots={slots()} bookings={bookings(student.id)}/></>;
}
