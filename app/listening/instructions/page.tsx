import {existsSync} from "node:fs";
import {resolve} from "node:path";
import TestClient from "./TestClient";
import { accessError, AccessDenied, type TestQuery } from "@/lib/results/TestAccess";
export default async function Page({searchParams}:{searchParams:Promise<TestQuery>}) {
  const query=await searchParams,message=await accessError(query,"instructions");
  return message?<AccessDenied message={message}/>:<TestClient key={String(query.test??"1")} videos={{listening:existsSync(resolve("public/videos/listening-instructions.mp4")),reading:existsSync(resolve("public/videos/reading-instructions.mp4")),writing:existsSync(resolve("public/videos/writing-instructions.mp4"))}}/>;
}
