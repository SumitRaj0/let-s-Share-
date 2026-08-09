"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import {
  getGuestDisplayName,
  setGuestDisplayName,
} from "@/lib/collab/guest";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const [guestName, setGuestName] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setGuestName(getGuestDisplayName());
  }, []);

  function handleSaveGuestName(e: FormEvent) {
    e.preventDefault();
    const next = setGuestDisplayName(guestName);
    setGuestName(next);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <Header active="settings" />
      <main className="mx-auto flex w-full max-w-[640px] flex-grow flex-col gap-8 px-margin-mobile py-10 md:px-margin-desktop md:py-16">
        <div>
          <h1 className="text-headline-lg text-primary">Settings</h1>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Preferences for how you appear in collaborative rooms.
          </p>
        </div>

        <section className="glass-panel flex flex-col gap-4 rounded-2xl p-6">
          <h2 className="text-label-md font-semibold text-on-surface">
            Display name
          </h2>
          {loading ? (
            <p className="text-body-md text-on-surface-variant">Loading…</p>
          ) : user ? (
            <div className="flex flex-col gap-2">
              <p className="text-body-md text-on-surface">{user.name}</p>
              <p className="text-caption text-on-surface-variant">
                Your account name is used in rooms while signed in. Guest name
                below applies when you are not logged in.
              </p>
            </div>
          ) : (
            <p className="text-caption text-on-surface-variant">
              Not signed in — edit your guest name for collaborative sessions.
            </p>
          )}

          <form
            onSubmit={handleSaveGuestName}
            className="mt-2 flex flex-col gap-3"
          >
            <label
              htmlFor="guest-name"
              className="text-caption font-medium text-on-surface-variant"
            >
              Guest display name
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                id="guest-name"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                maxLength={40}
                className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-low px-4 py-2.5 text-body-md text-on-surface outline-none transition-shadow focus:ring-1 focus:ring-primary/20"
                placeholder="Guest name"
              />
              <button
                type="submit"
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary-container px-5 py-2.5 text-label-md text-on-primary transition-transform hover:scale-[1.02] active:scale-95"
              >
                Save
              </button>
            </div>
            {saved ? (
              <p className="text-caption text-primary" role="status">
                Guest name saved for this browser tab.
              </p>
            ) : null}
          </form>
        </section>

        <section className="glass-panel flex flex-col gap-2 rounded-2xl p-6">
          <h2 className="text-label-md font-semibold text-on-surface">Theme</h2>
          <p className="text-body-md text-on-surface-variant">
            Light theme only for now. Dark mode is planned.
          </p>
        </section>

        <section className="flex flex-wrap items-center gap-4">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-label-md text-primary transition-colors hover:text-primary-container"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="text-label-md text-on-surface-variant transition-colors hover:text-primary"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-label-md text-primary transition-colors hover:text-primary-container"
            >
              Sign in
            </Link>
          )}
          <Link
            href="/"
            className="text-label-md text-on-surface-variant transition-colors hover:text-primary"
          >
            Home
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
