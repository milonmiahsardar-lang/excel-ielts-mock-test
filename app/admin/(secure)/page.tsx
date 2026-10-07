import { requirePage } from "@/lib/results/auth";
import { redirect } from "next/navigation";
export default async function Admin(){await requirePage("admin");redirect("/admin/results");}
