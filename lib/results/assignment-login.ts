import "server-only";
import { ownAssignments } from "./assignments";
import { modeOf, modePath, type TestMode } from "./modes";
import type { User } from "./types";

// A homepage test card has no module selection. Authenticate independently of
// stale full-mock assignments, then use only a currently startable assignment.
// Unfinished attempts stay locked and must still be reassigned by an admin.
export function loginDestination(user:User,test:number,requestedMode:TestMode) {
 const ready=ownAssignments(user).filter(row=>Number(row.test_id)===test&&Number(row.attempts_used)<Number(row.attempt_limit)&&
  (row.status==="ASSIGNED"||(row.status==="IN_PROGRESS"&&row.active_stage==="NOT_STARTED")));
 const selected=ready.find(row=>modeOf(row)===requestedMode)??(ready.length===1?ready[0]:undefined);
 return selected?modePath(`/confirm?test=${test}`,modeOf(selected)):"/candidate";
}
