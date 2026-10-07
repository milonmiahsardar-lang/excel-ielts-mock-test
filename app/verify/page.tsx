import { currentUser } from "@/lib/results/auth";
import { redirect } from "next/navigation";
import VerifyClient from "./VerifyClient";
export default async function Verify({searchParams}:{searchParams:Promise<{submitted?:string;test?:string}>}){
 const query=await searchParams,selected=Number(query.test);
 const selectedTest=Number.isInteger(selected)&&selected>=1&&selected<=20?selected:undefined;
 if(!selectedTest&&(await currentUser("student"))?.role==="student")redirect("/candidate");
 return <VerifyClient submitted={query.submitted==="1"} selectedTest={selectedTest}/>;
}
