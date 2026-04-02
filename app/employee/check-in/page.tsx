"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the ISO week Monday (YYYY-MM-DD) for a given date */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = start
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

// ─── Slider ───────────────────────────────────────────────────────────────────

function RangeSlider({
  label,
  sublabel,
  value,
  onChange,
}: {
  label: string;
  sublabel: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - 1) / 9) * 100;

  return (
    <div>
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>{label}</div>
        <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{sublabel}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ flex: 1, position: "relative", height: 20, display: "flex", alignItems: "center" }}>
          {/* Track background */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: 6,
              borderRadius: 3,
              background: "#E2E8F0",
            }}
          />
          {/* Filled track */}
          <div
            style={{
              position: "absolute",
              left: 0,
              width: `${pct}%`,
              height: 6,
              borderRadius: 3,
              background: "linear-gradient(90deg, #0D9488, #14B8A6)",
              transition: "width 0.05s",
            }}
          />
          <input
            type="range"
            min={1}
            max={10}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              width: "100%",
              opacity: 0,
              height: 20,
              cursor: "pointer",
              margin: 0,
              padding: 0,
            }}
          />
          {/* Thumb */}
          <div
            style={{
              position: "absolute",
              left: `calc(${pct}% - 10px)`,
              width: 20,
              height: 20,
              borderRadius: "50%",
              background: "#FFFFFF",
              border: "2px solid #0D9488",
              boxShadow: "0 1px 4px rgba(13,148,136,0.25)",
              pointerEvents: "none",
              transition: "left 0.05s",
            }}
          />
        </div>
        <span
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Mono', 'Cascadia Code', monospace",
            fontSize: 15,
            fontWeight: 600,
            color: "#0D9488",
            minWidth: 20,
            textAlign: "right",
          }}
        >
          {value}
        </span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 10, color: "#94A3B8" }}>1</span>
        <span style={{ fontSize: 10, color: "#94A3B8" }}>10</span>
      </div>
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────────────────────

function Stepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, userSelect: "none" }}>
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        aria-label="Decrease"
        style={{
          width: 44,
          height: 44,
          borderRadius: "8px 0 0 8px",
          border: "1px solid #E2E8F0",
          background: "#FFFFFF",
          cursor: value === 0 ? "not-allowed" : "pointer",
          fontSize: 20,
          color: value === 0 ? "#CBD5E1" : "#0D9488",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          outline: "none",
          transition: "background 0.1s",
        }}
      >
        −
      </button>
      <div
        style={{
          width: 56,
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderTop: "1px solid #E2E8F0",
          borderBottom: "1px solid #E2E8F0",
          fontFamily: "'JetBrains Mono', 'Fira Mono', monospace",
          fontSize: 20,
          fontWeight: 700,
          color: "#0F172A",
          background: "#FAFAFA",
        }}
      >
        {value}
      </div>
      <button
        onClick={() => onChange(Math.min(7, value + 1))}
        aria-label="Increase"
        style={{
          width: 44,
          height: 44,
          borderRadius: "0 8px 8px 0",
          border: "1px solid #E2E8F0",
          background: "#FFFFFF",
          cursor: value === 7 ? "not-allowed" : "pointer",
          fontSize: 20,
          color: value === 7 ? "#CBD5E1" : "#0D9488",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          outline: "none",
          transition: "background 0.1s",
        }}
      >
        +
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type PageState = "loading" | "already_submitted" | "form" | "success";

interface CultureQuestion {
  id: string;
  question_text: string;
}

export default function CheckInPage() {
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>("loading");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [cultureQuestion, setCultureQuestion] = useState<CultureQuestion | null>(null);

  // Form state
  const [sessions, setSessions] = useState(0);
  const [rpe, setRpe] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [mood, setMood] = useState(5);
  const [cultureScore, setCultureScore] = useState(5);

  const weekStart = getWeekStart(new Date());

  const init = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUserId(user.id);

    // Get company_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    const cid = profile?.company_id ?? null;
    setCompanyId(cid);

    // Check for existing check-in this week
    const { data: existing } = await supabase
      .from("check_ins")
      .select("id")
      .eq("employee_id", user.id)
      .eq("week_start", weekStart)
      .maybeSingle();

    if (existing) {
      setPageState("already_submitted");
      return;
    }

    // Load active culture question
    if (cid) {
      const { data: cq } = await supabase
        .from("culture_questions")
        .select("id, question_text")
        .eq("company_id", cid)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (cq) setCultureQuestion(cq);
    }

    setPageState("form");
  }, [router, weekStart]);

  useEffect(() => {
    init();
  }, [init]);

  async function handleSubmit() {
    if (!userId) return;
    setSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase.from("check_ins").insert({
        employee_id: userId,
        company_id: companyId,
        week_start: weekStart,
        sessions_completed: sessions,
        rpe,
        energy_level: energy,
        stress_level: stress,
        mood_score: mood,
        culture_question_id: cultureQuestion?.id ?? null,
        culture_score: cultureQuestion ? cultureScore : null,
        submitted_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      setPageState("success");
      setTimeout(() => setSuccessVisible(true), 10);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  // ── Render: loading ────────────────────────────────────────────────────────

  if (pageState === "loading") {
    return (
      <PageShell>
        <div style={{ textAlign: "center", padding: "48px 0", color: "#94A3B8", fontSize: 14 }}>
          Loading…
        </div>
      </PageShell>
    );
  }

  // ── Render: already submitted ──────────────────────────────────────────────

  if (pageState === "already_submitted") {
    return (
      <PageShell>
        <Card>
          <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0F172A", margin: "0 0 8px" }}>
              Already submitted
            </h2>
            <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 24px" }}>
              You&apos;ve already submitted your check-in this week. See you next Friday.
            </p>
            <button
              onClick={() => router.push("/employee")}
              style={backBtnStyle}
            >
              Back to Dashboard
            </button>
          </div>
        </Card>
      </PageShell>
    );
  }

  // ── Render: success ────────────────────────────────────────────────────────

  if (pageState === "success") {
    return (
      <PageShell>
        <Card>
          <div
            style={{
              textAlign: "center",
              padding: "16px 0 8px",
              opacity: successVisible ? 1 : 0,
              transform: successVisible ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 0.3s ease, transform 0.3s ease",
            }}
          >
            <svg
              width="52"
              height="52"
              viewBox="0 0 52 52"
              fill="none"
              style={{ marginBottom: 16 }}
            >
              <circle cx="26" cy="26" r="26" fill="#CCFBF1" />
              <path
                d="M16 26l7 7 13-13"
                stroke="#0D9488"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#0F172A", margin: "0 0 8px" }}>
              Check-in submitted
            </h2>
            <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 24px" }}>
              See you next Friday.
            </p>
            <button
              onClick={() => router.push("/employee")}
              style={backBtnStyle}
            >
              Back to Dashboard
            </button>
          </div>
        </Card>
      </PageShell>
    );
  }

  // ── Render: form ───────────────────────────────────────────────────────────

  return (
    <PageShell>
      {/* Page header */}
      <div style={{ maxWidth: 540, width: "100%", marginBottom: 24, paddingLeft: 4 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "#0F172A", margin: "0 0 6px" }}>
          Weekly Check-In
        </h1>
        <p style={{ fontSize: 14, color: "#64748B", margin: 0 }}>
          Takes less than 60 seconds. Your answers help your coach and your company.
        </p>
      </div>

      <Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

          {/* 1. Sessions completed */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "#0F172A", marginBottom: 12 }}>
              How many training sessions did you complete this week?
            </div>
            <Stepper value={sessions} onChange={setSessions} />
          </div>

          <Divider />

          {/* 2. RPE */}
          <RangeSlider
            label="How hard did your training feel this week?"
            sublabel="1 = barely moved, 10 = maximum effort"
            value={rpe}
            onChange={setRpe}
          />

          <Divider />

          {/* 3. Energy */}
          <RangeSlider
            label="How would you rate your energy levels this week?"
            sublabel="1 = exhausted, 10 = fully charged"
            value={energy}
            onChange={setEnergy}
          />

          <Divider />

          {/* 4. Stress */}
          <RangeSlider
            label="How stressed have you felt this week?"
            sublabel="1 = completely calm, 10 = extremely stressed"
            value={stress}
            onChange={setStress}
          />

          <Divider />

          {/* 5. Mood */}
          <RangeSlider
            label="How would you rate your overall mood and wellbeing?"
            sublabel="1 = struggling, 10 = thriving"
            value={mood}
            onChange={setMood}
          />

          {/* 6. Culture question (conditional) */}
          {cultureQuestion && (
            <>
              <Divider />
              <RangeSlider
                label={cultureQuestion.question_text}
                sublabel="1 = strongly disagree, 10 = strongly agree"
                value={cultureScore}
                onChange={setCultureScore}
              />
            </>
          )}

          {/* Error */}
          {error && (
            <p style={{ fontSize: 13, color: "#F97316", margin: 0 }}>{error}</p>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 8,
              border: "none",
              background: submitting ? "#CBD5E1" : "#F97316",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 500,
              cursor: submitting ? "not-allowed" : "pointer",
              transition: "background 0.15s ease",
              outline: "none",
              marginTop: 4,
            }}
            onMouseEnter={(e) =>
              !submitting && ((e.target as HTMLButtonElement).style.background = "#EA6C05")
            }
            onMouseLeave={(e) =>
              !submitting && ((e.target as HTMLButtonElement).style.background = "#F97316")
            }
          >
            {submitting ? "Submitting…" : "Submit Check-In"}
          </button>
        </div>
      </Card>
    </PageShell>
  );
}

// ─── Shared layout sub-components ─────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 16px 40px",
      }}
    >
      {/* Wordmark */}
      <div style={{ marginBottom: 28, width: "100%", maxWidth: 540 }}>
        <span
          style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: "0.12em",
            color: "#0D9488",
          }}
        >
          TAKT
        </span>
      </div>

      <div style={{ width: "100%", maxWidth: 540, flex: 1 }}>{children}</div>

      {/* Footer */}
      <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 32, letterSpacing: "0.02em" }}>
        Powered by TEMPO
      </p>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        background: "#FFFFFF",
        borderRadius: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#F1F5F9", margin: "0 -24px" }} />;
}

const backBtnStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 24px",
  borderRadius: 8,
  border: "1px solid #E2E8F0",
  background: "#FFFFFF",
  color: "#0D9488",
  fontSize: 14,
  fontWeight: 500,
  cursor: "pointer",
  outline: "none",
};
