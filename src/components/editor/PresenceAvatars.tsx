"use client";

import type { AwarenessUser } from "@/lib/collab/awareness";
import { contrastTextColor } from "@/lib/collab/colors";

type PresenceAvatarsProps = {
  users?: AwarenessUser[];
  maxVisible?: number;
  /** Show tiny role chip on each avatar */
  showRole?: boolean;
};

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    const w = parts[0]!;
    return w.slice(0, 2).toUpperCase();
  }
  return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
}

function roleLabel(role: string | undefined): string | null {
  if (!role) return null;
  const r = role.toLowerCase();
  if (r === "owner") return "Own";
  if (r === "editor") return "Ed";
  if (r === "viewer") return "View";
  return role.slice(0, 3);
}

export function PresenceAvatars({
  users = [],
  maxVisible = 5,
  showRole = true,
}: PresenceAvatarsProps) {
  if (users.length === 0) {
    return (
      <div
        className="flex h-8 items-center rounded-full border border-white/50 bg-white/40 px-3 text-caption text-on-surface-variant backdrop-blur-sm"
        aria-label="No collaborators online"
      >
        Solo
      </div>
    );
  }

  const visible = users.slice(0, maxVisible);
  const overflow = Math.max(users.length - visible.length, 0);

  return (
    <div className="flex items-center -space-x-2" aria-label="Collaborators">
      {visible.map((person, index) => {
        const role = showRole ? roleLabel(person.role) : null;
        const fg = contrastTextColor(person.color);
        const title = person.role
          ? `${person.name} (${person.role})${person.isSelf ? " · you" : ""}`
          : `${person.name}${person.isSelf ? " · you" : ""}`;

        return (
          <div
            key={`${person.clientId}-${person.id}`}
            className="relative"
            style={{ zIndex: visible.length - index }}
            title={title}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 text-caption font-bold shadow-sm"
              style={{
                backgroundColor: person.color,
                color: fg,
                boxShadow: `0 0 0 2px ${person.color}66`,
              }}
            >
              {initialsFor(person.name)}
            </div>
            {role ? (
              <span
                className="absolute -bottom-0.5 -right-0.5 rounded-sm border border-white/70 bg-surface-container-lowest/90 px-0.5 text-[9px] font-semibold uppercase leading-none text-on-surface backdrop-blur-sm"
                aria-hidden
              >
                {role}
              </span>
            ) : null}
          </div>
        );
      })}
      {overflow > 0 ? (
        <div
          className="z-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 bg-surface-container-high/90 text-caption font-bold text-on-surface-variant backdrop-blur-sm"
          title={`${overflow} more`}
        >
          +{overflow}
        </div>
      ) : null}
    </div>
  );
}
