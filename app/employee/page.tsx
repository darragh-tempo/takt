"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

// ─── Helpers ──────────────────────────────────────────────────────────────────


function getGreeting(name: string): string {
  const h = new Date().getHours();
  const part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  return `Good ${part}, ${name}`;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconDashboard({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="1" width="6.5" height="6.5" rx="1.5" stroke={color} strokeWidth="1.5" />
      <rect x="10.5" y="1" width="6.5" height="6.5" rx="1.5" stroke={color} strokeWidth="1.5" />
      <rect x="1" y="10.5" width="6.5" height="6.5" rx="1.5" stroke={color} strokeWidth="1.5" />
      <rect x="10.5" y="10.5" width="6.5" height="6.5" rx="1.5" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function IconTraining({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="3.5" cy="9" r="2" stroke={color} strokeWidth="1.5" />
      <circle cx="14.5" cy="9" r="2" stroke={color} strokeWidth="1.5" />
      <line x1="5.5" y1="7" x2="5.5" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12.5" y1="7" x2="12.5" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5.5" y1="9" x2="12.5" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconCheckIn({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="3" y="2" width="12" height="14" rx="2" stroke={color} strokeWidth="1.5" />
      <line x1="6" y1="6" x2="12" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6" y1="9" x2="12" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 12l1.5 1.5L12 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconProfile({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6.5" r="3" stroke={color} strokeWidth="1.5" />
      <path d="M2.5 15.5c0-3.314 2.91-6 6.5-6s6.5 2.686 6.5 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV = [
  { label: "Dashboard", href: "/employee", Icon: IconDashboard },
  { label: "Training", href: "/employee/training", Icon: IconTraining },
  { label: "Check-in", href: "/employee/check-in", Icon: IconCheckIn },
  { label: "Profile", href: "/employee/profile", Icon: IconProfile },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ active }: { active: string }) {
  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        background: "#FFFFFF",
        borderRight: "1px solid #E2E8F0",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "sticky",
        top: 0,
      }}
      className="takt-sidebar"
    >
      <div style={{ padding: "24px 20px 20px" }}>
        <span style={{ fontSize: 20, fontWeight: 600, color: "#0D9488", letterSpacing: "0.04em" }}>
          Takt
        </span>
      </div>
      <nav style={{ flex: 1, padding: "4px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(({ label, href, Icon }) => {
          const isActive = active === href;
          return (
            <a
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                borderRadius: 8,
                textDecoration: "none",
                background: isActive ? "#F0FDFA" : "transparent",
                color: isActive ? "#0D9488" : "#64748B",
                fontSize: 14,
                fontWeight: isActive ? 500 : 400,
                transition: "background 0.1s, color 0.1s",
              }}
            >
              <Icon color={isActive ? "#0D9488" : "#94A3B8"} />
              {label}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}

// ─── Bottom tab bar (mobile) ──────────────────────────────────────────────────

function BottomTabs({ active }: { active: string }) {
  return (
    <nav
      className="takt-bottom-tabs"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#FFFFFF",
        borderTop: "1px solid #E2E8F0",
        display: "flex",
        zIndex: 100,
      }}
    >
      {NAV.map(({ label, href, Icon }) => {
        const isActive = active === href;
        return (
          <a
            key={href}
            href={href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              padding: "8px 0 10px",
              textDecoration: "none",
              color: isActive ? "#0D9488" : "#94A3B8",
              fontSize: 10,
              fontWeight: isActive ? 500 : 400,
            }}
          >
            <Icon color={isActive ? "#0D9488" : "#94A3B8"} />
            {label}
          </a>
        );
      })}
    </nav>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ w, h, radius = 6 }: { w: string | number; h: number; radius?: number }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        background: "linear-gradient(90deg, #F1F5F9 25%, #E8EDF2 50%, #F1F5F9 75%)",
        backgroundSize: "200% 100%",
        animation: "takt-shimmer 1.4s infinite",
      }}
    />
  );
}

// ─── Mini progress bar ────────────────────────────────────────────────────────

function PulseBar({ label, value, max, display }: { label: string; value: number; max: number; display: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: "monospace", color: "#0F172A", fontWeight: 600 }}>{display}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: "#E2E8F0", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            borderRadius: 3,
            background: "linear-gradient(90deg, #0D9488, #14B8A6)",
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 12,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  full_name: string | null;
  assigned_plan: string | null;
  current_week: number | null;
  plan_start_date: string | null;
}

interface CheckIn {
  id: string;
  energy_level: number;
  stress_level: number;
  mood: number;
  sessions_completed: number;
  rpe: number;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EmployeeDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);

  const now = new Date();
  const currentYear = now.getFullYear();
  const weekNumber = (() => {
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayOfWeek = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayOfWeek);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  })();

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const [{ data: prof }, { data: ci }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, assigned_plan, current_week, plan_start_date")
        .eq("id", user.id)
        .single(),
      supabase
        .from("check_ins")
        .select("id, energy_level, stress_level, mood, sessions_completed, rpe")
        .eq("employee_id", user.id)
        .eq("week_number", weekNumber)
        .eq("year", currentYear)
        .limit(1)
        .maybeSingle(),
    ]);

    setProfile(prof ?? null);
    setCheckIn(ci ?? null);
    setLoading(false);
  }, [router, weekNumber, currentYear]);

  useEffect(() => {
    load();
  }, [load]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const currentWeek = profile?.current_week ?? 1;
  const hasCheckIn = checkIn !== null;

  return (
    <>
      {/* Global shimmer keyframe */}
      <style>{`
        @keyframes takt-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (max-width: 767px) {
          .takt-sidebar { display: none !important; }
          .takt-bottom-tabs { display: flex !important; }
          .takt-main { padding: 20px 16px 80px !important; }
        }
        @media (min-width: 768px) {
          .takt-bottom-tabs { display: none !important; }
        }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
        <Sidebar active="/employee" />

        <main className="takt-main" style={{ flex: 1, padding: "36px 40px", maxWidth: "100%", overflow: "hidden" }}>

          {/* ── Greeting ── */}
          <div style={{ marginBottom: 28 }}>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <Skeleton w={260} h={32} radius={8} />
                <Skeleton w={180} h={18} radius={6} />
              </div>
            ) : (
              <>
                <h1 style={{ fontSize: 24, fontWeight: 600, color: "#0F172A", margin: 0 }}>
                  {getGreeting(firstName)}
                </h1>
                <p style={{ fontSize: 14, color: "#64748B", margin: "6px 0 0" }}>
                  Week {currentWeek} of your programme
                </p>
              </>
            )}
          </div>

          {/* ── Two-column grid ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 320px",
              gap: 16,
              alignItems: "start",
            }}
            className="takt-grid"
          >
            {/* ── LEFT COLUMN ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Card: Today's Training Plan */}
              {loading ? (
                <Card>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <Skeleton w="60%" h={18} />
                    <Skeleton w="100%" h={120} radius={8} />
                  </div>
                </Card>
              ) : (
                <Card>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: "#0F172A" }}>Today&apos;s Training Plan</span>
                    <a
                      href="/employee/training"
                      style={{ fontSize: 13, color: "#0D9488", fontWeight: 500, textDecoration: "none" }}
                    >
                      View Schedule →
                    </a>
                  </div>
                  <div
                    style={{
                      border: "1.5px dashed #E2E8F0",
                      borderRadius: 8,
                      padding: "32px 20px",
                      textAlign: "center",
                    }}
                  >
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ marginBottom: 10 }}>
                      <circle cx="16" cy="16" r="14" stroke="#CBD5E1" strokeWidth="1.5" />
                      <path d="M10 16h12M16 10v12" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <p style={{ fontSize: 14, color: "#94A3B8", margin: 0, lineHeight: 1.5 }}>
                      Your training plan is being prepared by your coach.
                      <br />Check back soon.
                    </p>
                  </div>
                </Card>
              )}

              {/* Card: Continue Learning */}
              {loading ? (
                <Card>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <Skeleton w="50%" h={18} />
                    <div style={{ display: "flex", gap: 12 }}>
                      <Skeleton w="50%" h={160} radius={8} />
                      <Skeleton w="50%" h={160} radius={8} />
                    </div>
                  </div>
                </Card>
              ) : (
                <Card>
                  <div style={{ marginBottom: 16 }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: "#0F172A" }}>Continue Learning</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[0, 1].map((i) => (
                      <div
                        key={i}
                        style={{
                          background: "#F1F5F9",
                          borderRadius: 8,
                          height: 160,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                        }}
                      >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="11" width="18" height="11" rx="2" stroke="#CBD5E1" strokeWidth="1.5" />
                          <path d="M7 11V7a5 5 0 0110 0v4" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>Coming Soon</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Card: Weekly Check-in */}
              {loading ? (
                <Card>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <Skeleton w="70%" h={20} />
                    <Skeleton w="100%" h={60} />
                    <Skeleton w="100%" h={40} radius={8} />
                  </div>
                </Card>
              ) : hasCheckIn ? (
                /* Submitted state */
                <Card style={{ background: "#F0FDF4" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="9" stroke="#22C55E" strokeWidth="1.5" />
                      <path d="M6 10l3 3 5-5" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontSize: 16, fontWeight: 600, color: "#22C55E" }}>Weekly Check-in</span>
                  </div>
                  <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 12px" }}>
                    Completed — see you next Friday.
                  </p>
                  <div style={{ display: "flex", gap: 20 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>STATUS</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#22C55E" }}>Complete ✓</div>
                    </div>
                  </div>
                </Card>
              ) : (
                /* Not submitted state */
                <Card style={{ background: "#FFF7ED" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <rect x="4" y="2.5" width="12" height="15" rx="2" stroke="#F97316" strokeWidth="1.5" />
                      <line x1="7" y1="7" x2="13" y2="7" stroke="#F97316" strokeWidth="1.2" strokeLinecap="round" />
                      <line x1="7" y1="10" x2="13" y2="10" stroke="#F97316" strokeWidth="1.2" strokeLinecap="round" />
                      <path d="M7 13l1.5 1.5L13 11" stroke="#F97316" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontSize: 16, fontWeight: 600, color: "#F97316" }}>Weekly Check-in</span>
                  </div>
                  <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 14px" }}>
                    Reflect on your week and share how you&apos;re doing.
                  </p>
                  <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>DEADLINE</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#F97316" }}>Friday</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>STATUS</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#F97316" }}>Pending</div>
                    </div>
                  </div>
                  <a
                    href="/employee/check-in"
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px 0",
                      borderRadius: 8,
                      background: "#F97316",
                      color: "#FFFFFF",
                      fontSize: 14,
                      fontWeight: 500,
                      textAlign: "center",
                      textDecoration: "none",
                      transition: "background 0.15s ease",
                      boxSizing: "border-box",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#EA6C05")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#F97316")}
                  >
                    Start Check-in
                  </a>
                </Card>
              )}

              {/* Card: This Week's Pulse */}
              {loading ? (
                <Card>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <Skeleton w="55%" h={18} />
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <Skeleton w={60} h={12} />
                          <Skeleton w={30} h={12} />
                        </div>
                        <Skeleton w="100%" h={6} radius={3} />
                      </div>
                    ))}
                  </div>
                </Card>
              ) : (
                <Card>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", marginBottom: 16 }}>
                    This Week&apos;s Pulse
                  </div>
                  {hasCheckIn ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <PulseBar label="Energy" value={checkIn.energy_level} max={10} display={`${checkIn.energy_level}/10`} />
                      <PulseBar label="Stress" value={checkIn.stress_level} max={10} display={`${checkIn.stress_level}/10`} />
                      <PulseBar label="Mood" value={checkIn.mood} max={10} display={`${checkIn.mood}/10`} />
                      <PulseBar label="Sessions" value={checkIn.sessions_completed} max={5} display={`${checkIn.sessions_completed}/5`} />
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: "#94A3B8", margin: 0, lineHeight: 1.5 }}>
                      Complete your check-in to see your weekly pulse.
                    </p>
                  )}
                </Card>
              )}
            </div>
          </div>

          {/* Responsive: collapse grid to single column on smaller screens */}
          <style>{`
            @media (max-width: 900px) {
              .takt-grid {
                grid-template-columns: 1fr !important;
              }
            }
          `}</style>
        </main>

        <BottomTabs active="/employee" />
      </div>
    </>
  );
}
