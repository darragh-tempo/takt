"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#F8FAFC" }}
    >
      <div
        className="w-full max-w-md rounded-xl p-8"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          boxShadow:
            "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
        }}
      >
        {/* Wordmark */}
        <p
          className="text-2xl font-semibold text-center"
          style={{ color: "#0D9488" }}
        >
          Takt
        </p>

        {/* Subtitle */}
        <p
          className="mt-2 text-sm text-center"
          style={{ color: "#64748B" }}
        >
          Sign in to your account
        </p>

        {/* Form */}
        <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium uppercase tracking-wide mb-1.5"
              style={{ color: "#64748B" }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                color: "#0F172A",
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = "1px solid #0D9488";
                e.currentTarget.style.boxShadow =
                  "0 0 0 2px rgba(13,148,136,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = "1px solid #E2E8F0";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium uppercase tracking-wide mb-1.5"
              style={{ color: "#64748B" }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                color: "#0F172A",
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = "1px solid #0D9488";
                e.currentTarget.style.boxShadow =
                  "0 0 0 2px rgba(13,148,136,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = "1px solid #E2E8F0";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Error */}
          {error ? (
            <p className="text-sm mt-3" style={{ color: "#EF4444" }}>
              {error}
            </p>
          ) : null}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 rounded-lg py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed"
            style={
              loading
                ? { backgroundColor: "#E2E8F0", color: "#94A3B8" }
                : { backgroundColor: "#0D9488", color: "#FFFFFF" }
            }
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = "#0F766E";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.backgroundColor = "#0D9488";
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Footer note */}
        <p
          className="mt-6 text-sm text-center"
          style={{ color: "#64748B" }}
        >
          Don&rsquo;t have an account?{" "}
          <span style={{ color: "#0D9488" }} className="hover:underline cursor-default">
            Contact your TEMPO coach
          </span>
        </p>
      </div>
    </div>
  );
}
