"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  full_name: string | null;
  email: string;
  assigned_plan: string | null;
  plan_start_date: string | null;
  current_week: number | null;
  training_age: string | null;
  equipment_access: string | null;
  has_injury: boolean | null;
  injury_details: string | null;
  onboarding_complete: boolean | null;
}

interface CheckIn {
  week_number: number;
  year: number;
  mood: number;
  energy_level: number;
  stress_level: number;
  rpe: number;
  sessions_completed: number;
  submitted_at: string | null;
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

function IconSignOut({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 11l3-3-3-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="14" y1="8" x2="6" y2="8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

const NAV = [
  { label: "Dashboard", href: "/employee", Icon: IconDashboard },
  { label: "Training", href: "/employee/training", Icon: IconTraining },
  { label: "Check-in", href: "/employee/check-in", Icon: IconCheckIn },
  { label: "Profile", href: "/employee/profile", Icon: IconProfile },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ active, onSignOut }: { active: string; onSignOut: () => void }) {
  return (
    <aside
      className="takt-sidebar"
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
      <div style={{ borderTop: "1px solid #E2E8F0", padding: "16px 20px" }}>
        <button
          onClick={onSignOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 14,
            color: "#64748B",
            padding: 0,
            width: "100%",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "#64748B"; }}
        >
          <IconSignOut color="currentColor" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

// ─── Bottom tabs (mobile) ─────────────────────────────────────────────────────

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

// ─── Card ─────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(value: number, invert = false): string {
  const good = invert
    ? value <= 4
    : value >= 8;
  const mid = invert
    ? value <= 6
    : value >= 5;
  if (good) return "#22C55E";
  if (mid) return "#F59E0B";
  return "#EF4444";
}

function ScoreDot({ value, invert = false }: { value: number; invert?: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontWeight: 600,
        fontSize: 13,
        color: scoreColor(value, invert),
      }}
    >
      {value}
    </span>
  );
}

function formatEquipment(v: string | null): string {
  if (v === "full_gym") return "Full gym";
  if (v === "home") return "Home";
  if (v === "none") return "No equipment";
  return "—";
}

function formatTrainingAge(v: string | null): string {
  if (v === "beginner") return "Beginner";
  if (v === "intermediate") return "Intermediate";
  if (v === "advanced") return "Advanced";
  return "—";
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Achievement definitions ──────────────────────────────────────────────────

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
}

function AchievementIcon({ type, earned }: { type: string; earned: boolean }) {
  const color = earned ? "#0D9488" : "#CBD5E1";
  switch (type) {
    case "start":
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 3l2 6h6l-5 3.5 2 6L11 15l-5 3.5 2-6L3 9h6z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={earned ? "#F0FDFA" : "none"} />
        </svg>
      );
    case "streak":
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M12 3c0 4-4 5-4 9a5 5 0 0010 0c0-4-4-5-4-9z" stroke={color} strokeWidth="1.5" fill={earned ? "#F0FDFA" : "none"} />
          <circle cx="11" cy="16" r="1.5" fill={color} />
        </svg>
      );
    case "sessions":
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="4" cy="11" r="2" stroke={color} strokeWidth="1.5" />
          <circle cx="18" cy="11" r="2" stroke={color} strokeWidth="1.5" />
          <line x1="6" y1="8" x2="6" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16" y1="8" x2="16" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="6" y1="11" x2="16" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "energy":
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M13 3L7 12h5l-3 7 9-10h-5l3-6z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={earned ? "#F0FDFA" : "none"} />
        </svg>
      );
    case "calm":
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M5 12c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M8 16c0-1.657 1.343-3 3-3s3 1.343 3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "halfway":
      return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="8" stroke={color} strokeWidth="1.5" />
          <path d="M11 11V3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <path d="M11 11l5.66 5.66" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

function buildAchievements(profile: Profile | null, checkIns: CheckIn[]): Achievement[] {
  const avgEnergy =
    checkIns.length > 0
      ? checkIns.reduce((s, c) => s + c.energy_level, 0) / checkIns.length
      : 0;
  const avgStress =
    checkIns.length > 0
      ? checkIns.reduce((s, c) => s + c.stress_level, 0) / checkIns.length
      : 0;

  const hasWeekWith4Sessions = checkIns.some((c) => c.sessions_completed >= 4);

  // Streak: find longest consecutive week run in the check-in list.
  const weekNumbers = [...checkIns]
    .sort((a, b) => a.week_number - b.week_number)
    .map((c) => c.week_number);
  let longestStreak = weekNumbers.length > 0 ? 1 : 0;
  let current = 1;
  for (let i = 1; i < weekNumbers.length; i++) {
    if (weekNumbers[i] === weekNumbers[i - 1] + 1) {
      current++;
      longestStreak = Math.max(longestStreak, current);
    } else {
      current = 1;
    }
  }

  return [
    {
      id: "start",
      title: "First Step",
      description: "Completed your first check-in",
      icon: <AchievementIcon type="start" earned={checkIns.length >= 1} />,
      earned: checkIns.length >= 1,
    },
    {
      id: "streak",
      title: "4-Week Streak",
      description: "Checked in 4 consecutive weeks",
      icon: <AchievementIcon type="streak" earned={longestStreak >= 4} />,
      earned: longestStreak >= 4,
    },
    {
      id: "sessions",
      title: "Session Crusher",
      description: "Logged 4+ sessions in a week",
      icon: <AchievementIcon type="sessions" earned={hasWeekWith4Sessions} />,
      earned: hasWeekWith4Sessions,
    },
    {
      id: "energy",
      title: "High Energy",
      description: "Average energy above 7/10",
      icon: <AchievementIcon type="energy" earned={avgEnergy > 7} />,
      earned: avgEnergy > 7,
    },
    {
      id: "calm",
      title: "Keep Calm",
      description: "Average stress below 5/10",
      icon: <AchievementIcon type="calm" earned={checkIns.length >= 2 && avgStress < 5} />,
      earned: checkIns.length >= 2 && avgStress < 5,
    },
    {
      id: "halfway",
      title: "Halfway There",
      description: "Reached week 6 of your programme",
      icon: <AchievementIcon type="halfway" earned={(profile?.current_week ?? 0) >= 6} />,
      earned: (profile?.current_week ?? 0) >= 6,
    },
  ];
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EmployeeProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);

  // Editable fields
  const [editName, setEditName] = useState("");
  const [editEquipment, setEditEquipment] = useState("");

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

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
        .select(
          "full_name, email, assigned_plan, plan_start_date, current_week, training_age, equipment_access, has_injury, injury_details, onboarding_complete"
        )
        .eq("id", user.id)
        .single(),
      supabase
        .from("check_ins")
        .select("week_number, year, mood, energy_level, stress_level, rpe, sessions_completed, submitted_at")
        .eq("employee_id", user.id)
        .order("year", { ascending: false })
        .order("week_number", { ascending: false })
        .limit(8),
    ]);

    setProfile(prof ?? null);
    setCheckIns(ci ?? []);
    setEditName(prof?.full_name ?? "");
    setEditEquipment(prof?.equipment_access ?? "");
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .update({ full_name: editName, equipment_access: editEquipment })
      .eq("id", user.id);

    setProfile((p) => p ? { ...p, full_name: editName, equipment_access: editEquipment } : p);
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const achievements = buildAchievements(profile, checkIns);
  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <>
      <style>{`
        @keyframes takt-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @media (max-width: 767px) {
          .takt-sidebar     { display: none !important; }
          .takt-bottom-tabs { display: flex !important; }
          .takt-main        { padding: 20px 16px 80px !important; }
        }
        @media (min-width: 768px) {
          .takt-bottom-tabs { display: none !important; }
        }
        .profile-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 860px) {
          .profile-two-col { grid-template-columns: 1fr; }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "#F8FAFC",
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        <Sidebar active="/employee/profile" onSignOut={signOut} />

        <main
          className="takt-main"
          style={{ flex: 1, padding: "36px 40px", minWidth: 0 }}
        >

          {/* ── Header card ── */}
          <Card style={{ marginBottom: 16 }}>
            {loading ? (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <Skeleton w={56} h={56} radius={28} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Skeleton w={160} h={20} />
                  <Skeleton w={200} h={14} />
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    background: "#F0FDFA",
                    border: "2px solid #0D9488",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#0D9488",
                    flexShrink: 0,
                  }}
                >
                  {initials(profile?.full_name ?? null)}
                </div>
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontSize: 20, fontWeight: 600, color: "#0F172A", margin: 0 }}>
                    {profile?.full_name ?? "—"}
                  </h1>
                  <p style={{ fontSize: 13, color: "#64748B", margin: "3px 0 0" }}>
                    {profile?.email}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {profile?.assigned_plan && (
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 20,
                        background: "#F0FDFA",
                        color: "#0D9488",
                        fontSize: 12,
                        fontWeight: 600,
                        border: "1px solid #CCFBF1",
                      }}
                    >
                      Plan {profile.assigned_plan}
                    </span>
                  )}
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 20,
                      background: "#F8FAFC",
                      color: "#64748B",
                      fontSize: 12,
                      fontWeight: 500,
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    Week {profile?.current_week ?? "—"}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* ── Quick stats ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 16,
              marginBottom: 16,
            }}
            className="profile-stats-grid"
          >
            {[
              {
                label: "Check-ins",
                value: loading ? null : checkIns.length,
                unit: "total",
              },
              {
                label: "Programme",
                value: loading ? null : `Wk ${profile?.current_week ?? "—"}`,
                unit: "in progress",
                raw: true,
              },
              {
                label: "Training Level",
                value: loading ? null : formatTrainingAge(profile?.training_age ?? null),
                unit: "",
                raw: true,
              },
              {
                label: "Achievements",
                value: loading ? null : `${earnedCount}/${achievements.length}`,
                unit: "earned",
                raw: true,
              },
            ].map(({ label, value, unit, raw }) => (
              <Card key={label} style={{ padding: 16 }}>
                {loading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <Skeleton w="60%" h={11} />
                    <Skeleton w="45%" h={26} radius={6} />
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: raw ? 18 : 24, fontWeight: 600, color: "#0F172A" }}>
                      {value}
                    </div>
                    {unit && (
                      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{unit}</div>
                    )}
                  </>
                )}
              </Card>
            ))}
          </div>
          <style>{`
            @media (max-width: 960px) {
              .profile-stats-grid { grid-template-columns: 1fr 1fr !important; }
            }
            @media (max-width: 480px) {
              .profile-stats-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>

          {/* ── Two-column: check-in history + achievements ── */}
          <div className="profile-two-col" style={{ marginBottom: 16 }}>

            {/* Check-in history */}
            <Card>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 16 }}>
                Check-in History
              </div>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[...Array(5)].map((_, i) => <Skeleton key={i} w="100%" h={36} radius={6} />)}
                </div>
              ) : checkIns.length === 0 ? (
                <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>
                  No check-ins submitted yet.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr>
                        {["Week", "Mood", "Energy", "Stress", "RPE", "Sessions"].map((h) => (
                          <th
                            key={h}
                            style={{
                              textAlign: "left",
                              padding: "0 8px 10px 0",
                              color: "#94A3B8",
                              fontWeight: 500,
                              fontSize: 11,
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {checkIns.map((ci) => (
                        <tr
                          key={`${ci.year}-${ci.week_number}`}
                          style={{ borderTop: "1px solid #F1F5F9" }}
                        >
                          <td style={{ padding: "10px 8px 10px 0", color: "#64748B", fontWeight: 500 }}>
                            Wk {ci.week_number}
                          </td>
                          <td style={{ padding: "10px 8px 10px 0" }}>
                            <ScoreDot value={ci.mood} />
                          </td>
                          <td style={{ padding: "10px 8px 10px 0" }}>
                            <ScoreDot value={ci.energy_level} />
                          </td>
                          <td style={{ padding: "10px 8px 10px 0" }}>
                            <ScoreDot value={ci.stress_level} invert />
                          </td>
                          <td style={{ padding: "10px 8px 10px 0" }}>
                            <ScoreDot value={ci.rpe} invert />
                          </td>
                          <td style={{ padding: "10px 0 10px 0", color: "#0F172A", fontWeight: 500 }}>
                            {ci.sessions_completed}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p style={{ fontSize: 11, color: "#CBD5E1", margin: "12px 0 0" }}>
                    Green ≥ 8 · Amber 5–7 · Red ≤ 4 · Stress/RPE inverted
                  </p>
                </div>
              )}
            </Card>

            {/* Achievements */}
            <Card>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>
                Achievements
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 16 }}>
                {loading ? "" : `${earnedCount} of ${achievements.length} earned`}
              </div>
              {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[...Array(6)].map((_, i) => <Skeleton key={i} w="100%" h={72} radius={8} />)}
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {achievements.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        border: `1.5px solid ${a.earned ? "#CCFBF1" : "#F1F5F9"}`,
                        borderRadius: 10,
                        padding: "12px",
                        background: a.earned ? "#F0FDFA" : "#FAFAFA",
                        opacity: a.earned ? 1 : 0.6,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {a.icon}
                      <div style={{ fontSize: 12, fontWeight: 600, color: a.earned ? "#0D9488" : "#94A3B8" }}>
                        {a.title}
                      </div>
                      <div style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.3 }}>
                        {a.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* ── Profile settings ── */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 16 }}>
              Profile Settings
            </div>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <Skeleton w="40%" h={14} />
                <Skeleton w="100%" h={40} radius={8} />
                <Skeleton w="40%" h={14} />
                <Skeleton w="100%" h={40} radius={8} />
                <Skeleton w={100} h={36} radius={8} />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Name */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#64748B", display: "block", marginBottom: 6 }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1.5px solid #E2E8F0",
                      fontSize: 14,
                      color: "#0F172A",
                      outline: "none",
                      boxSizing: "border-box",
                      background: "#FFFFFF",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#0D9488"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#E2E8F0"; }}
                  />
                </div>

                {/* Equipment */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "#64748B", display: "block", marginBottom: 6 }}>
                    Equipment Access
                  </label>
                  <select
                    value={editEquipment}
                    onChange={(e) => setEditEquipment(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1.5px solid #E2E8F0",
                      fontSize: 14,
                      color: "#0F172A",
                      outline: "none",
                      background: "#FFFFFF",
                      cursor: "pointer",
                      appearance: "none",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = "#0D9488"; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = "#E2E8F0"; }}
                  >
                    <option value="full_gym">Full gym</option>
                    <option value="home">Home</option>
                    <option value="none">No equipment</option>
                  </select>
                </div>

                {/* Read-only fields */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#64748B", marginBottom: 4 }}>Training Level</div>
                    <div style={{ fontSize: 14, color: "#0F172A" }}>{formatTrainingAge(profile?.training_age ?? null)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#64748B", marginBottom: 4 }}>Assigned Plan</div>
                    <div style={{ fontSize: 14, color: "#0F172A" }}>Plan {profile?.assigned_plan ?? "—"}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#64748B", marginBottom: 4 }}>Start Date</div>
                    <div style={{ fontSize: 14, color: "#0F172A" }}>
                      {profile?.plan_start_date
                        ? new Date(profile.plan_start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: "#64748B", marginBottom: 4 }}>Injury Flag</div>
                    <div style={{ fontSize: 14, color: profile?.has_injury ? "#F97316" : "#22C55E" }}>
                      {profile?.has_injury ? "Flagged" : "None"}
                    </div>
                  </div>
                </div>

                {/* Save */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      padding: "9px 20px",
                      borderRadius: 8,
                      background: "#0D9488",
                      color: "#FFFFFF",
                      fontSize: 14,
                      fontWeight: 500,
                      border: "none",
                      cursor: saving ? "not-allowed" : "pointer",
                      opacity: saving ? 0.7 : 1,
                      transition: "opacity 0.15s",
                    }}
                  >
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  {saveSuccess && (
                    <span style={{ fontSize: 13, color: "#22C55E", fontWeight: 500 }}>
                      ✓ Saved
                    </span>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* ── Sign out ── */}
          <Card style={{ borderTop: "3px solid #FEF2F2" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>
              Sign Out
            </div>
            <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 16px" }}>
              You&apos;ll be returned to the login screen.
            </p>
            <button
              onClick={signOut}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 20px",
                borderRadius: 8,
                border: "1.5px solid #EF4444",
                background: "transparent",
                color: "#EF4444",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#EF4444";
                e.currentTarget.style.color = "#FFFFFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#EF4444";
              }}
            >
              <IconSignOut color="currentColor" />
              Sign out
            </button>
          </Card>

        </main>

        <BottomTabs active="/employee/profile" />
      </div>
    </>
  );
}
