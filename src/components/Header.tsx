"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

type HeaderProps = {
  active?: "share" | "settings" | "none";
  /** Dark chrome for the editor workspace */
  variant?: "light" | "dark";
};

export function Header({ active = "none", variant = "light" }: HeaderProps) {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dark = variant === "dark";

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  const linkIdle = dark
    ? "text-[14px] font-medium text-[#858585] transition-colors hover:text-[#cccccc]"
    : "font-medium text-on-surface-variant transition-colors hover:text-primary";
  const linkActive = dark
    ? "text-[14px] font-semibold text-[#cccccc]"
    : "border-b-2 border-primary pb-1 font-bold text-primary";

  return (
    <header
      className={
        dark
          ? "sticky top-0 z-50 w-full border-b border-[#2f2f2f] bg-[#252526]"
          : "sticky top-0 z-50 w-full border-b border-white/10 bg-surface/70 shadow-sm backdrop-blur-xl"
      }
    >
      <div className="mx-auto flex w-full max-w-full items-center justify-between gap-3 px-3 py-3 sm:px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link
            href="/"
            className={
              dark
                ? "shrink-0 font-display text-[17px] font-bold tracking-tight text-[#cccccc]"
                : "shrink-0 text-headline-lg font-black tracking-tighter text-primary"
            }
          >
            Let&apos;sShare
          </Link>
          <nav
            className="hidden items-center gap-5 md:flex"
            aria-label="Primary"
          >
            <Link
              href="/editor"
              className={active === "share" ? linkActive : linkIdle}
            >
              ShareCode
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {!dark ? (
            <Link
              href="/settings"
              className={`hidden md:inline-flex ${active === "settings" ? linkActive : linkIdle}`}
            >
              Settings
            </Link>
          ) : null}

          {loading ? (
            <span
              className={`hidden text-[13px] md:inline-flex ${dark ? "text-[#858585]" : "text-on-surface-variant"}`}
            >
              …
            </span>
          ) : user ? (
            <button
              type="button"
              onClick={() => void logout()}
              className={`hidden text-[13px] md:inline-flex ${linkIdle}`}
            >
              Log out
            </button>
          ) : (
            <Link href="/login" className={`hidden md:inline-flex ${linkIdle}`}>
              Login
            </Link>
          )}

          <div className="relative md:hidden" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className={
                dark
                  ? "inline-flex items-center justify-center rounded-md border border-[#3c3c3c] p-2 text-[#cccccc]"
                  : "inline-flex items-center justify-center rounded-full border border-white/20 bg-white/50 p-2.5 text-on-surface"
              }
              aria-expanded={menuOpen}
              aria-controls="mobile-nav-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <span className="material-symbols-outlined text-[22px]">
                {menuOpen ? "close" : "menu"}
              </span>
            </button>

            {menuOpen ? (
              <nav
                id="mobile-nav-menu"
                className={
                  dark
                    ? "absolute right-0 top-full z-50 mt-2 flex min-w-[11rem] flex-col overflow-hidden rounded-md border border-[#3c3c3c] bg-[#252526] py-1"
                    : "glass-panel absolute right-0 top-full z-50 mt-2 flex min-w-[11rem] flex-col overflow-hidden rounded-xl py-1 shadow-[0_16px_40px_rgba(29,29,31,0.12)]"
                }
              >
                <Link
                  href="/editor"
                  onClick={closeMenu}
                  className={
                    dark
                      ? "px-4 py-2.5 text-[14px] text-[#cccccc] hover:bg-[#3c3c3c]"
                      : "px-4 py-2.5 text-label-md text-on-surface hover:bg-surface-container-high/60"
                  }
                >
                  ShareCode
                </Link>
                {!dark ? (
                  <Link
                    href="/settings"
                    onClick={closeMenu}
                    className="px-4 py-2.5 text-label-md text-on-surface hover:bg-surface-container-high/60"
                  >
                    Settings
                  </Link>
                ) : null}
                {!user && !loading ? (
                  <Link
                    href="/login"
                    onClick={closeMenu}
                    className={
                      dark
                        ? "border-t border-[#3c3c3c] px-4 py-2.5 text-[14px] text-[#cccccc] hover:bg-[#3c3c3c]"
                        : "border-t border-outline-variant/30 px-4 py-2.5 text-label-md text-on-surface hover:bg-surface-container-high/60"
                    }
                  >
                    Login
                  </Link>
                ) : null}
                {user ? (
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      void logout();
                    }}
                    className={
                      dark
                        ? "border-t border-[#3c3c3c] px-4 py-2.5 text-left text-[14px] text-[#858585] hover:bg-[#3c3c3c]"
                        : "border-t border-outline-variant/30 px-4 py-2.5 text-left text-label-md text-on-surface-variant hover:bg-surface-container-high/60"
                    }
                  >
                    Log out
                  </button>
                ) : null}
              </nav>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
