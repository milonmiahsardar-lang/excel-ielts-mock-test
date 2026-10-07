import { requirePage } from "@/lib/results/auth";
export default async function ConfirmLayout({children}:{children:React.ReactNode}) {await requirePage("student");return children;}
