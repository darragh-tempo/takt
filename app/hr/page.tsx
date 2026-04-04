"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine,
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
  Participation, WeeklyAverage, TrainingAdherence,
  FlaggedEmployees, ActiveCultureQuestion, TeamMember,
} from "@/lib/queries/hr-dashboard";
import {
  isoWeek, scoreColor, barColor,
  Sidebar, BottomTabs, Skeleton, Card, HrPageStyles,
  IconAlert, IconInfo,
} from "./_components/layout";
import { TeamTable } from "./_components/team-table";

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
      body: pct >= 0.2
        ? `Over 20% of your team has dropped 2+ points in mood or energy since last week.`
        : `Mood or energy has dropped significantly for ${d.flaggedCount} individual${d.flaggedCount > 1 ? "s" : ""}.`,
      suggestion: pct >= 0.2
        ? "Consider a company-wide wellbeing check-in or team meeting."
        : "Arrange a 1:1 conversation with flagged individuals this week.",
    });
  }

  if (d.avgStress >= 7) {
    ps.push({
      id: "stress-high", severity: "critical",
      title: "Team stress is elevated",
      body: `Average stress is ${d.avgStress.toFixed(1)}/10 — above the concern threshold of 7.`,
      suggestion: "Host a team reset session or reduce meeting load this week.",
    });
  } else if (d.avgStress >= 6) {
    ps.push({
      id: "stress-mid", severity: "warning",
      title: "Stress levels are rising",
      body: `Average stress is ${d.avgStress.toFixed(1)}/10 — trending upwards.`,
      suggestion: "Consider a structured break or a short wellbeing session.",
    });
  }

  if (d.avgMood < 5) {
    ps.push({
      id: "mood-low", severity: "critical",
      title: "Team mood is low",
      body: `Average mood is ${d.avgMood.toFixed(1)}/10 — below the 5/10 concern threshold.`,
      suggestion: "Organise a team event, social, or dedicated wellness day.",
    });
  } else if (d.avgMood < 6.5 && d.avgMood > 0) {
    ps.push({
      id: "mood-mid", severity: "warning",
      title: "Team mood below target",
      body: `Average mood is ${d.avgMood.toFixed(1)}/10.`,
      suggestion: "Consider a team recognition moment or light social activity.",
    });
  }

  if (d.participationRate < 60 && d.participationRate >= 0) {
    ps.push({
      id: "participation", severity: "warning",
      title: "Check-in participation is low",
      body: `Only ${d.participationRate.toFixed(0)}% of your team submitted this week.`,
      suggestion: "Send a reminder — data gaps make it harder to support your team.",
    });
  }

  if (d.adherenceRate < 50 && d.adherenceRate >= 0) {
    ps.push({
      id: "adherence", severity: "info",
      title: "Training adherence needs attention",
      body: `${d.adherenceRate.toFixed(0)}% of planned sessions completed this week.`,
      suggestion: "Review training barriers with employees or your TEMPO coach.",
    });
  }

  return ps;
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
      borderLeft: `4px solid ${s.border}`, background: s.bg,
      borderRadius: "0 10px 10px 0", padding: "14px 16px",
      display: "flex", gap: 12, alignItems: "flex-start",
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

// ─── Snapshot bar ─────────────────────────────────────────────────────────────

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
          {value !== undefined ? v.toFixed(1) : "—"}
          <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 400 }}>/10</span>
        </span>
      </div>
      <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${fill}%`, background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
      </div>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function HrDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [participation,        setParticipation]        = useState<Participation | null>(null);
  const [weeklyAverages,       setWeeklyAverages]       = useState<WeeklyAverage[]>([]);
  const [trainingAdherence,    setTrainingAdherence]    = useState<TrainingAdherence | null>(null);
  const [flaggedEmployees,     setFlaggedEmployees]     = useState<FlaggedEmployees | null>(null);
  const [activeCultureQuestion,setActiveCultureQuestion]= useState<ActiveCultureQuestion | null>(null);
  const [teamMembers,          setTeamMembers]          = useState<TeamMember[]>([]);
  const [weekRange,            setWeekRange]            = useState<4 | 8 | 12>(8);

  const now         = new Date();
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
      getWeeklyAverages(companyId, 12),
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

  const chronological = [...weeklyAverages].reverse();
  const chartData = chronological.slice(-weekRange).map(w => ({
    label:    `Wk ${w.weekNumber}`,
    energy:   Number(w.avgEnergy.toFixed(1)),
    mood:     Number(w.avgMood.toFixed(1)),
    stress:   Number(w.avgStress.toFixed(1)),
    sessions: Number(w.avgSessions.toFixed(1)),
  }));

  const latest           = weeklyAverages[0];
  const participationRate = participation?.participationRate ?? 0;
  const adherenceRate     = trainingAdherence?.adherenceRate ?? 0;
  const flaggedCount      = flaggedEmployees?.flaggedCount ?? 0;
  const totalEmployees    = teamMembers.length;

  const prompts = loading ? [] : generatePrompts({
    participationRate, adherenceRate, flaggedCount, totalEmployees,
    avgMood:   latest?.avgMood   ?? 0,
    avgStress: latest?.avgStress ?? 0,
    avgEnergy: latest?.avgEnergy ?? 0,
  });

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
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 12,
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
      <HrPageStyles />
      <style>{`
        .hr-kpi-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
        }
        @media (max-width: 1100px) { .hr-kpi-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 540px)  { .hr-kpi-grid { grid-template-columns: 1fr; } }
        .hr-chart-panel {
          display: grid; grid-template-columns: 1fr 280px; gap: 16px; align-items: stretch;
        }
        @media (max-width: 1000px) { .hr-chart-panel { grid-template-columns: 1fr; } }
        .hr-prompt-grid {
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
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
                    {participation && <> · {participation.totalEmployees} employees</>}
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
                    color:      weekRange === w ? "#0F172A" : "#64748B",
                    boxShadow:  weekRange === w ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
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

            <Card style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>Wellbeing Trends</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 20 }}>Team averages over the last {weekRange} weeks</div>
              {loading ? <Skeleton w="100%" h={240} radius={8} /> : chartData.length === 0 ? (
                <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 13, color: "#CBD5E1" }}>No data yet</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]}   tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#64748B", paddingTop: 12 }} />
                    <Line type="monotone" dataKey="energy" name="Energy" stroke="#0D9488" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="mood"   name="Mood"   stroke="#6366F1" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="stress" name="Stress" stroke="#F97316" strokeWidth={2} dot={false} strokeDasharray="5 3" activeDot={{ r: 4, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>This Week</div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 24 }}>Current team averages</div>
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
                    <SnapshotBar label="Energy"  value={latest?.avgEnergy}               color="#0D9488" />
                    <SnapshotBar label="Mood"    value={latest?.avgMood}                 color="#6366F1" />
                    <SnapshotBar label="Stress"  value={latest?.avgStress}               color="#F97316" invert />
                    <SnapshotBar label="Culture" value={latest?.avgCulture ?? undefined}  color="#8B5CF6" />
                  </div>
                )}
              </div>
              {!loading && latest && (
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #F1F5F9", fontSize: 11, color: "#94A3B8" }}>
                  Stress bar inverted — longer = lower stress = better
                </div>
              )}
            </Card>
          </div>

          {/* ── Sessions per week ── */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>Avg Sessions Completed</div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 20 }}>Team average per week · target ≥ 4</div>
            {loading ? <Skeleton w="100%" h={160} radius={8} /> : chartData.length === 0 ? (
              <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 13, color: "#CBD5E1" }}>No data yet</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="label"  tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 6]} tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <ReferenceLine y={4} stroke="#0D9488" strokeDasharray="4 2" strokeOpacity={0.5}
                    label={{ value: "target", position: "right", fontSize: 10, fill: "#0D9488" }} />
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

          {/* ── Action prompts ── */}
          {!loading && prompts.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 12 }}>
                Suggested Actions
                <span style={{
                  marginLeft: 8, fontSize: 11, fontWeight: 500,
                  color:      prompts.some(p => p.severity === "critical") ? "#B91C1C" : "#C2410C",
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
          <Card style={{ padding: 0 }}>
            <div style={{ padding: "18px 20px 0", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 14 }}>
                Team Breakdown
                <span style={{ fontSize: 12, fontWeight: 400, color: "#94A3B8", marginLeft: 8 }}>
                  individual wellbeing indicators — visible to HR only
                </span>
              </div>
            </div>
            <TeamTable members={teamMembers} loading={loading} />
          </Card>

        </main>

        <BottomTabs active="/hr" />
      </div>
    </>
  );
}
