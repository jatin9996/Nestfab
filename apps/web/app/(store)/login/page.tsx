"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import type { AuthUser } from "@/lib/types";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const setSession = useAuth((state) => state.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  return (
    <div className="container-page grid place-items-center py-16">
      <form
        className="card w-full max-w-md p-8"
        onSubmit={async (event) => {
          event.preventDefault();
          setPending(true);
          setError("");
          try {
            const result = await api<{ token: string; user: AuthUser }>("/api/auth/login", {
              method: "POST",
              body: JSON.stringify({ email, password }),
            });
            setSession(result.token, result.user);
            const next = params.get("next");
            const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
            router.push(safe || (result.user.role === "ADMIN" ? "/admin" : "/account"));
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not sign in");
          } finally {
            setPending(false);
          }
        }}
      >
        <p className="eyebrow">Account</p>
        <h1 className="mt-3 font-serif text-4xl">Sign in</h1>
        <label className="mt-6 block">
          <span className="label">Email</span>
          <input className="field" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="mt-4 block">
          <span className="label">Password</span>
          <input className="field" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error ? <p className="mt-4 text-sm text-copper-deep">{error}</p> : null}
        <button className="btn-primary mt-6 w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
        <p className="mt-4 text-sm text-ink-soft">
          New here?{" "}
          <Link href="/register" className="link-underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container-page py-16 text-ink-soft">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
