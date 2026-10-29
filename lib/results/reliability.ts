// Pure coordinators, shared by browser hooks and deterministic reliability tests.
export function retryDelay(failures:number,random=Math.random){return Math.min(30000,Math.round(Math.min(30000,1000*2**Math.min(5,Math.max(0,failures-1)))*(0.8+random()*0.4)));}
export type RetryState={failures:number;exhausted:boolean;terminal:boolean};
export function createRecoveryLoop(options:{action:(manual?:boolean)=>Promise<unknown>;success:()=>void;failure:(error:unknown,state:RetryState)=>void;retryable:(error:unknown)=>boolean;interval?:number;maxFailures?:number;delay?:(fallback:number,failures:number)=>number}){
 let active=true,pending:Promise<void>|null=null,timer:ReturnType<typeof setTimeout>|undefined,failures=0,paused=false;
 const clear=()=>{if(timer!==undefined)clearTimeout(timer);timer=undefined;};
 const run=(manual=false):Promise<void>=>{if(!active)return Promise.resolve();if(pending)return pending;if(paused&&!manual)return Promise.resolve();clear();if(manual){failures=0;paused=false;}
  pending=Promise.resolve().then(()=>options.action(manual)).then(()=>{if(!active)return;failures=0;paused=false;options.success();}).catch(error=>{if(!active)return;failures++;const terminal=!options.retryable(error),exhausted=failures>=(options.maxFailures??8);paused=terminal||exhausted;options.failure(error,{failures,exhausted,terminal});}).finally(()=>{pending=null;if(active&&!paused){const fallback=failures?retryDelay(failures):options.interval??5000;timer=setTimeout(()=>void run(),options.delay?.(fallback,failures)??fallback);}});return pending;
 };
 return {run,wake(){if(failures||paused)return pending??Promise.resolve();return run();},stop(){active=false;clear();},get busy(){return pending!==null;},get failures(){return failures;}};
}
export function createSaveScheduler<T>(options:{snapshot:()=>{value:T;encoded:string};save:(value:T)=>Promise<unknown>;saved:()=>void;failed:(error:unknown)=>void;retryable:(error:unknown)=>boolean;obsolete?:(error:unknown)=>boolean;paused?:(error:unknown)=>void;now?:()=>number}){
 const now=options.now??(()=>performance.now());let active=true,busy=false,acknowledged:string|null=null,lastAttempt=now(),changedAt=now(),retryAt=0,failures=0,paused=false,terminal=false,snapshotTerminal=false,forcePending=false;
 const tick=(force=false)=>{if(!active)return;if(busy){if(force)forcePending=true;return;}const snapshot=options.snapshot();if(snapshot.encoded===acknowledged)return;if(paused)return;const time=now();if(time<retryAt)return;if(!force&&time-changedAt<650&&time-lastAttempt<5000)return;busy=true;lastAttempt=time;
  void Promise.resolve().then(()=>options.save(snapshot.value)).then(()=>{if(!active)return;acknowledged=snapshot.encoded;failures=0;retryAt=0;if(options.snapshot().encoded===snapshot.encoded)options.saved();}).catch(error=>{if(!active)return;if(options.snapshot().encoded!==snapshot.encoded&&options.obsolete?.(error)){failures=0;retryAt=0;paused=false;terminal=false;return;}failures++;terminal=!options.retryable(error);snapshotTerminal=terminal&&options.obsolete?.(error)===true;paused=terminal||failures>=8;retryAt=now()+retryDelay(failures);options.failed(error);if(paused)options.paused?.(error);}).finally(()=>{busy=false;if(active&&forcePending){forcePending=false;tick(true);}});
 };
 return {tick,resume(){if(terminal)return;paused=false;failures=0;retryAt=0;tick(true);},changed(){changedAt=now();if(paused&&(!terminal||snapshotTerminal)){paused=false;terminal=false;snapshotTerminal=false;failures=0;retryAt=0;}},stop(){active=false;},get busy(){return busy;},get paused(){return paused;}};
}
