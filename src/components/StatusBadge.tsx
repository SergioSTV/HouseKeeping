'use client';
import { STATUS_HEX, STATUS_LABELS } from '@/lib/roles';
import type { RoomStatus } from '@/lib/types';

export function StatusBadge({ status }: { status: RoomStatus }) {
  const c = STATUS_HEX[status];
  return (
    <span
      className="inline-block rounded px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
