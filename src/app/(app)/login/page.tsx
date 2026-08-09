"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthForm, type AuthFormValues } from "@/components/auth/AuthForm";
import { useAuth } from "@/hooks/useAuth";

function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(values: AuthFormValues) {
    setError(null);
    setLoading(true);
    try {
      await login(values.email, values.password);
      router.push("/share");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthForm
      mode="login"
      error={error}
      loading={loading}
      onSubmit={handleSubmit}
      footer={
        <>
          New here?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary transition-colors hover:text-primary-container"
          >
            Create an account
          </Link>
        </>
      }
    />
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-full flex-grow flex-col items-center justify-center px-margin-mobile py-16 md:px-margin-desktop">
      <div className="pointer-events-none absolute -right-16 top-20 h-72 w-72 rounded-full bg-secondary-container/25 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 bottom-10 h-80 w-80 rounded-full bg-primary-container/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="inline-block text-headline-lg font-black tracking-tighter text-primary transition-transform duration-300 ease-out hover:scale-[1.02] active:scale-95"
          >
            Let'sShare
          </Link>
          <h1 className="mt-6 text-headline-lg text-primary">Welcome back</h1>
          <p className="mt-3 text-body-md text-on-surface-variant">
            Sign in to keep sharing from where you left off.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-8 md:p-10">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
