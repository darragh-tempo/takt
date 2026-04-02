"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

// ─── Types ────────────────────────────────────────────────────────────────────

type TrainingAge = "beginner" | "intermediate" | "advanced";
type EquipmentAccess = "full_gym" | "home_minimal" | "no_equipment";
type EducationTopic = "Nutrition" | "Sleep" | "Stress Management" | "Mobility" | "None";

interface FormData {
  full_name: string;
  training_age: TrainingAge | null;
  equipment_access: EquipmentAccess | null;
  has_injury: boolean | null;
  injury_details: string;
  education_interests: EducationTopic[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 6;

const trainingOptions: { label: string; value: TrainingAge; description: string }[] = [
  { label: "I'm new to this", value: "beginner", description: "No worries — we'll start with the fundamentals" },
  { label: "1–3 years", value: "intermediate", description: "You know your way around a gym" },
  { label: "3+ years", value: "advanced", description: "You train regularly and want to be pushed" },
];

const equipmentOptions: { label: string; value: EquipmentAccess; description: string }[] = [
  { label: "Full gym access", value: "full_gym", description: "Barbells, machines, cables — the works" },
  { label: "Home / limited equipment", value: "home_minimal", description: "Dumbbells, resistance bands, or a rack at home" },
  { label: "No equipment", value: "no_equipment", description: "Bodyweight only — no kit needed" },
];

const educationTopics: EducationTopic[] = ["Nutrition", "Sleep", "Stress Management", "Mobility", "None"];

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  current,
  total,
  onStepClick,
}: {
  current: number;
  total: number;
  onStepClick: (step: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < current;
        const isActive = step === current;
        const isClickable = step < current;

        return (
          <div key={step} style={{ display: "flex", alignItems: "center", flex: step < total ? 1 : undefined }}>
            <button
              onClick={() => isClickable && onStepClick(step)}
              disabled={!isClickable}
              title={`Step ${step}`}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: isActive || isCompleted ? "none" : "2px solid #E2E8F0",
                background: isActive ? "#0D9488" : isCompleted ? "#0D9488" : "#FFFFFF",
                color: isActive || isCompleted ? "#FFFFFF" : "#94A3B8",
                fontSize: 11,
                fontWeight: 600,
                cursor: isClickable ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.2s ease",
                outline: "none",
                boxShadow: isActive ? "0 0 0 3px rgba(13,148,136,0.15)" : "none",
              }}
            >
              {isCompleted ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                step
              )}
            </button>
            {step < total && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  background: isCompleted ? "#0D9488" : "#E2E8F0",
                  transition: "background 0.3s ease",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Selectable Card ──────────────────────────────────────────────────────────

function SelectCard({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "14px 16px",
        borderRadius: 8,
        border: selected ? "2px solid #0D9488" : "1px solid #E2E8F0",
        background: selected ? "#CCFBF1" : "#FFFFFF",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.15s ease",
        outline: "none",
        marginBottom: 0,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 500, color: selected ? "#0D9488" : "#0F172A", marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: selected ? "#0F766E" : "#64748B" }}>{description}</div>
    </button>
  );
}

// ─── Checkbox Item ────────────────────────────────────────────────────────────

function CheckboxItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      style={{
        width: "100%",
        padding: "12px 16px",
        borderRadius: 8,
        border: checked ? "2px solid #0D9488" : "1px solid #E2E8F0",
        background: checked ? "#CCFBF1" : "#FFFFFF",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.15s ease",
        outline: "none",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          border: checked ? "none" : "2px solid #CBD5E1",
          background: checked ? "#0D9488" : "transparent",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
        }}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: 14, fontWeight: 500, color: checked ? "#0D9488" : "#0F172A" }}>{label}</span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const [slideDir, setSlideDir] = useState<"left" | "right">("left");

  const [form, setForm] = useState<FormData>({
    full_name: "",
    training_age: null,
    equipment_access: null,
    has_injury: null,
    injury_details: "",
    education_interests: [],
  });

  // Pre-fill name from profile
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      if (data?.full_name) {
        setForm((f) => ({ ...f, full_name: data.full_name }));
      }
    }
    loadProfile();
  }, []);

  function navigate(nextStep: number) {
    const dir = nextStep > step ? "left" : "right";
    setSlideDir(dir);
    setAnimating(true);
    setTimeout(() => {
      setStep(nextStep);
      setAnimating(false);
    }, 180);
  }

  function canProceed(): boolean {
    switch (step) {
      case 1: return form.full_name.trim().length > 0;
      case 2: return form.training_age !== null;
      case 3: return form.equipment_access !== null;
      case 4: return form.has_injury !== null;
      case 5: return form.education_interests.length > 0;
      default: return true;
    }
  }

  function toggleEducation(topic: EducationTopic) {
    setForm((f) => {
      if (topic === "None") {
        return { ...f, education_interests: ["None"] };
      }
      const without = f.education_interests.filter((t) => t !== "None" && t !== topic);
      const has = f.education_interests.includes(topic);
      return { ...f, education_interests: has ? without : [...without, topic] };
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Query routing rules
      let assigned_plan: string | null = null;
      const { data: routingData } = await supabase
        .from("plan_routing_rules")
        .select("assigned_plan")
        .eq("training_age", form.training_age)
        .eq("equipment_access", form.equipment_access)
        .single();
      if (routingData) assigned_plan = routingData.assigned_plan;

      const today = new Date().toISOString().split("T")[0];

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim(),
          training_age: form.training_age,
          equipment_access: form.equipment_access,
          has_injury: form.has_injury,
          injury_details: form.has_injury ? form.injury_details || null : null,
          education_interests: form.education_interests,
          assigned_plan,
          onboarding_complete: true,
          plan_start_date: today,
          current_week: 1,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      router.push("/employee");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const trainingLabel = form.training_age
    ? trainingOptions.find((o) => o.value === form.training_age)?.label
    : null;
  const equipmentLabel = form.equipment_access
    ? equipmentOptions.find((o) => o.value === form.equipment_access)?.label
    : null;

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
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "0.12em",
            color: "#0D9488",
          }}
        >
          TAKT
        </span>
      </div>

      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "#FFFFFF",
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
          padding: 28,
          overflow: "hidden",
        }}
      >
        <ProgressBar current={step} total={TOTAL_STEPS} onStepClick={navigate} />

        {/* Step content */}
        <div
          style={{
            opacity: animating ? 0 : 1,
            transform: animating
              ? `translateX(${slideDir === "left" ? "12px" : "-12px"})`
              : "translateX(0)",
            transition: "opacity 0.18s ease, transform 0.18s ease",
          }}
        >
          {/* Step 1 */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 6, marginTop: 0 }}>
                What&apos;s your full name?
              </h2>
              <p style={{ fontSize: 13, color: "#64748B", marginBottom: 20, marginTop: 0 }}>
                Let&apos;s get to know you
              </p>
              <label style={{ fontSize: 12, color: "#64748B", fontWeight: 500, display: "block", marginBottom: 6 }}>
                Full name
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                placeholder="Enter your full name"
                onKeyDown={(e) => e.key === "Enter" && canProceed() && navigate(2)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #E2E8F0",
                  fontSize: 14,
                  color: "#0F172A",
                  background: "#FFFFFF",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#0D9488";
                  e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#E2E8F0";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 6, marginTop: 0 }}>
                How long have you been training consistently?
              </h2>
              <p style={{ fontSize: 13, color: "#64748B", marginBottom: 20, marginTop: 0 }}>
                This helps us calibrate the right intensity for you
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {trainingOptions.map((opt) => (
                  <SelectCard
                    key={opt.value}
                    label={opt.label}
                    description={opt.description}
                    selected={form.training_age === opt.value}
                    onClick={() => setForm((f) => ({ ...f, training_age: opt.value }))}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 6, marginTop: 0 }}>
                Where will you be training?
              </h2>
              <p style={{ fontSize: 13, color: "#64748B", marginBottom: 20, marginTop: 0 }}>
                We&apos;ll match your programme to what you have available
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {equipmentOptions.map((opt) => (
                  <SelectCard
                    key={opt.value}
                    label={opt.label}
                    description={opt.description}
                    selected={form.equipment_access === opt.value}
                    onClick={() => setForm((f) => ({ ...f, equipment_access: opt.value }))}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 6, marginTop: 0 }}>
                Do you have any injuries or physical limitations?
              </h2>
              <p style={{ fontSize: 13, color: "#64748B", marginBottom: 20, marginTop: 0 }}>
                Your coach will review this before programming begins
              </p>
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                {(["No", "Yes"] as const).map((opt) => {
                  const val = opt === "Yes";
                  const selected = form.has_injury === val;
                  return (
                    <button
                      key={opt}
                      onClick={() => setForm((f) => ({ ...f, has_injury: val }))}
                      style={{
                        flex: 1,
                        padding: "12px 0",
                        borderRadius: 8,
                        border: selected ? "2px solid #0D9488" : "1px solid #E2E8F0",
                        background: selected ? "#CCFBF1" : "#FFFFFF",
                        color: selected ? "#0D9488" : "#0F172A",
                        fontSize: 14,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        outline: "none",
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {form.has_injury === true && (
                <div
                  style={{
                    opacity: 1,
                    transition: "opacity 0.2s ease",
                  }}
                >
                  <label style={{ fontSize: 12, color: "#64748B", fontWeight: 500, display: "block", marginBottom: 6 }}>
                    Tell us briefly — your coach will review this
                  </label>
                  <textarea
                    value={form.injury_details}
                    onChange={(e) => setForm((f) => ({ ...f, injury_details: e.target.value }))}
                    placeholder="e.g. Lower back pain, left knee issues..."
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid #E2E8F0",
                      fontSize: 14,
                      color: "#0F172A",
                      background: "#FFFFFF",
                      outline: "none",
                      boxSizing: "border-box",
                      resize: "vertical",
                      fontFamily: "Inter, system-ui, sans-serif",
                      transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#0D9488";
                      e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#E2E8F0";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 5 */}
          {step === 5 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 4, marginTop: 0 }}>
                What topics would you like to learn about?
              </h2>
              <p style={{ fontSize: 13, color: "#64748B", marginBottom: 20, marginTop: 0 }}>
                Select all that apply — this helps us personalise your experience
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {educationTopics.map((topic) => (
                  <CheckboxItem
                    key={topic}
                    label={topic}
                    checked={form.education_interests.includes(topic)}
                    onChange={() => toggleEducation(topic)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step 6 — Review */}
          {step === 6 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 4, marginTop: 0 }}>
                Review your answers
              </h2>
              <p style={{ fontSize: 13, color: "#64748B", marginBottom: 24, marginTop: 0 }}>
                Everything look right? You can edit any step.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {[
                  { label: "Full name", value: form.full_name, goTo: 1 },
                  { label: "Training experience", value: trainingLabel, goTo: 2 },
                  { label: "Equipment", value: equipmentLabel, goTo: 3 },
                  {
                    label: "Injuries",
                    value: form.has_injury
                      ? `Yes${form.injury_details ? ` — ${form.injury_details}` : ""}`
                      : "None",
                    goTo: 4,
                  },
                  {
                    label: "Education interests",
                    value: form.education_interests.length > 0 ? form.education_interests.join(", ") : "—",
                    goTo: 5,
                  },
                ].map((row, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      padding: "14px 0",
                      borderBottom: i < 4 ? "1px solid #F1F5F9" : "none",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: "#64748B", fontWeight: 500, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {row.label}
                      </div>
                      <div style={{ fontSize: 14, color: "#0F172A", fontWeight: 500 }}>{row.value}</div>
                    </div>
                    <button
                      onClick={() => navigate(row.goTo)}
                      style={{
                        fontSize: 12,
                        color: "#0D9488",
                        fontWeight: 500,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px 4px",
                        borderRadius: 4,
                        flexShrink: 0,
                        marginLeft: 16,
                        marginTop: 2,
                      }}
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>

              {error && (
                <p style={{ fontSize: 13, color: "#F97316", marginTop: 16, marginBottom: 0 }}>{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div
          style={{
            display: "flex",
            justifyContent: step === 1 ? "flex-end" : "space-between",
            alignItems: "center",
            marginTop: 32,
          }}
        >
          {step > 1 && (
            <button
              onClick={() => navigate(step - 1)}
              disabled={submitting}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#0D9488",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "10px 0",
                outline: "none",
              }}
            >
              ← Back
            </button>
          )}

          {step < TOTAL_STEPS && (
            <button
              onClick={() => canProceed() && navigate(step + 1)}
              disabled={!canProceed()}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#FFFFFF",
                background: canProceed() ? "#0D9488" : "#CBD5E1",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                cursor: canProceed() ? "pointer" : "not-allowed",
                transition: "background 0.15s ease",
                outline: "none",
              }}
              onMouseEnter={(e) => canProceed() && ((e.target as HTMLButtonElement).style.background = "#0F766E")}
              onMouseLeave={(e) => canProceed() && ((e.target as HTMLButtonElement).style.background = "#0D9488")}
            >
              Next →
            </button>
          )}

          {step === TOTAL_STEPS && (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#FFFFFF",
                background: submitting ? "#CBD5E1" : "#0D9488",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                cursor: submitting ? "not-allowed" : "pointer",
                transition: "background 0.15s ease",
                outline: "none",
              }}
              onMouseEnter={(e) => !submitting && ((e.target as HTMLButtonElement).style.background = "#0F766E")}
              onMouseLeave={(e) => !submitting && ((e.target as HTMLButtonElement).style.background = "#0D9488")}
            >
              {submitting ? "Saving…" : "Start My Programme"}
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <p
        style={{
          fontSize: 11,
          color: "#94A3B8",
          marginTop: 24,
          letterSpacing: "0.02em",
        }}
      >
        Powered by TEMPO
      </p>
    </div>
  );
}
