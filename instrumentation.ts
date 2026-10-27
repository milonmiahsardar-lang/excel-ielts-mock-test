export async function register(){
 if(process.env.NEXT_RUNTIME==="nodejs"&&process.env.NEXT_PHASE!=="phase-production-build"){
  const {startMaintenance}=await import("./lib/results/maintenance");startMaintenance();
  const {startRuntimeDiagnostics}=await import("./lib/results/runtime-diagnostics");startRuntimeDiagnostics();
 }
}
