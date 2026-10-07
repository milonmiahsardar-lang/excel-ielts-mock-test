export type Interval = [number, number];
export type Annotation = { text: string; ranges: Interval[] };
export type Annotations = Record<string, Annotation>;
export function mergeRanges(ranges: Interval[]): Interval[] {
  const result: Interval[] = [];
  for (const [start, end] of ranges.filter(([a,b]) => a >= 0 && b > a).sort((a,b) => a[0]-b[0])) {
    const last = result[result.length-1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else result.push([start,end]);
  }
  return result;
}
export function subtractRange(ranges: Interval[], [start,end]: Interval): Interval[] {
  return ranges.flatMap(([a,b]): Interval[] => b <= start || a >= end ? [[a,b]] : [ ...(a < start ? [[a,start] as Interval] : []), ...(b > end ? [[end,b] as Interval] : []) ]);
}
export function fingerprint(text: string): string {
  let a=2166136261,b=5381;
  for(let i=0;i<text.length;i++){a=Math.imul(a^text.charCodeAt(i),16777619);b=Math.imul(b,33)^text.charCodeAt(i);}
  return `${(a>>>0).toString(36)}-${(b>>>0).toString(36)}-${text.length}`;
}
export function storageKey(candidate: string, attempt: string, test: string, section: string) {
  return `ieltsHighlights:v1:${candidate}:${attempt}:${test}:${section}`;
}
export function readAnnotations(raw: string | null): Annotations {
  const result: Annotations = {};
  try {
    const value=JSON.parse(raw || "{}");
    if(!value || typeof value!=="object" || Array.isArray(value))return result;
    for(const [id,item] of Object.entries(value).slice(0,5000)) {
      const entry=item as Annotation;
      if(typeof entry?.text!=="string" || !Array.isArray(entry.ranges))continue;
      const ranges=entry.ranges.filter((r): r is Interval => Array.isArray(r)&&r.length===2&&r.every(Number.isInteger)&&r[0]>=0&&r[1]>r[0]&&r[1]<=entry.text.length).slice(0,1000);
      if(ranges.length)result[id]={text:entry.text,ranges:mergeRanges(ranges)};
    }
  } catch { /* Corrupt annotations must never prevent a test from loading. */ }
  return result;
}
