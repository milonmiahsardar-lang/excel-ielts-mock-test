import { includesModule, modeOf, type TestSection } from "./modes";
type Row=Record<string,unknown>;
export type HistoricalExposure={skill:TestSection;certainty:"seen"|"uncertain"};
// Pure inference for old records: progress is evidence of earlier sections only
// when the attempt is a full mock. Missing/contradictory history is never fresh.
export function inferHistoricalExposure(row:Row):HistoricalExposure[]{
 const skills:TestSection[]=["listening","reading","writing"],mode=modeOf(row);
 let draft:Record<string,unknown>={};let malformed=false;
 try{const parsed=row.data?JSON.parse(String(row.data)):{};if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))malformed=true;else draft=parsed;}catch{malformed=true;}
 const allowed=skills.filter(skill=>includesModule(mode,skill));
 if(row.submitted_at)return allowed.map(skill=>({skill,certainty:"seen"}));
 const seen=new Set<TestSection>(),assumed=new Set<TestSection>();
 const addThrough=(skill:TestSection)=>{
  if(mode==="full")for(const prior of skills.slice(0,skills.indexOf(skill)))assumed.add(prior);
  if(includesModule(mode,skill))seen.add(skill);
 };
 const stage=String(row.history_stage??"");
 if(stage.startsWith("LISTENING"))addThrough("listening");
 else if(stage.startsWith("READING"))addThrough("reading");
 else if(stage==="WRITING_ACTIVE")addThrough("writing");
 else if(stage==="COMPLETED")allowed.forEach(skill=>seen.add(skill));
 if(draft.listening||Number(row.history_audio_position)>0)addThrough("listening");
 const clocks=(draft.sectionClocks&&typeof draft.sectionClocks==="object"?draft.sectionClocks:{}) as Record<string,unknown>;
 if(draft.reading||clocks.reading)addThrough("reading");
 if(draft.writingDraft||clocks.writing)addThrough("writing");
 const knownStage=["NOT_STARTED","LISTENING_ACTIVE","LISTENING_COMPLETED","READING_ACTIVE","READING_COMPLETED","WRITING_ACTIVE","COMPLETED"].includes(stage);
 const inconsistent=malformed||(mode!=="full"&&stage!=="NOT_STARTED"&&knownStage&&!stage.startsWith(mode.toUpperCase())&&stage!=="COMPLETED");
 const result:HistoricalExposure[]=[];
 for(const skill of allowed){if(seen.has(skill))result.push({skill,certainty:"seen"});else if(assumed.has(skill)||inconsistent||!knownStage)result.push({skill,certainty:"uncertain"});}
 return result;
}
