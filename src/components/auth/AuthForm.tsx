"use client";

import type { FormEvent, ReactNode } from "react";

export type AuthFormValues = {
  name?: string;
  email: string;
  password: string;
};

type AuthFormProps = {
  mode: "login" | "signup";
  error: string | null;
  loading?: boolean;
  onSubmit: (values: AuthFormValues) => void | Promise<void>;
  footer?: ReactNode;
};

const inputClassName =
  "w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest/80 px-4 py-3 text-body-md text-on-surface outline-none transition-shadow placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/15";

const labelClassName = "mb-2 block text-label-md uppercase tracking-[0.05em] text-on-surface-variant";

export function AuthForm({
  mode,
  error,
  loading = false,
  onSubmit,
  footer,
}: AuthFormProps) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const values: AuthFormValues = {
      email: String(data.get("email") ?? "").trim(),
      password: String(data.get("password") ?? ""),
    };

    if (mode === "signup") {
      values.name = String(data.get("name") ?? "").trim();
    }

    await onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
      {mode === "signup" ? (
        <div>
          <label htmlFor="auth-name" className={labelClassName}>
            Name
          </label>
          <input
            id="auth-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            disabled={loading}
            placeholder="Your name"
            className={inputClassName}
          />
        </div>
      ) : null}

      <div>
        <label htmlFor="auth-email" className={labelClassName}>
          Email
        </label>
        <input
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={loading}
          placeholder="you@example.com"
          className={inputClassName}
        />
      </div>

      <div>
        <label htmlFor="auth-password" className={labelClassName}>
          Password
        </label>
        <input
          id="auth-password"
          name="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={6}
          disabled={loading}
          placeholder="At least 6 characters"
          className={inputClassName}
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-error-container px-4 py-3 text-caption text-on-error-container"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-primary-container px-8 py-4 text-label-md text-on-primary shadow-[0_8px_30px_rgba(29,29,31,0.12)] transition-transform duration-300 ease-out hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
      >
        {loading
          ? mode === "signup"
            ? "Creating account…"
            : "Signing in…"
          : mode === "signup"
            ? "Create account"
            : "Sign in"}
      </button>

      {footer ? <div className="pt-1 text-center text-caption text-on-surface-variant">{footer}</div> : null}
    </form>
  );
}
