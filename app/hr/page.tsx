"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  getParticipation,
  getWeeklyAverages,
  getTrainingAdherence,
  getFlaggedEmployees,
  getActiveCultureQuestion,
  getTeamBreakdown,
} from "@/lib/queries/hr-dashboard";
import type {
  Participation,
  WeeklyAverage,
  TrainingAdherence,
  FlaggedEmployees,
  ActiveCultureQuestion,
  TeamMember,
} from "@/lib/queries/hr-dashboard";

// ─── ISO week helper ──────────────────────────────────────────────────────────

function isoWeek(d: Date): number {
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const ys = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc.getTime() - ys.getTime()) / 86_400_000 + 1) / 7);
}

// ─── Action prompts ───────────────────────────────────────────────────────────

interface ActionPrompt {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  body: string;
  suggestion: string;
}

function generatePrompts(d: {
  participationRate: number;
  adherenceRate: number;
  flaggedCount: number;
  totalEmployees: number;
  avgMood: number;
  avgStress: number;
  avgEnergy: number;
}): ActionPrompt[] {
  const ps: ActionPrompt[] = [];

  if (d.flaggedCount > 0 && d.totalEmployees > 0) {
    const pct = d.flaggedCount / d.totalEmployees;
    ps.push({
      id: "flagged",
      severity: pct >= 0.2 ? "critical" : "warning",
      title: `${d.flaggedCount} team member${d.flaggedCount > 1 ? "s" : ""} showing decline`,
      body:
        pct >= 0.2
          ? `Over 20% of your team has dropped 2+ points in mood or energy since last week.`
          : `Mood or energy has dropped significantly for ${d.flaggedCount} individual${d.flaggedCount > 1 ? "s" : ""}.`,
      suggestion:
        pct >= 0.2
          ? "Consider a company-wide wellbeing check-in or team meeting."
          : "Arrange a 1:1 conversation with flagged individuals this week.",
    });
  }

  if (d.avgStress >= 7) {
    ps.push({
      id: "stress-high",
      severity: "critical",
      title: "Team stress is elevated",
      body: `Average stress is ${d.avgStress.toFixed(1)}/10 — above the concern threshold of 7.`,
      suggestion: "Host a team reset session or reduce meeting load this week.",
    });
  } else if (d.avgStress >= 6) {
    ps.push({
      id: "stress-mid",
      severity: "warning",
      title: "Stress levels are rising",
      body: `Average stress is ${d.avgStress.toFixed(1)}/10 — trending upwards.`,
      suggestion: "Consider a structured break or a short wellbeing session.",
    });
  }

  if (d.avgMood < 5) {
    ps.push({
      id: "mood-low",
      severity: "critical",
      title: "Team mood is low",
      body: `Average mood is ${d.avgMood.toFixed(1)}/10 — below the 5/10 concern threshold.`,
      suggestion: "Organise a team event, social, or dedicated wellness day.",
    });
  } else if (d.avgMood < 6.5 && d.avgMood > 0) {
    ps.push({
      id: "mood-mid",
      severity: "warning",
      title: "Team mood below target",
      body: `Average mood is ${d.avgMood.toFixed(1)}/10.`,
      suggestion: "Consider a team recognition moment or light social activity.",
    });
  }

  if (d.participationRate < 60 && d.participationRate >= 0) {
    ps.push({
      id: "participation",
      severity: "warning",
      title: "Check-in participation is low",
      body: `Only ${d.participationRate.toFixed(0)}% of your team submitted this week.`,
      suggestion: "Send a reminder — data gaps make it harder to support your team.",
    });
  }

  if (d.adherenceRate < 50 && d.adherenceRate >= 0) {
    ps.push({
      id: "adherence",
      severity: "info",
      title: "Training adherence needs attention",
      body: `${d.adherenceRate.toFixed(0)}% of planned sessions completed this week.`,
      suggestion: "Review training barriers with employees or your TEMPO coach.",
    });
  }

  return ps;
}

// ─── Score helpers ────────────────────────────────────────────────────────────

function scoreColor(v: number, invert = false): string {
  const good = invert ? v <= 4 : v >= 8;
  const mid = invert ? v <= 6 : v >= 5;
  return good ? "#22C55E" : mid ? "#F59E0B" : "#EF4444";
}

function barColor(sessions: number): string {
  if (sessions >= 4) return "#0D9488";
  if (sessions >= 2.5) return "#F59E0B";
  return "#EF4444";
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
function IconTeam({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="6.5" cy="6" r="2.5" stroke={color} strokeWidth="1.5" />
      <circle cx="12.5" cy="6" r="2" stroke={color} strokeWidth="1.5" />
      <path d="M1 15c0-2.76 2.46-5 5.5-5s5.5 2.24 5.5 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 11c1.66 0 3 1.34 3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function IconReports({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="3" y="2" width="12" height="14" rx="2" stroke={color} strokeWidth="1.5" />
      <line x1="6.5" y1="6" x2="11.5" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6.5" y1="9" x2="11.5" y2="9" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6.5" y1="12" x2="9.5" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
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
function IconAlert({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L15 14H1L8 2z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="8" y1="7" x2="8" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="12" r="0.75" fill={color} />
    </svg>
  );
}
function IconInfo({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.5" />
      <line x1="8" y1="7.5" x2="8" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="5.5" r="0.75" fill={color} />
    </svg>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

const NAV = [
  { label: "Dashboard", href: "/hr", Icon: IconDashboard },
  { label: "Team Overview", href: "/hr/team", Icon: IconTeam },
  { label: "Reports", href: "/hr/reports", Icon: IconReports },
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
            <a key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 10px", borderRadius: 8, textDecoration: "none",
              background: isActive ? "#F0FDFA" : "transparent",
              color: isActive ? "#0D9488" : "#64748B",
              fontSize: 14, fontWeight: isActive ? 500 : 400,
              transition: "background 0.1s, color 0.1s",
            }}>
              <Icon color={isActive ? "#0D9488" : "#94A3B8"} />
              {label}
            </a>
          );
        })}
      </nav>
      <div style={{ borderTop: "1px solid #E2E8F0", padding: "16px 20px" }}>
        <button onClick={onSignOut} style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "none", border: "none", cursor: "pointer",
          fontSize: 14, color: "#64748B", padding: 0, width: "100%",
        }}
          onMouseEnter={e => { e.currentTarget.style.color = "#EF4444"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#64748B"; }}
        >
          <IconSignOut color="currentColor" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

// ─── Bottom tabs ──────────────────────────────────────────────────────────────

function BottomTabs({ active }: { active: string }) {
  return (
    <nav className="takt-bottom-tabs" style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "#FFFFFF", borderTop: "1px solid #E2E8F0", display: "flex", zIndex: 100,
    }}>
      {NAV.map(({ label, href, Icon }) => {
        const isActive = active === href;
        return (
          <a key={href} href={href} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 3,
            padding: "8px 0 10px", textDecoration: "none",
            color: isActive ? "#0D9488" : "#94A3B8",
            fontSize: 10, fontWeight: isActive ? 500 : 400,
          }}>
            <Icon color={isActive ? "#0D9488" : "#94A3B8"} />
            {label}
          </a>
        );
      })}
    </nav>
  );
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function Skeleton({ w, h, radius = 6 }: { w: string | number; h: number; radius?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: "linear-gradient(90deg,#F1F5F9 25%,#E8EDF2 50%,#F1F5F9 75%)",
      backgroundSize: "200% 100%", animation: "takt-shimmer 1.4s infinite",
    }} />
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "#FFFFFF", borderRadius: 12,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04),0 1px 2px rgba(0,0,0,0.06)",
      padding: 20, ...style,
    }}>
      {children}
    </div>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, valueColor = "#0F172A", loading,
}: {
  label: string; value: string; sub: string;
  valueColor?: string; loading: boolean;
}) {
  return (
    <Card>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Skeleton w="55%" h={12} />
          <Skeleton w="40%" h={36} radius={8} />
          <Skeleton w="70%" h={11} />
        </div>
      ) : (
        <>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
            {label}
          </div>
          <div style={{ fontSize: 34, fontWeight: 600, color: valueColor, lineHeight: 1, marginBottom: 6 }}>
            {value}
          </div>
          <div style={{ fontSize: 12, color: "#64748B" }}>{sub}</div>
        </>
      )}
    </Card>
  );
}

// ─── Action prompt ────────────────────────────────────────────────────────────

const SEVERITY_STYLES = {
  critical: { border: "#EF4444", bg: "#FEF2F2", text: "#B91C1C", icon: IconAlert },
  warning:  { border: "#F97316", bg: "#FFF7ED", text: "#C2410C", icon: IconAlert },
  info:     { border: "#0D9488", bg: "#F0FDFA", text: "#0F766E", icon: IconInfo  },
};

function ActionPromptCard({ prompt }: { prompt: ActionPrompt }) {
  const s = SEVERITY_STYLES[prompt.severity];
  const PromptIcon = s.icon;
  return (
    <div style={{
      borderLeft: `4px solid ${s.border}`,
      background: s.bg,
      borderRadius: "0 10px 10px 0",
      padding: "14px 16px",
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
    }}>
      <div style={{ marginTop: 1, flexShrink: 0 }}>
        <PromptIcon color={s.border} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginBottom: 3 }}>
          {prompt.title}
        </div>
        <div style={{ fontSize: 12, color: "#475569", marginBottom: 8, lineHeight: 1.5 }}>
          {prompt.body}
        </div>
        <div style={{ fontSize: 12, fontWeight: 500, color: s.text }}>
          → {prompt.suggestion}
        </div>
      </div>
    </div>
  );
}

// ─── Snapshot bar (current-week metric row in the chart panel) ────────────────

function SnapshotBar({
  label, value, max = 10, color, invert = false,
}: {
  label: string; value: number | undefined; max?: number; color: string; invert?: boolean;
}) {
  const v = value ?? 0;
  const fill = invert ? ((max - v) / max) * 100 : (v / max) * 100;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: scoreColor(v, invert) }}>
          {value !== undefined ? v.toFixed(1) : "—"}<span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 400 }}>/10</span>
        </span>
      </div>
      <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${fill}%`, background: color,
          borderRadius: 3, transition: "width 0.5s ease",
        }} />
      </div>
    </div>
  );
}

// ─── Team table ───────────────────────────────────────────────────────────────

function ScoreCell({ value, invert = false }: { value: number | undefined; invert?: boolean }) {
  if (value === undefined) return <span style={{ color: "#CBD5E1", fontSize: 13 }}>—</span>;
  return (
    <span style={{ fontSize: 13, fontWeight: 600, color: scoreColor(value, invert) }}>
      {value}
    </span>
  );
}

function StatusBadge({ member, currentWeek }: { member: TeamMember; currentWeek: number }) {
  if (!member.latestCheckIn) {
    return (
      <span style={{ fontSize: 11, fontWeight: 500, color: "#94A3B8", background: "#F1F5F9", padding: "3px 8px", borderRadius: 20 }}>
        No data
      </span>
    );
  }
  if (member.flagged) {
    return (
      <span style={{ fontSize: 11, fontWeight: 500, color: "#C2410C", background: "#FFF7ED", padding: "3px 8px", borderRadius: 20, border: "1px solid #FED7AA" }}>
        Flagged
      </span>
    );
  }
  if (member.checkedInThisWeek) {
    return (
      <span style={{ fontSize: 11, fontWeight: 500, color: "#0D9488", background: "#F0FDFA", padding: "3px 8px", borderRadius: 20, border: "1px solid #CCFBF1" }}>
        Active
      </span>
    );
  }
  return (
    <span style={{ fontSize: 11, fontWeight: 500, color: "#64748B", background: "#F8FAFC", padding: "3px 8px", borderRadius: 20, border: "1px solid #E2E8F0" }}>
      Wk {member.latestCheckIn.weekNumber}
    </span>
  );
}

function TeamTable({
  members, currentWeek, loading,
}: {
  members: TeamMember[]; currentWeek: number; loading: boolean;
}) {
  // Flagged first, then alphabetical
  const sorted = [...members].sort((a, b) => {
    if (a.flagged !== b.flagged) return a.flagged ? -1 : 1;
    if (!a.checkedInThisWeek && b.checkedInThisWeek) return 1;
    if (a.checkedInThisWeek && !b.checkedInThisWeek) return -1;
    return a.fullName.localeCompare(b.fullName);
  });

  const COL: React.CSSProperties = {
    padding: "11px 12px 11px 0",
    fontSize: 13,
    textAlign: "left" as const,
    verticalAlign: "middle",
  };
  const HEAD: React.CSSProperties = {
    ...COL,
    fontSize: 11,
    fontWeight: 500,
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    paddingBottom: 10,
    whiteSpace: "nowrap",
  };

  return (
    <Card style={{ padding: 0 }}>
      <div style={{ padding: "18px 20px 0", borderBottom: "1px solid #F1F5F9" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 14 }}>
          Team Breakdown
          <span style={{ fontSize: 12, fontWeight: 400, color: "#94A3B8", marginLeft: 8 }}>
            individual wellbeing indicators — visible to HR only
          </span>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 20 }}>
            {[...Array(5)].map((_, i) => <Skeleton key={i} w="100%" h={40} radius={6} />)}
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: "32px 20px", color: "#94A3B8", fontSize: 13, textAlign: "center" }}>
            No employee data yet.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                {["Employee", "Plan", "Prog. Week", "Mood", "Energy", "Stress", "Sessions", "RPE", "Status"].map(h => (
                  <th key={h} style={{ ...HEAD, paddingLeft: h === "Employee" ? 20 : 0 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((m, i) => (
                <tr
                  key={m.id}
                  style={{
                    borderBottom: i < sorted.length - 1 ? "1px solid #F8FAFC" : "none",
                    background: m.flagged ? "#FFFBF7" : "transparent",
                  }}
                >
                  <td style={{ ...COL, paddingLeft: 20, fontWeight: 500, color: "#0F172A", whiteSpace: "nowrap" }}>
                    {m.fullName}
                  </td>
                  <td style={{ ...COL, color: "#64748B" }}>
                    {m.assignedPlan ? `Plan ${m.assignedPlan}` : "—"}
                  </td>
                  <td style={{ ...COL, color: "#64748B" }}>Wk {m.currentWeek}</td>
                  <td style={COL}><ScoreCell value={m.latestCheckIn?.mood} /></td>
                  <td style={COL}><ScoreCell value={m.latestCheckIn?.energyLevel} /></td>
                  <td style={COL}><ScoreCell value={m.latestCheckIn?.stressLevel} invert /></td>
                  <td style={{ ...COL, color: "#0F172A", fontWeight: 500 }}>
                    {m.latestCheckIn?.sessionsCompleted ?? <span style={{ color: "#CBD5E1" }}>—</span>}
                  </td>
                  <td style={COL}><ScoreCell value={m.latestCheckIn?.rpe} invert /></td>
                  <td style={COL}><StatusBadge member={m} currentWeek={currentWeek} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div style={{ padding: "10px 20px 14px", borderTop: sorted.length > 0 ? "1px solid #F1F5F9" : "none" }}>
        <span style={{ fontSize: 11, color: "#CBD5E1" }}>
          Green ≥ 8 · Amber 5–7 · Red ≤ 4 · Stress & RPE are inverted (lower = better)
        </span>
      </div>
    </Card>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function HrDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [participation, setParticipation] = useState<Participation | null>(null);
  const [weeklyAverages, setWeeklyAverages] = useState<WeeklyAverage[]>([]);
  const [trainingAdherence, setTrainingAdherence] = useState<TrainingAdherence | null>(null);
  const [flaggedEmployees, setFlaggedEmployees] = useState<FlaggedEmployees | null>(null);
  const [activeCultureQuestion, setActiveCultureQuestion] = useState<ActiveCultureQuestion | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [weekRange, setWeekRange] = useState<4 | 8 | 12>(8);

  const now = new Date();
  const currentWeek = isoWeek(now);
  const currentYear = now.getFullYear();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) { router.push("/login"); return; }

    const companyId: string = profile.company_id;

    const [part, avgs, adherence, flagged, cultureQ, team] = await Promise.all([
      getParticipation(companyId),
      getWeeklyAverages(companyId, 12),   // fetch 12, slice client-side
      getTrainingAdherence(companyId),
      getFlaggedEmployees(companyId),
      getActiveCultureQuestion(companyId),
      getTeamBreakdown(companyId),
    ]);

    setParticipation(part);
    setWeeklyAverages(avgs);
    setTrainingAdherence(adherence);
    setFlaggedEmployees(flagged);
    setActiveCultureQuestion(cultureQ);
    setTeamMembers(team);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  // Slice based on selected week range, order chronologically for charts
  const chronological = [...weeklyAverages].reverse();
  const chartData = chronological.slice(-weekRange).map(w => ({
    label: `Wk ${w.weekNumber}`,
    energy: Number(w.avgEnergy.toFixed(1)),
    mood: Number(w.avgMood.toFixed(1)),
    stress: Number(w.avgStress.toFixed(1)),
    sessions: Number(w.avgSessions.toFixed(1)),
  }));

  const latest = weeklyAverages[0];
  const participationRate = participation?.participationRate ?? 0;
  const adherenceRate = trainingAdherence?.adherenceRate ?? 0;
  const flaggedCount = flaggedEmployees?.flaggedCount ?? 0;
  const totalEmployees = teamMembers.length;

  const prompts = loading ? [] : generatePrompts({
    participationRate,
    adherenceRate,
    flaggedCount,
    totalEmployees,
    avgMood: latest?.avgMood ?? 0,
    avgStress: latest?.avgStress ?? 0,
    avgEnergy: latest?.avgEnergy ?? 0,
  });

  // Custom tooltip shared by both charts
  const ChartTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ color: string; name: string; value: number }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: "#FFFFFF", border: "1px solid #E2E8F0",
        borderRadius: 8, padding: "10px 14px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        fontSize: 12,
      }}>
        <div style={{ fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>{label}</div>
        {payload.map(p => (
          <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
            <span style={{ color: "#64748B" }}>{p.name}</span>
            <span style={{ fontWeight: 600, color: "#0F172A", marginLeft: "auto", paddingLeft: 12 }}>
              {p.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

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
        .hr-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 1100px) { .hr-kpi-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 540px)  { .hr-kpi-grid { grid-template-columns: 1fr; } }
        .hr-chart-panel {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 16px;
          align-items: stretch;
        }
        @media (max-width: 1000px) { .hr-chart-panel { grid-template-columns: 1fr; } }
        .hr-prompt-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (max-width: 700px) { .hr-prompt-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
        <Sidebar active="/hr" onSignOut={signOut} />

        <main className="takt-main" style={{ flex: 1, padding: "36px 40px", minWidth: 0 }}>

          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
            <div>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Skeleton w={200} h={26} radius={6} />
                  <Skeleton w={140} h={14} radius={4} />
                </div>
              ) : (
                <>
                  <h1 style={{ fontSize: 24, fontWeight: 600, color: "#0F172A", margin: 0 }}>
                    Team Performance
                  </h1>
                  <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>
                    Week {currentWeek}, {currentYear}
                    {participation && (
                      <> · {participation.totalEmployees} employees</>
                    )}
                  </p>
                </>
              )}
            </div>

            {/* Week range toggle */}
            <div style={{ display: "flex", gap: 4, background: "#F1F5F9", padding: 4, borderRadius: 8 }}>
              {([4, 8, 12] as const).map(w => (
                <button
                  key={w}
                  onClick={() => setWeekRange(w)}
                  style={{
                    padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: 500,
                    background: weekRange === w ? "#FFFFFF" : "transparent",
                    color: weekRange === w ? "#0F172A" : "#64748B",
                    boxShadow: weekRange === w ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {w}w
                </button>
              ))}
            </div>
          </div>

          {/* ── KPI cards ── */}
          <div className="hr-kpi-grid" style={{ marginBottom: 16 }}>
            <KpiCard
              label="Participation"
              value={loading ? "—" : `${participationRate.toFixed(1)}%`}
              sub={loading ? "" : `${participation?.checkedInCount ?? 0} of ${participation?.totalEmployees ?? 0} checked in`}
              loading={loading}
            />
            <KpiCard
              label="Training Adherence"
              value={loading ? "—" : `${adherenceRate.toFixed(1)}%`}
              sub="Sessions completed this week"
              loading={loading}
            />
            <KpiCard
              label="Team Mood"
              value={loading ? "—" : latest?.avgMood != null ? `${latest.avgMood.toFixed(1)}` : "—"}
              sub={loading ? "" : activeCultureQuestion?.question ? `"${activeCultureQuestion.question}"` : "Latest week average"}
              valueColor={loading || !latest ? "#0F172A" : scoreColor(latest.avgMood)}
              loading={loading}
            />
            <KpiCard
              label="Flagged Members"
              value={loading ? "—" : `${flaggedCount}`}
              sub="Declining mood or energy"
              valueColor={!loading && flaggedCount > 0 ? "#F97316" : "#0F172A"}
              loading={loading}
            />
          </div>

          {/* ── Wellbeing trends + snapshot ── */}
          <div className="hr-chart-panel" style={{ marginBottom: 16 }}>

            {/* Trend chart */}
            <Card style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>
                Wellbeing Trends
              </div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 20 }}>
                Team averages over the last {weekRange} weeks
              </div>
              {loading ? (
                <Skeleton w="100%" h={240} radius={8} />
              ) : chartData.length === 0 ? (
                <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 13, color: "#CBD5E1" }}>No data yet</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12, color: "#64748B", paddingTop: 12 }}
                    />
                    <Line type="monotone" dataKey="energy" name="Energy" stroke="#0D9488" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="mood"   name="Mood"   stroke="#6366F1" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="stress" name="Stress" stroke="#F97316" strokeWidth={2} dot={false} strokeDasharray="5 3" activeDot={{ r: 4, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* This week's snapshot */}
            <Card style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>
                  This Week
                </div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 24 }}>
                  Current team averages
                </div>
                {loading ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {[...Array(4)].map((_, i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <Skeleton w={60} h={11} />
                          <Skeleton w={30} h={11} />
                        </div>
                        <Skeleton w="100%" h={6} radius={3} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <SnapshotBar label="Energy"  value={latest?.avgEnergy}  color="#0D9488" />
                    <SnapshotBar label="Mood"    value={latest?.avgMood}    color="#6366F1" />
                    <SnapshotBar label="Stress"  value={latest?.avgStress}  color="#F97316" invert />
                    <SnapshotBar label="Culture" value={latest?.avgCulture ?? undefined} color="#8B5CF6" />
                  </div>
                )}
              </div>
              {!loading && latest && (
                <div style={{
                  marginTop: 24, paddingTop: 16, borderTop: "1px solid #F1F5F9",
                  fontSize: 11, color: "#94A3B8",
                }}>
                  Stress bar inverted — longer = lower stress = better
                </div>
              )}
            </Card>
          </div>

          {/* ── Sessions per week (bar chart) ── */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>
              Avg Sessions Completed
            </div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 20 }}>
              Team average per week · target ≥ 4
            </div>
            {loading ? (
              <Skeleton w="100%" h={160} radius={8} />
            ) : chartData.length === 0 ? (
              <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 13, color: "#CBD5E1" }}>No data yet</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 6]} tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <ReferenceLine y={4} stroke="#0D9488" strokeDasharray="4 2" strokeOpacity={0.5} label={{ value: "target", position: "right", fontSize: 10, fill: "#0D9488" }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="sessions" name="Avg sessions" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={barColor(entry.sessions)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* ── Action prompts (conditional) ── */}
          {!loading && prompts.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 12 }}>
                Suggested Actions
                <span style={{
                  marginLeft: 8, fontSize: 11, fontWeight: 500,
                  color: prompts.some(p => p.severity === "critical") ? "#B91C1C" : "#C2410C",
                  background: prompts.some(p => p.severity === "critical") ? "#FEF2F2" : "#FFF7ED",
                  padding: "2px 8px", borderRadius: 20,
                }}>
                  {prompts.length} prompt{prompts.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="hr-prompt-grid">
                {prompts.map(p => <ActionPromptCard key={p.id} prompt={p} />)}
              </div>
            </div>
          )}

          {/* ── Team breakdown table ── */}
          <TeamTable members={teamMembers} currentWeek={currentWeek} loading={loading} />

        </main>

        <BottomTabs active="/hr" />
      </div>
    </>
  );
}
