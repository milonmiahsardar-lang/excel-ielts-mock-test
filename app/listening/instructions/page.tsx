import TestClient from "./TestClient";
import { accessError, AccessDenied, type TestQuery } from "@/lib/results/TestAccess";
export default async function Page({searchParams}:{searchParams:Promise<TestQuery>}) {
  const query=await searchParams,message=await accessError(query,"instructions");
  return message?<AccessDenied message={message}/>:<TestClient key={String(query.test??"1")}/>;
}
