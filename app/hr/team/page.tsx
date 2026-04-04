"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import { getTeamBreakdown, getParticipation } from "@/lib/queries/hr-dashboard";
import type { TeamMember, Participation } from "@/lib/queries/hr-dashboard";
import { isoWeek, Sidebar, BottomTabs, Skeleton, Card, HrPageStyles } from "../_components/layout";
import { TeamTable } from "../_components/team-table";

// ─── Filter types ─────────────────────────────────────────────────────────────

type StatusFilter = "all" | "flagged" | "active" | "nodata";

const FILTER_LABELS: Record<StatusFilter, string> = {
  all:     "All",
  flagged: "Flagged",
  active:  "Active",
  nodata:  "No data",
};

function filterMembers(members: TeamMember[], filter: StatusFilter, query: string): TeamMember[] {
  let result = members;

  if (query.trim()) {
    const q = query.trim().toLowerCase();
    result = result.filter(m => m.fullName.toLowerCase().includes(q));
  }

  switch (filter) {
    case "flagged": return result.filter(m => m.flagged);
    case "active":  return result.filter(m => m.checkedInThisWeek && !m.flagged);
    case "nodata":  return result.filter(m => !m.latestCheckIn);
    default:        return result;
  }
}

function filterCount(members: TeamMember[], filter: StatusFilter): number {
  switch (filter) {
    case "flagged": return members.filter(m => m.flagged).length;
    case "active":  return members.filter(m => m.checkedInThisWeek && !m.flagged).length;
    case "nodata":  return members.filter(m => !m.latestCheckIn).length;
    default:        return members.length;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamOverviewPage() {
  const router = useRouter();
  const [loading,       setLoading]       = useState(true);
  const [members,       setMembers]       = useState<TeamMember[]>([]);
  const [participation, setParticipation] = useState<Participation | null>(null);
  const [filter,        setFilter]        = useState<StatusFilter>("all");
  const [search,        setSearch]        = useState("");

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

    const [team, part] = await Promise.all([
      getTeamBreakdown(companyId),
      getParticipation(companyId),
    ]);

    setMembers(team);
    setParticipation(part);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const filtered = filterMembers(members, filter, search);

  const FILTERS: StatusFilter[] = ["all", "flagged", "active", "nodata"];

  return (
    <>
      <HrPageStyles />
      <style>{`
        .team-filter-tab {
          padding: 6px 14px; border-radius: 6px; border: 1px solid #E2E8F0;
          font-size: 13px; font-weight: 500; cursor: pointer;
          background: transparent; transition: all 0.12s;
          display: flex; align-items: center; gap: 6px;
        }
        .team-filter-tab:hover { background: #F8FAFC; }
        .team-filter-tab.active {
          background: #F0FDFA; border-color: #99F6E4; color: #0D9488;
        }
        .team-filter-tab.active-flagged {
          background: #FFF7ED; border-color: #FED7AA; color: #C2410C;
        }
        .team-search {
          width: 100%; max-width: 280px;
          padding: 8px 12px; border-radius: 8px;
          border: 1px solid #E2E8F0; font-size: 13px;
          color: #0F172A; background: #FFFFFF; outline: none;
          transition: border-color 0.15s;
        }
        .team-search:focus { border-color: #0D9488; }
        .team-search::placeholder { color: #94A3B8; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#F8FAFC", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
        <Sidebar active="/hr/team" onSignOut={signOut} />

        <main className="takt-main" style={{ flex: 1, padding: "36px 40px", minWidth: 0 }}>

          {/* ── Header ── */}
          <div style={{ marginBottom: 28 }}>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Skeleton w={200} h={26} radius={6} />
                <Skeleton w={180} h={14} radius={4} />
              </div>
            ) : (
              <>
                <h1 style={{ fontSize: 24, fontWeight: 600, color: "#0F172A", margin: 0 }}>
                  Team Overview
                </h1>
                <p style={{ fontSize: 13, color: "#64748B", margin: "4px 0 0" }}>
                  Week {currentWeek}, {currentYear}
                  {participation && (
                    <> · {participation.checkedInCount} of {participation.totalEmployees} checked in this week ({participation.participationRate.toFixed(0)}%)</>
                  )}
                </p>
              </>
            )}
          </div>

          {/* ── Stat pills ── */}
          {!loading && (
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
              {[
                { label: "Total",   value: members.length,                                         color: "#64748B", bg: "#F8FAFC",  border: "#E2E8F0" },
                { label: "Flagged", value: members.filter(m => m.flagged).length,                  color: "#C2410C", bg: "#FFF7ED",  border: "#FED7AA" },
                { label: "Active",  value: members.filter(m => m.checkedInThisWeek).length,        color: "#0D9488", bg: "#F0FDFA",  border: "#CCFBF1" },
                { label: "No data", value: members.filter(m => !m.latestCheckIn).length,           color: "#94A3B8", bg: "#F1F5F9",  border: "#E2E8F0" },
              ].map(s => (
                <div key={s.label} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 14px", borderRadius: 8,
                  background: s.bg, border: `1px solid ${s.border}`,
                }}>
                  <span style={{ fontSize: 22, fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.value}</span>
                  <span style={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Filters + search ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {FILTERS.map(f => {
                const isActive = filter === f;
                const count    = loading ? null : filterCount(members, f);
                const isFlagged = f === "flagged" && count && count > 0;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`team-filter-tab${isActive ? (isFlagged ? " active-flagged" : " active") : ""}`}
                    style={{ color: isActive ? undefined : "#64748B" }}
                  >
                    {FILTER_LABELS[f]}
                    {count !== null && (
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        background: isActive ? "rgba(0,0,0,0.08)" : "#F1F5F9",
                        color: "inherit",
                        padding: "1px 6px", borderRadius: 10,
                      }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <input
              type="search"
              className="team-search"
              placeholder="Search by name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* ── Table ── */}
          <Card style={{ padding: 0 }}>
            <div style={{ padding: "18px 20px 0", borderBottom: "1px solid #F1F5F9" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 14 }}>
                {FILTER_LABELS[filter]}
                {!loading && (
                  <span style={{ fontSize: 12, fontWeight: 400, color: "#94A3B8", marginLeft: 8 }}>
                    {filtered.length} {filtered.length === 1 ? "member" : "members"}
                    {search && ` matching "${search}"`}
                    {" · "}individual wellbeing indicators — visible to HR only
                  </span>
                )}
              </div>
            </div>

            {/* Empty state when search/filter returns nothing */}
            {!loading && filtered.length === 0 && members.length > 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 8 }}>
                  No members match the current filter{search ? ` and search` : ""}.
                </div>
                <button
                  onClick={() => { setFilter("all"); setSearch(""); }}
                  style={{
                    fontSize: 12, fontWeight: 500, color: "#0D9488",
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <TeamTable members={filtered} loading={loading} skeletonRows={8} />
            )}
          </Card>

        </main>

        <BottomTabs active="/hr/team" />
      </div>
    </>
  );
}
