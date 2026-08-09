"use client";

import Link from "next/link";

type DashboardToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
};

export function DashboardToolbar({
  query,
  onQueryChange,
}: DashboardToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <label className="relative block min-w-0 flex-1 sm:max-w-md">
        <span className="sr-only">Search shares</span>
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px]">search</span>
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by title, language, or code…"
          className="w-full rounded-xl border border-outline-variant/40 bg-white/60 py-3 pl-12 pr-4 text-body-md text-on-surface outline-none backdrop-blur-sm transition-[border-color,box-shadow] placeholder:text-on-surface-variant/70 focus:border-secondary focus:shadow-[0_0_0_3px_rgba(182,208,255,0.45)]"
        />
      </label>

      <Link
        href="/share"
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary-container px-6 py-3 text-label-md text-on-primary shadow-[0_4px_14px_0_rgba(29,29,31,0.1)] transition-transform duration-300 ease-out hover:scale-[1.02] active:scale-95"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        New share
      </Link>
    </div>
  );
}
