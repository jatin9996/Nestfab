"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import type { AuthUser } from "@/lib/types";

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuth((state) => state.setSession);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
            const result = await api<{ token: string; user: AuthUser }>("/api/auth/register", {
              method: "POST",
              body: JSON.stringify({ name, email, phone, password }),
            });
            setSession(result.token, result.user);
            router.push("/account");
          } catch (err) {
            setError(err instanceof ApiError ? err.message : "Could not create the account");
          } finally {
            setPending(false);
          }
        }}
      >
        <p className="eyebrow">Account</p>
        <h1 className="mt-3 font-serif text-4xl">Create an account</h1>
        <label className="mt-6 block">
          <span className="label">Name</span>
          <input className="field" required value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="mt-4 block">
          <span className="label">Email</span>
          <input className="field" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="mt-4 block">
          <span className="label">Mobile</span>
          <input className="field" pattern="[6-9][0-9]{9}" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </label>
        <label className="mt-4 block">
          <span className="label">Password</span>
          <input className="field" type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error ? <p className="mt-4 text-sm text-copper-deep">{error}</p> : null}
        <button className="btn-primary mt-6 w-full" disabled={pending}>
          {pending ? "Creating…" : "Create account"}
        </button>
        <p className="mt-4 text-sm text-ink-soft">
          Already registered?{" "}
          <Link href="/login" className="link-underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
