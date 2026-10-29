// Server-owned timeline: packet arrival times must not repeatedly reset the
// amount of legitimate playback time. No client timestamp participates.
export type ListeningTimeline = { version: 1; anchorAt: number; anchorPosition: number };
export function audioProgressLimit(timeline: ListeningTimeline, now: number, duration: number) {
  return Math.min(duration, timeline.anchorPosition + Math.max(0, now - timeline.anchorAt) / 1000);
}

type AudioStatus = { id: string; testId: number; stage: string; audioPosition: number; serverNow: number };
export function acceptAudioAcknowledgement(current: AudioStatus | null, incoming: AudioStatus) {
  if (!current) return true;
  if (current.id !== incoming.id || current.testId !== incoming.testId) return false;
  if (!['NOT_STARTED', 'LISTENING_ACTIVE', 'LISTENING_COMPLETED'].includes(current.stage)) return false;
  if (current.stage === 'LISTENING_COMPLETED' && incoming.stage === 'LISTENING_ACTIVE') return false;
  return incoming.audioPosition >= current.audioPosition && incoming.serverNow >= current.serverNow;
}

// Only the existing explicit restore path authorizes a seek. Ordinary playback
// does not fire seeking; a small allowance covers media timestamp rounding.
export function unauthorizedAudioSeek(position: number, lastPlayed: number) {
  return Math.abs(position - lastPlayed) > 0.25;
}
