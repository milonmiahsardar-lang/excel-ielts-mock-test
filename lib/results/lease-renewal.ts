import { retryDelay } from './reliability';

type Grant={leaseExpiresAt?:number;serverNow?:number;stage?:string};
type Entry<T>={pending?:Promise<T>;value?:T;confirmedAt:number;expiresAt:number;roundTrip:number;failures:number;retryAt:number;error?:unknown;paused:boolean;generation:number;lastForce:number};

// One coordinator per browser document; keys include attempt, tab and candidate.
// This coordinates ownership checks, never serializes ordinary exam requests.
export function createLeaseCoordinator<T extends Grant>(options:{now:()=>number;retryable:(error:unknown)=>boolean;random?:()=>number}){
 const entries=new Map<string,Entry<T>>();
 const entry=(key:string)=>{let value=entries.get(key);if(!value){value={confirmedAt:-Infinity,expiresAt:0,roundTrip:0,failures:0,retryAt:0,paused:false,generation:0,lastForce:-Infinity};entries.set(key,value);}return value;};
 const fresh=(e:Entry<T>,now:number)=>!!e.value&&now-e.confirmedAt<5000&&e.expiresAt-now>e.roundTrip+3000;
 const run=(key:string,action:(valid:()=>boolean)=>Promise<T>,force=false):Promise<T>=>{
  const e=entry(key),now=options.now();
  if(e.pending)return e.pending;
  if(force&&now-e.lastForce<1000){if(e.error)return Promise.reject(e.error);if(e.value)return Promise.resolve(e.value);}
  if(!force&&e.error&&(e.paused||now<e.retryAt))return Promise.reject(e.error);
  if(!force&&fresh(e,now))return Promise.resolve(e.value!);
  if(force){e.lastForce=now;e.failures=0;e.paused=false;e.error=undefined;e.retryAt=0;e.generation++;}
  const generation=e.generation,started=now,valid=()=>generation===e.generation;
  e.pending=Promise.resolve().then(()=>action(valid)).then(value=>{
   if(!valid())throw e.error??new Error('Ownership changed while renewing the test tab.');
   const received=options.now();e.value=value;e.confirmedAt=received;e.roundTrip=Math.max(0,received-started);
   // The request start is a conservative bound on the server grant time. Never
   // credit the response's transport delay as additional authorized lease time.
   const ttl=typeof value.leaseExpiresAt==='number'&&typeof value.serverNow==='number'?Math.max(0,Math.min(20000,value.leaseExpiresAt-value.serverNow)):0;
   e.expiresAt=ttl>0?started+ttl:0;e.failures=0;e.retryAt=0;e.error=undefined;e.paused=false;return value;
  }).catch(error=>{
   if(valid()){e.error=error;e.value=undefined;e.expiresAt=0;e.failures++;e.paused=!options.retryable(error)||e.failures>=8;e.retryAt=options.now()+retryDelay(e.failures,options.random);}
   throw e.error??error;
  }).finally(()=>{e.pending=undefined;});
  return e.pending;
 };
 return {
  run,
  needsRenewal(key:string){const e=entries.get(key);return !!e&&(!!e.error||e.expiresAt-options.now()<=Math.max(1000,e.roundTrip+1000));},
  invalidate(key:string,error:unknown){const e=entry(key);e.generation++;e.value=undefined;e.expiresAt=0;e.error=error;e.paused=true;},
  error(key:string){return entries.get(key)?.error;},
  delay(key:string,fallback:number,failures:number){const e=entries.get(key);if(!e)return fallback;if(failures||e.error)return Math.max(fallback,Math.max(0,e.retryAt-options.now()));if(!e.expiresAt)return fallback;return Math.max(0,Math.min(fallback,e.expiresAt-options.now()-(e.roundTrip+3000)));},
  snapshot(key:string){const e=entries.get(key);return e?{pending:!!e.pending,failures:e.failures,paused:e.paused,expiresAt:e.expiresAt,retryAt:e.retryAt,roundTrip:e.roundTrip}:null;}
 };
}
