"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import { getWeeklyAverages, getParticipation } from "@/lib/queries/hr-dashboard";
import type { WeeklyAverage, Participation } from "@/lib/queries/hr-dashboard";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import {
  isoWeek, scoreColor, barColor,
  Sidebar, BottomTabs, Skeleton, Card, HrPageStyles,
} from "../_components/layout";

// ─── Chart tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number }>;
  label?: string;
}) {
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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined, decimals = 1): string {
  if (n == null) return "—";
  return n.toFixed(decimals);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const router = useRouter();
  const [loading,       setLoading]       = useState(true);
  const [allWeeks,      setAllWeeks]      = useState<WeeklyAverage[]>([]);
  const [participation, setParticipation] = useState<Participation | null>(null);
  const [weekRange,     setWeekRange]     = useState<4 | 8 | 12 | 26>(12);

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

    const [avgs, part] = await Promise.all([
      getWeeklyAverages(companyId, 52),
      getParticipation(companyId),
    ]);

    setAllWeeks(avgs);
    setParticipation(part);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  // allWeeks comes back newest-first; reverse for chronological chart display
  const chronological = [...allWeeks].reverse();
  const sliced = chronological.slice(-weekRange);

  const chartData = sliced.map(w => ({
    label:         `Wk ${w.weekNumber}`,
    energy:        Number(w.avgEnergy.toFixed(1)),
    mood:          Number(w.avgMood.toFixed(1)),
    stress:        Number(w.avgStress.toFixed(1)),
    rpe:           Number(w.avgRpe.toFixed(1)),
    sessions:      Number(w.avgSessions.toFixed(1)),
    responses:     w.responseCount,
    culture:       w.avgCulture != null ? Number(w.avgCulture.toFixed(1)) : null,
  }));

  // Summary stats over the selected window
  const n = sliced.length;
  const avg = (key: keyof WeeklyAverage) => {
    const vals = sliced.map(w => Number(w[key])).filter(v => !isNaN(v));
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const summaryStats = n === 0 ? null : {
    avgMood:     avg("avgMood"),
    avgEnergy:   avg("avgEnergy"),
    avgStress:   avg("avgStress"),
    avgRpe:      avg("avgRpe"),
    avgSessions: avg("avgSessions"),
    totalResponses: sliced.reduce((s, w) => s + w.responseCount, 0),
  };

  return (
    <>
      <HrPageStyles />
      <style>{`
        .reports-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
        }
        @media (max-width: 900px) { .reports-grid { grid-template-columns: 1fr; } }
        .reports-summary-grid {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
        }
        @media (max-width: 600px) { .reports-summary-grid { grid-template-columns: repeat(2, 1fr); } }
        .reports-table th, .reports-table td {
          padding: 9px 12px; font-size: 12px; text-align: right; white-space: nowrap;
        }
        .reports-table th:first-child, .reports-table td:first-child { text-align: left; }
        .reports-table tbody tr:hover { background: #F8FAFC; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
        <Sidebar active="/hr/reports" onSignOut={signOut} />

        <main className="takt-main" style={{ flex: 1, padding: "36px 40px", minWidth: 0 }}>

          {/* ── Header ── */}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
            <div>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <Skeleton w={160} h={26} radius={6} />
                  <Skeleton w={200} h={14} radius={4} />
                </div>
              ) : (
                <>
                  <h1 style={{ fontSize: 24, fontWeight: 600, color: "#0F172A", margin: 0 }}>Reports</h1>
                  <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>
                    Week {currentWeek}, {currentYear}
                    {participation && <> · {participation.totalEmployees} employees</>}
                    {allWeeks.length > 0 && <> · {allWeeks.length} weeks of data</>}
                  </p>
                </>
              )}
            </div>

            {/* Week range toggle */}
            <div style={{ display: "flex", gap: 4, background: "#F1F5F9", padding: 4, borderRadius: 8 }}>
              {([4, 8, 12, 26] as const).map(w => (
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

          {/* ── Period summary ── */}
          {!loading && summaryStats && (
            <div className="reports-summary-grid" style={{ marginBottom: 16 }}>
              {[
                { label: "Avg Mood",     value: fmt(summaryStats.avgMood),     color: scoreColor(summaryStats.avgMood ?? 0) },
                { label: "Avg Energy",   value: fmt(summaryStats.avgEnergy),   color: scoreColor(summaryStats.avgEnergy ?? 0) },
                { label: "Avg Stress",   value: fmt(summaryStats.avgStress),   color: scoreColor(summaryStats.avgStress ?? 0, true) },
                { label: "Avg RPE",      value: fmt(summaryStats.avgRpe),      color: scoreColor(summaryStats.avgRpe ?? 0, true) },
                { label: "Avg Sessions", value: fmt(summaryStats.avgSessions), color: barColor(summaryStats.avgSessions ?? 0) },
                { label: "Total Responses", value: `${summaryStats.totalResponses}`, color: "#0D9488" },
              ].map(s => (
                <Card key={s.label}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 600, color: s.color, lineHeight: 1 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
                    {weekRange}-week average
                  </div>
                </Card>
              ))}
            </div>
          )}
          {loading && (
            <div className="reports-summary-grid" style={{ marginBottom: 16 }}>
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <Skeleton w="55%" h={11} />
                    <Skeleton w="40%" h={28} radius={6} />
                    <Skeleton w="60%" h={10} />
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* ── Wellbeing + RPE charts ── */}
          <div className="reports-grid" style={{ marginBottom: 16 }}>

            {/* Wellbeing trends */}
            <Card style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>Wellbeing Trends</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 20 }}>
                Energy, mood & stress over {weekRange} weeks
              </div>
              {loading ? <Skeleton w="100%" h={220} radius={8} /> : chartData.length === 0 ? (
                <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 13, color: "#CBD5E1" }}>No data yet</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                    <Line type="monotone" dataKey="energy" name="Energy" stroke="#0D9488" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="mood"   name="Mood"   stroke="#6366F1" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="stress" name="Stress" stroke="#F97316" strokeWidth={2} dot={false} strokeDasharray="5 3" activeDot={{ r: 4, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* RPE trend */}
            <Card style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>Training Intensity (RPE)</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 20 }}>
                Rate of perceived exertion over {weekRange} weeks · lower = easier
              </div>
              {loading ? <Skeleton w="100%" h={220} radius={8} /> : chartData.length === 0 ? (
                <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 13, color: "#CBD5E1" }}>No data yet</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <ReferenceLine y={7} stroke="#F97316" strokeDasharray="4 2" strokeOpacity={0.4}
                      label={{ value: "high", position: "right", fontSize: 10, fill: "#F97316" }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                    <Line type="monotone" dataKey="rpe" name="RPE" stroke="#EC4899" strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* ── Sessions + Response count charts ── */}
          <div className="reports-grid" style={{ marginBottom: 16 }}>

            {/* Sessions per week */}
            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>Avg Sessions Completed</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 20 }}>Team average per week · target ≥ 4</div>
              {loading ? <Skeleton w="100%" h={180} radius={8} /> : chartData.length === 0 ? (
                <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 13, color: "#CBD5E1" }}>No data yet</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 6]}  tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <ReferenceLine y={4} stroke="#0D9488" strokeDasharray="4 2" strokeOpacity={0.5}
                      label={{ value: "target", position: "right", fontSize: 10, fill: "#0D9488" }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="sessions" name="Avg sessions" radius={[4, 4, 0, 0]} maxBarSize={40}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={barColor(entry.sessions)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Response count */}
            <Card>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>Check-in Responses</div>
              <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 20 }}>
                Number of check-ins submitted per week
                {participation && ` · team size ${participation.totalEmployees}`}
              </div>
              {loading ? <Skeleton w="100%" h={180} radius={8} /> : chartData.length === 0 ? (
                <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 13, color: "#CBD5E1" }}>No data yet</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="label"     tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    {participation && (
                      <ReferenceLine
                        y={participation.totalEmployees}
                        stroke="#6366F1" strokeDasharray="4 2" strokeOpacity={0.5}
                        label={{ value: "team size", position: "right", fontSize: 10, fill: "#6366F1" }}
                      />
                    )}
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="responses" name="Responses" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={40} fillOpacity={0.75} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* ── Weekly data table ── */}
          <Card style={{ padding: 0 }}>
            <div style={{ padding: "18px 20px 0", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 14 }}>
                Weekly Breakdown
                <span style={{ fontSize: 12, fontWeight: 400, color: "#94A3B8", marginLeft: 8 }}>
                  last {weekRange} weeks · newest first
                </span>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 20 }}>
                  {[...Array(6)].map((_, i) => <Skeleton key={i} w="100%" h={36} radius={6} />)}
                </div>
              ) : sliced.length === 0 ? (
                <div style={{ padding: "32px 20px", color: "#94A3B8", fontSize: 13, textAlign: "center" }}>
                  No data available.
                </div>
              ) : (
                <table className="reports-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                      {["Week", "Responses", "Mood", "Energy", "Stress", "RPE", "Sessions", "Culture"].map(h => (
                        <th key={h} style={{
                          fontSize: 11, fontWeight: 500, color: "#94A3B8",
                          textTransform: "uppercase", letterSpacing: "0.06em",
                          paddingBottom: 12, whiteSpace: "nowrap",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Display newest-first in table */}
                    {[...sliced].reverse().map((w, i) => {
                      const isCurrentWeek = w.weekNumber === currentWeek && w.year === currentYear;
                      return (
                        <tr key={`${w.year}-${w.weekNumber}`} style={{
                          borderBottom: i < sliced.length - 1 ? "1px solid #F8FAFC" : "none",
                        }}>
                          <td style={{ fontWeight: isCurrentWeek ? 600 : 400, color: isCurrentWeek ? "#0D9488" : "#0F172A" }}>
                            Wk {w.weekNumber}{isCurrentWeek ? " ·" : ""}{isCurrentWeek && <span style={{ fontSize: 10, marginLeft: 4, color: "#0D9488", fontWeight: 500 }}>current</span>}
                          </td>
                          <td style={{ color: "#64748B" }}>{w.responseCount}</td>
                          <td style={{ color: scoreColor(w.avgMood),              fontWeight: 500 }}>{fmt(w.avgMood)}</td>
                          <td style={{ color: scoreColor(w.avgEnergy),            fontWeight: 500 }}>{fmt(w.avgEnergy)}</td>
                          <td style={{ color: scoreColor(w.avgStress, true),      fontWeight: 500 }}>{fmt(w.avgStress)}</td>
                          <td style={{ color: scoreColor(w.avgRpe, true),         fontWeight: 500 }}>{fmt(w.avgRpe)}</td>
                          <td style={{ color: barColor(w.avgSessions),            fontWeight: 500 }}>{fmt(w.avgSessions)}</td>
                          <td style={{ color: "#64748B" }}>{w.avgCulture != null ? fmt(w.avgCulture) : <span style={{ color: "#CBD5E1" }}>—</span>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            {!loading && sliced.length > 0 && (
              <div style={{ padding: "10px 20px 14px", borderTop: "1px solid #F1F5F9" }}>
                <span style={{ fontSize: 11, color: "#CBD5E1" }}>
                  Green ≥ 8 · Amber 5–7 · Red ≤ 4 · Stress & RPE are inverted (lower = better)
                </span>
              </div>
            )}
          </Card>

        </main>

        <BottomTabs active="/hr/reports" />
      </div>
    </>
  );
}
