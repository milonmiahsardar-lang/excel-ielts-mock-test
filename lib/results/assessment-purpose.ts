export type AssessmentPurpose="fresh"|"repeat"|"legacy";
export function purposeOf(row:{purpose?:unknown}):AssessmentPurpose {return row.purpose==="fresh"||row.purpose==="repeat"?row.purpose:"legacy";}
export function purposeLabel(purpose:AssessmentPurpose){return purpose==="repeat"?"Repeat practice":purpose==="fresh"?"Fresh assessment":"Previous assignment";}
