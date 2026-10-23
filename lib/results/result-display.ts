import { includesModule } from "./modes";
import type { Submission, Skill } from "./types";
export function skillDisplay(s:Submission,skill:Skill){return !includesModule(s.mode,skill)?"Not taken":s[skill].raw===null?"Awaiting answer key":`${s[skill].raw}/40 · Band ${s[skill].band?.toFixed(1)}`;}
export function writingDisplay(s:Submission){return !includesModule(s.mode,"writing")?"Not taken":s.marking?`Band ${s.marking.overall.toFixed(1)}`:"Awaiting Marking";}
export function resultStatus(s:Submission){
 if(includesModule(s.mode,"writing")&&!s.marking)return "Awaiting marking";
 if((["listening","reading"] as const).some(skill=>includesModule(s.mode,skill)&&s[skill].raw===null))return "Awaiting answer key";
 return "Complete";
}
