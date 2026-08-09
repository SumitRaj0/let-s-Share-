"use client";

import { PresenceAvatars } from "@/components/editor/PresenceAvatars";
import type { AwarenessUser } from "@/lib/collab/awareness";

type PresenceBarProps = {
  users?: AwarenessUser[];
  onlineCount?: number;
  maxVisible?: number;
  className?: string;
};

/**
 * Compact glass strip: “N online” + overlapping avatar stack.
 */
export function PresenceBar({
  users = [],
  onlineCount,
  maxVisible = 4,
  className = "",
}: PresenceBarProps) {
  const count = onlineCount ?? users.length;
  const label =
    count === 0 ? "Offline" : count === 1 ? "1 online" : `${count} online`;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/45 px-2.5 py-1 shadow-sm backdrop-blur-md ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <PresenceAvatars users={users} maxVisible={maxVisible} />
      <span className="pr-1 text-caption font-medium tabular-nums text-on-surface-variant">
        {label}
      </span>
    </div>
  );
}
