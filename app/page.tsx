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
    <div className="flex flex-col flex-1" style={{ backgroundColor: "#F8FAFC", color: "#0F172A" }}>

      {/* ── Navigation ── */}
      <nav
        className="sticky top-0 z-50 w-full"
        style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E2E8F0" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <span className="text-xl font-semibold tracking-tight" style={{ color: "#0F172A" }}>
            Takt
          </span>
          <a
            href="#demo"
            className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "#0D9488" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0F766E")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0D9488")}
          >
            Request Demo
          </a>
        </div>
      </nav>

      <main className="flex flex-col flex-1">

        {/* ── Hero ── */}
        <section
          className="mx-auto w-full max-w-6xl px-6 text-center"
          style={{ paddingTop: "clamp(3rem, 8vw, 6rem)", paddingBottom: "clamp(3rem, 8vw, 6rem)" }}
        >
          {/* Pill badge */}
          <div className="mb-6 flex justify-center">
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: "#F0FDFA",
                color: "#0D9488",
                border: "1px solid #CCFBF1",
              }}
            >
              Performance Infrastructure for Teams
            </span>
          </div>

          {/* Headline */}
          <h1
            className="mx-auto max-w-3xl font-semibold"
            style={{
              fontSize: "clamp(1.875rem, 5vw, 3rem)",
              color: "#0F172A",
              letterSpacing: "-0.01em",
              lineHeight: 1.15,
            }}
          >
            The performance operating system for ambitious companies.
          </h1>

          {/* Subheadline */}
          <p
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed"
            style={{ color: "#64748B" }}
          >
            Takt replaces fragmented wellness perks with a managed, data-driven
            performance programme that employees actually follow — and leadership
            can actually measure.
          </p>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#demo"
              className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: "#0D9488" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0F766E")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0D9488")}
            >
              Request Demo
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium transition-colors"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                color: "#0D9488",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F0FDFA")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
            >
              Learn more ↓
            </a>
          </div>

          {/* ── Dashboard Mockup — desktop only ── */}
          <div
            className="mx-auto mt-16 hidden max-w-5xl overflow-hidden rounded-xl sm:block"
            style={{
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              maxHeight: "440px",
              position: "relative",
            }}
          >
            {/* Browser chrome */}
            <div
              className="flex h-10 items-center px-4"
              style={{
                backgroundColor: "#F8FAFC",
                borderBottom: "1px solid #E2E8F0",
              }}
            >
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#EF4444" }} />
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#EAB308" }} />
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: "#22C55E" }} />
              </div>
              <div className="flex-1 text-center text-xs" style={{ color: "#94A3B8" }}>
                usetakt.io
              </div>
              <div className="w-14" />
            </div>

            {/* Dashboard body */}
            <div className="flex" style={{ backgroundColor: "#FFFFFF" }}>

              {/* Sidebar */}
              <div
                className="flex-shrink-0 py-6 px-4"
                style={{
                  width: "11rem",
                  backgroundColor: "#F8FAFC",
                  borderRight: "1px solid #E2E8F0",
                }}
              >
                <div
                  className="mb-5 text-lg font-semibold"
                  style={{ color: "#0D9488" }}
                >
                  Takt
                </div>
                <div className="flex flex-col gap-0.5">
                  {/* Active item */}
                  <div
                    className="flex items-center gap-2 rounded-md px-2 py-2 text-xs font-medium"
                    style={{
                      color: "#0D9488",
                      borderLeft: "2px solid #0D9488",
                      backgroundColor: "#F0FDFA",
                    }}
                  >
                    <div className="h-4 w-4 rounded" style={{ backgroundColor: "#CCFBF1" }} />
                    Dashboard
                  </div>
                  {(["Training", "Education", "Check-in", "Profile"] as const).map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-md px-2 py-2 text-xs"
                      style={{ color: "#64748B", borderLeft: "2px solid transparent" }}
                    >
                      <div className="h-4 w-4 rounded" style={{ backgroundColor: "#E2E8F0" }} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 p-6" style={{ backgroundColor: "#FFFFFF" }}>
                {/* Greeting */}
                <div className="mb-5">
                  <div className="text-lg font-semibold" style={{ color: "#0F172A" }}>
                    Good morning, Alex
                  </div>
                  <div className="mt-0.5 text-xs" style={{ color: "#64748B" }}>
                    Ready for a focused and balanced day?
                  </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-5 gap-4">

                  {/* Training plan card — spans 3 cols */}
                  <div
                    className="col-span-3 rounded-xl p-4"
                    style={{ border: "1px solid #E2E8F0" }}
                  >
                    <div className="mb-3 text-sm font-semibold" style={{ color: "#0F172A" }}>
                      Today&rsquo;s Training Plan
                    </div>
                    <div className="flex flex-col gap-3">
                      {[
                        { label: "MORNING FLOW", name: "Spinal Release Yoga" },
                        { label: "MOBILITY", name: "Hip & Glute Activation" },
                      ].map((exercise) => (
                        <div key={exercise.name} className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 flex-shrink-0 rounded-lg"
                            style={{ backgroundColor: "#CCFBF1" }}
                          />
                          <div>
                            <div
                              className="text-[10px] font-medium uppercase tracking-wide"
                              style={{ color: "#64748B" }}
                            >
                              {exercise.label}
                            </div>
                            <div className="text-xs font-medium" style={{ color: "#0F172A" }}>
                              {exercise.name}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weekly check-in card — spans 2 cols */}
                  <div
                    className="col-span-2 rounded-xl p-4"
                    style={{ backgroundColor: "#F0FDFA" }}
                  >
                    <div className="text-sm font-semibold" style={{ color: "#0D9488" }}>
                      Weekly Check-in
                    </div>
                    <div className="mt-1 text-xs" style={{ color: "#0D9488" }}>
                      Due in 2 days
                    </div>
                    <button
                      type="button"
                      className="mt-3 w-full rounded-lg text-[10px] font-medium text-white"
                      style={{
                        backgroundColor: "#0D9488",
                        paddingTop: "0.375rem",
                        paddingBottom: "0.375rem",
                      }}
                    >
                      Start Check-in
                    </button>
                  </div>
                </div>

                {/* Pulse card */}
                <div
                  className="mt-4 rounded-xl p-4"
                  style={{ border: "1px solid #E2E8F0" }}
                >
                  <div className="mb-3 text-sm font-semibold" style={{ color: "#0F172A" }}>
                    This Week&rsquo;s Pulse
                  </div>

                  {/* Movement */}
                  <div className="mb-3">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: "#64748B" }}>Movement</span>
                      <span className="text-[10px] font-medium" style={{ color: "#0D9488" }}>4/5 Days</span>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="h-1.5 flex-1 rounded-full"
                          style={{ backgroundColor: i <= 4 ? "#0D9488" : "#E2E8F0" }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Mindfulness */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: "#64748B" }}>Mindfulness</span>
                      <span className="text-[10px] font-medium" style={{ color: "#0D9488" }}>120 min</span>
                    </div>
                    <div
                      className="h-1.5 w-full rounded-full"
                      style={{ backgroundColor: "#E2E8F0" }}
                    >
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: "85%", backgroundColor: "#0D9488" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fade-out gradient at bottom */}
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0"
              style={{
                height: "80px",
                background: "linear-gradient(to top, rgba(255,255,255,0.95), transparent)",
              }}
            />
          </div>
        </section>

        {/* ── Features ── */}
        <section
          id="features"
          className="mx-auto w-full max-w-6xl px-6 py-20"
        >
          {/* Section header */}
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-wide" style={{ color: "#0D9488" }}>
              What Takt delivers
            </p>
            <h2
              className="mt-2 text-3xl font-semibold tracking-tight"
              style={{ color: "#0F172A" }}
            >
              Structure. Data. Visibility. Education.
            </h2>
          </div>

          {/* 2×2 card grid */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2">

            {/* Card 1 — Structured Training */}
            <article
              className="rounded-xl p-8"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
              }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: "#F0FDFA" }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="2" y="4" width="3" height="12" rx="1.5" fill="#0D9488" />
                  <rect x="15" y="4" width="3" height="12" rx="1.5" fill="#0D9488" />
                  <rect x="5" y="9" width="10" height="2" rx="1" fill="#0D9488" />
                  <rect x="2" y="7" width="3" height="6" rx="1.5" fill="#0D9488" opacity="0.4" />
                  <rect x="15" y="7" width="3" height="6" rx="1.5" fill="#0D9488" opacity="0.4" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold" style={{ color: "#0F172A" }}>
                Structured Training
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "#64748B" }}>
                Every employee receives a personalised training programme based on experience and
                equipment access. Real programming with progression — not generic wellness tips.
              </p>
            </article>

            {/* Card 2 — Weekly Pulse */}
            <article
              className="rounded-xl p-8"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
              }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: "#F0FDFA" }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <polyline
                    points="1,10 4,10 6,5 8,15 10,8 12,12 14,10 19,10"
                    stroke="#0D9488"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold" style={{ color: "#0F172A" }}>
                Weekly Pulse
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "#64748B" }}>
                A 60-second weekly check-in captures energy, stress, mood, and training adherence
                across your team. Consistent data that builds a clear picture over time.
              </p>
            </article>

            {/* Card 3 — Leadership Dashboard */}
            <article
              className="rounded-xl p-8"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
              }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: "#F0FDFA" }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect x="2" y="11" width="3" height="7" rx="1" fill="#0D9488" />
                  <rect x="7" y="7" width="3" height="11" rx="1" fill="#0D9488" />
                  <rect x="12" y="9" width="3" height="9" rx="1" fill="#0D9488" />
                  <rect x="17" y="4" width="3" height="14" rx="1" fill="#0D9488" opacity="0.5" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold" style={{ color: "#0F172A" }}>
                Leadership Dashboard
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "#64748B" }}>
                HR and leadership get a real-time view of team participation, engagement trends,
                and flagged individuals. Boardroom-ready data, updated weekly.
              </p>
            </article>

            {/* Card 4 — Education Modules */}
            <article
              className="rounded-xl p-8"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E2E8F0",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
              }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: "#F0FDFA" }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M3 4.5C3 3.67 3.67 3 4.5 3H13.5C14.33 3 15 3.67 15 4.5V15.5C15 16.33 14.33 17 13.5 17H4.5C3.67 17 3 16.33 3 15.5V4.5Z"
                    stroke="#0D9488"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <line x1="6" y1="7" x2="12" y2="7" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="6" y1="10" x2="12" y2="10" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="6" y1="13" x2="9" y2="13" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M13 14L15 16L18 12" stroke="#0D9488" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold" style={{ color: "#0F172A" }}>
                Education Modules
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "#64748B" }}>
                Monthly sessions covering nutrition, mindset, stress management, sleep, and healthy
                habits. Delivered in-person or online by a dedicated TEMPO performance coach.
              </p>
            </article>

          </div>
        </section>

        {/* ── Stats strip ── */}
        <section style={{ backgroundColor: "#0D9488" }}>
          <div className="mx-auto max-w-6xl px-6 py-16">
            <div className="grid gap-8 text-center sm:grid-cols-3">
              {[
                { number: "87%", label: "of workers choose employers based on wellness offerings" },
                { number: "56%", label: "fewer sick days with structured programmes" },
                { number: "$6",  label: "returned for every $1 invested in employee performance" },
              ].map((stat) => (
                <div key={stat.number} className="flex flex-col items-center">
                  <span
                    className="font-mono text-4xl font-semibold text-white"
                  >
                    {stat.number}
                  </span>
                  <span
                    className="mt-1 max-w-[200px] text-sm font-medium"
                    style={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Book a Demo ── */}
        <section
          id="demo"
          className="mx-auto w-full max-w-6xl px-6 py-24 text-center"
        >
          <h2
            className="text-4xl font-semibold tracking-tight"
            style={{ color: "#0F172A" }}
          >
            See Takt in action
          </h2>
          <p
            className="mx-auto mt-4 max-w-xl text-lg leading-relaxed"
            style={{ color: "#64748B" }}
          >
            Book a 30-minute demo and we&rsquo;ll show you how Takt works inside your team.
            No pitch deck — just the product.
          </p>
          <div className="mt-8 flex justify-center">
            <a
              href="https://calendly.com/darragh-usetakt/takt-demo-call"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg px-8 py-4 text-base font-medium text-white transition-colors"
              style={{
                backgroundColor: "#0D9488",
                boxShadow: "0 4px 12px rgba(13,148,136,0.3)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0F766E")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#0D9488")}
            >
              Book a Demo
            </a>
          </div>
          <p className="mt-4 text-sm" style={{ color: "#94A3B8" }}>
            or email us at{" "}
            <a
              href="mailto:darragh@usetakt.io"
              className="transition-colors"
              style={{ color: "#64748B" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0D9488")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
            >
              darragh@usetakt.io
            </a>
          </p>
        </section>

        {/* ── Waitlist (secondary) ── */}
        <section
          id="waitlist"
          className="mx-auto w-full max-w-6xl px-6 py-16"
        >
          <div
            className="mx-auto max-w-2xl rounded-xl p-8"
            style={{
              backgroundColor: "#FFFFFF",
              border: "1px solid #E2E8F0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
            }}
          >
            <h2 className="text-xl font-semibold" style={{ color: "#0F172A" }}>
              Want to learn more?
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "#64748B" }}>
              If you&rsquo;re not leading a team but want to stay in the loop, join the waitlist.
              Even better — share this page with your manager.
            </p>
            <form className="mt-6" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="flex-1 rounded-lg border px-4 py-3 text-sm outline-none transition-colors"
                  style={{
                    borderColor: "#E2E8F0",
                    color: "#0F172A",
                    backgroundColor: "#FFFFFF",
                  }}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="flex-1 rounded-lg border px-4 py-3 text-sm outline-none transition-colors"
                  style={{
                    borderColor: "#E2E8F0",
                    color: "#0F172A",
                    backgroundColor: "#FFFFFF",
                  }}
                  placeholder="Work email"
                  autoComplete="email"
                  required
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="whitespace-nowrap rounded-lg px-6 py-3 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed"
                  style={{ backgroundColor: status === "loading" ? "#94A3B8" : "#0D9488" }}
                  onMouseEnter={(e) => {
                    if (status !== "loading") e.currentTarget.style.backgroundColor = "#0F766E";
                  }}
                  onMouseLeave={(e) => {
                    if (status !== "loading") e.currentTarget.style.backgroundColor = "#0D9488";
                  }}
                >
                  {status === "loading" ? "Submitting..." : "Join Waitlist"}
                </button>
              </div>
              {message ? (
                <p
                  className="mt-3 text-sm"
                  style={{ color: status === "success" ? "#22C55E" : "#EF4444" }}
                >
                  {message}
                </p>
              ) : null}
            </form>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer
          className="mx-auto w-full max-w-6xl px-6 pb-12 pt-8"
          style={{ borderTop: "1px solid #E2E8F0", marginTop: "5rem" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "#64748B" }}>
              Takt by TEMPO
            </span>
            <span className="text-sm" style={{ color: "#94A3B8" }}>
              Dublin · Belfast · London
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
