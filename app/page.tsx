"use client";

import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type FormStatus = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail) {
      setStatus("error");
      setMessage("Please enter your full name and email.");
      return;
    }

    const { error } = await supabase.from("waitlist_signups").insert({
      full_name: trimmedName,
      email: trimmedEmail,
    });

    if (error) {
      if (error.code === "23505") {
        setStatus("error");
        setMessage("That email is already on the waitlist.");
        return;
      }

      setStatus("error");
      setMessage("Something went wrong. Please try again.");
      return;
    }

    setStatus("success");
    setMessage("Thanks. You are on the waitlist.");
    setFullName("");
    setEmail("");
  };

  return (
    <div className="flex flex-col flex-1 bg-slate-50 font-sans text-slate-900">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-16 px-6 py-16 sm:px-10 sm:py-20">
        <section className="space-y-6">
          <p className="text-sm font-medium uppercase tracking-wide text-teal-700">
            Takt by TEMPO
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Meet Your New Corporate Performance Operating System.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            Takt replaces fragmented wellness perks with a managed, data-driven performance programme that employees actually follow and leadership can actually measure. 
          </p>
          <a
            className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-teal-700"
            href="#waitlist"
          >
            Join the waitlist
          </a>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">
              Structured delivery
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Employees follow clear weekly training plans instead of fragmented
              one-off initiatives.
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">
              Behavioural tracking
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Weekly check-ins capture consistent energy, stress, and adherence
              signals across teams.
            </p>
          </article>
          <article className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold text-slate-900">
              Leadership visibility
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              HR and leadership get practical, board-ready reporting on
              performance trends and programme impact.
            </p>
          </article>
        </section>

        <section
          id="waitlist"
          className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 sm:p-8"
        >
          <h2 className="text-xl font-semibold text-slate-900">
            Join the waitlist
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Get early access updates as we roll out Takt to pilot teams.
          </p>
          <form className="mt-5 grid gap-3 sm:max-w-xl" onSubmit={handleSubmit}>
            <label className="grid gap-1 text-sm text-slate-700">
              Full name
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-teal-500 focus:ring-2"
                placeholder="Jane Smith"
                autoComplete="name"
                required
              />
            </label>
            <label className="grid gap-1 text-sm text-slate-700">
              Work email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-teal-500 focus:ring-2"
                placeholder="jane@company.com"
                autoComplete="email"
                required
              />
            </label>
            <button
              type="submit"
              disabled={status === "loading"}
              className="mt-1 inline-flex w-fit items-center justify-center rounded-lg bg-teal-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {status === "loading" ? "Submitting..." : "Join the waitlist"}
            </button>
            {message ? (
              <p
                className={`text-sm ${
                  status === "success" ? "text-green-600" : "text-rose-600"
                }`}
              >
                {message}
              </p>
            ) : null}
          </form>
        </section>

        <footer className="text-sm text-slate-500">
          Pilot teams launching with Takt in 2026.
        </footer>
      </main>
    </div>
  );
}
