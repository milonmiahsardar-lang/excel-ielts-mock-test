import { randomUUID } from "node:crypto";
import { actor, body, candidatePayload, endpoint, reject, reply } from "@/lib/results/http";
import { db, transaction } from "@/lib/results/db";
import { authorizeAttempt } from "@/lib/results/assignments";

type Context = { params: Promise<{ id: string }> };
const kinds = ["media-error", "stalled", "progress-error", "recovery-error", "play-blocked"];
const reasons = ["server-response", "timeout", "connection", "playback"];

export async function POST(request: Request, { params }: Context) {
  return endpoint(async () => {
    const user = await actor("student", request), value = await body(request), { id } = await params;
    candidatePayload(value);
    if (typeof value.kind !== "string" || typeof value.reason !== "string" || !kinds.includes(value.kind) || !reasons.includes(value.reason)) reject(400, "Invalid audio diagnostic.");
    const detail: Record<string, unknown> = { attemptId: id, kind: value.kind, reason: value.reason };
    for (const field of ["position", "duration", "mediaCode", "status", "networkState", "readyState", "retry"] as const) {
      const number = value[field];
      if (number !== null && number !== undefined) {
        if (typeof number !== "number" || !Number.isFinite(number) || number < 0 || number > 86400) reject(400, "Invalid audio diagnostic value.");
        detail[field] = number;
      }
    }
    detail.ended = value.ended === true;
    const recorded = transaction(() => {
      const row = db().prepare("SELECT * FROM attempts WHERE id=? AND student_id=?").get(id, user.id);
      if (!row) reject(404, "Attempt not found.");
      authorizeAttempt(user, row, !!row.submitted_at);
      if (value.testId !== row.test_id) reject(400, "Wrong test.");
      // Bound diagnostic traffic independently of normal answer saving.
      const count = db().prepare("SELECT COUNT(*) AS total FROM audit WHERE actor_id=? AND event='audio.diagnostic' AND created_at>?").get(user.id, new Date(Date.now() - 60000).toISOString());
      if (Number(count?.total) >= 20) return false;
      detail.testId = row.test_id;
      db().prepare("INSERT INTO audit VALUES(?,?,?,?,?)").run(randomUUID(), user.id, "audio.diagnostic", JSON.stringify(detail), new Date().toISOString());
      return true;
    });
    return reply({ recorded });
  });
}
