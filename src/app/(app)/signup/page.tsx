"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthForm, type AuthFormValues } from "@/components/auth/AuthForm";
import { useAuth } from "@/hooks/useAuth";

function SignupForm() {
  const router = useRouter();
  const { signup } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(values: AuthFormValues) {
    setError(null);
    setLoading(true);
    try {
      await signup(values.email, values.password, values.name ?? "");
      router.push("/share");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthForm
      mode="signup"
      error={error}
      loading={loading}
      onSubmit={handleSubmit}
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary transition-colors hover:text-primary-container"
          >
            Sign in
          </Link>
        </>
      }
    />
  );
}

export default function SignupPage() {
  return (
    <main className="relative flex min-h-full flex-grow flex-col items-center justify-center px-margin-mobile py-16 md:px-margin-desktop">
      <div className="pointer-events-none absolute -left-16 top-24 h-72 w-72 rounded-full bg-secondary-container/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-8 h-80 w-80 rounded-full bg-primary-container/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 text-center">
          <Link
            href="/"
            className="inline-block text-headline-lg font-black tracking-tighter text-primary transition-transform duration-300 ease-out hover:scale-[1.02] active:scale-95"
          >
            Let'sShare
          </Link>
          <h1 className="mt-6 text-headline-lg text-primary">Create account</h1>
          <p className="mt-3 text-body-md text-on-surface-variant">
            Join Let'sShare and start sharing code instantly.
          </p>
        </div>

        <div className="glass-panel rounded-2xl p-8 md:p-10">
          <SignupForm />
        </div>
      </div>
    </main>
  );
}
