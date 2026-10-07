import { currentUser } from "@/lib/results/auth";
import { redirect } from "next/navigation";
import AdminLoginClient from "./AdminLoginClient";
export default async function AdminLogin(){if(await currentUser("admin"))redirect("/admin/results");return <AdminLoginClient/>;}
