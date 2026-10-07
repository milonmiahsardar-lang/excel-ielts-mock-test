import { requirePage } from "@/lib/results/auth";
import TestHighlighter from "@/lib/highlighting/TestHighlighter";
export default async function StudentTestLayout({children}:{children:React.ReactNode}) {const student=await requirePage("student");return <TestHighlighter candidateId={student.id}>{children}</TestHighlighter>;}
