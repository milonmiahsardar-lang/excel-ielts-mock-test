import type { Answers, Criteria, KeyConfig, SkillResult } from "./types";
export const normalize = (value: string) => { const normalized=value.normalize("NFKC").trim().toLocaleLowerCase("en").replace(/[’‘]/g,"'").replace(/\s*\/\s*/g," / ").replace(/\s+/g," ");return /^[a-g](?:\s*,\s*[a-g])+$/.test(normalized)?normalized.split(",").map(v=>v.trim()).sort().join(","):normalized; };
export const wordCount = (value: string) => value.trim() ? value.trim().split(/\s+/u).length : 0;
export const halfBand = (value: number) => Math.round((value + Number.EPSILON) * 2) / 2;
export function writingBands(task1: Criteria, task2: Criteria) {
  const average=(task: Criteria)=>(task.achievement+task.coherence+task.vocabulary+task.grammar)/4;
  const first=average(task1),second=average(task2);
  return { task1Band: halfBand(first), task2Band: halfBand(second), overall: halfBand((first+2*second)/3) };
}
// Configurable mock-test conversions; official raw-score boundaries vary by paper.
export const defaultBands = [{minimum:39,band:9},{minimum:37,band:8.5},{minimum:35,band:8},{minimum:32,band:7.5},{minimum:30,band:7},{minimum:26,band:6.5},{minimum:23,band:6},{minimum:18,band:5.5},{minimum:16,band:5},{minimum:13,band:4.5},{minimum:10,band:4},{minimum:8,band:3.5},{minimum:6,band:3},{minimum:4,band:2.5},{minimum:3,band:2},{minimum:2,band:1.5},{minimum:1,band:1},{minimum:0,band:0}];
export function score(answers: Answers, config: KeyConfig | null): SkillResult {
  const ready=!!config?.approved && Array.from({length:40},(_,i)=>config.questions[String(i+1)]?.accepted.length).every(Boolean);
  const questions: SkillResult["questions"]=Array.from({length:40},(_,i)=>{
    const number=i+1,answer=answers[number] || "",rule=config?.questions[number];
    const correct=!!rule && rule.accepted.some(a=>normalize(a)===normalize(answer)) && (!rule.maxWords || wordCount(answer)<=rule.maxWords);
    return {number,answer,accepted:rule?.accepted || [],status:!answer.trim()?"unanswered":!ready?"pending":correct?"correct":"incorrect"};
  });
  if(ready) for(const group of config!.groups){
    const rules=group.map(n=>config!.questions[n]);
    const assigned=new Map<number,number>(),seen=new Set<string>();
    // Maximum matching handles overlapping accepted alternatives without making
    // the mark depend on the order in which the candidate selected answers.
    const match=(number:number,visited:Set<number>):boolean=>{
      const row=questions[number-1];
      for(let i=0;i<rules.length;i++){
        const rule=rules[i];
        if(visited.has(i)||!rule.accepted.some(a=>normalize(a)===normalize(row.answer))||(rule.maxWords&&wordCount(row.answer)>rule.maxWords))continue;
        visited.add(i);const previous=assigned.get(i);
        if(previous===undefined||match(previous,visited)){assigned.set(i,number);return true;}
      }
      return false;
    };
    for(const number of group){
      const row=questions[number-1];row.accepted=group.flatMap(n=>config!.questions[n].accepted);
      if(!row.answer.trim())continue;
      row.status="incorrect";const answer=normalize(row.answer);
      if(!seen.has(answer)){seen.add(answer);match(number,new Set());}
    }
    for(const number of assigned.values())questions[number-1].status="correct";
  }
  const raw=ready?questions.filter(q=>q.status==="correct").length:null;
  const band=raw===null?null:[...config!.bands].sort((a,b)=>b.minimum-a.minimum).find(b=>raw>=b.minimum)?.band ?? null;
  return {raw,band,questions};
}
