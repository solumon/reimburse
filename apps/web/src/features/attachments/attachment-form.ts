import type { ClockMetadata } from '@reimburse/shared';

export interface PendingAttachment {
  file: File;
  metadata: ClockMetadata;
  url: string;
}

export function emptyClockMetadata(): ClockMetadata {
  return { earliest: '', hours: null, latest: '', workDate: '' };
}
