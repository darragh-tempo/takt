"use client";

import { scoreColor } from "./layout";
import type { TeamMember } from "@/lib/queries/hr-dashboard";

// ─── Score cell ───────────────────────────────────────────────────────────────

export function ScoreCell({ value, invert = false }: { value: number | undefined; invert?: boolean }) {
  if (value === undefined) {
    return <span style={{ color: "#CBD5E1", fontSize: 13 }}>—</span>;
  }
  return (
    <span style={{ fontSize: 13, fontWeight: 600, color: scoreColor(value, invert) }}>
      {value}
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

export function StatusBadge({ member }: { member: TeamMember }) {
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

// ─── Team table ───────────────────────────────────────────────────────────────

const COL: React.CSSProperties = {
  padding: "11px 12px 11px 0",
  fontSize: 13,
  textAlign: "left",
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

export function TeamTable({
  members,
  loading,
  skeletonRows = 5,
}: {
  members: TeamMember[];
  loading: boolean;
  skeletonRows?: number;
}) {
  // Flagged first, then checked-in this week, then alphabetical
  const sorted = [...members].sort((a, b) => {
    if (a.flagged !== b.flagged) return a.flagged ? -1 : 1;
    if (!a.checkedInThisWeek && b.checkedInThisWeek) return 1;
    if (a.checkedInThisWeek && !b.checkedInThisWeek) return -1;
    return a.fullName.localeCompare(b.fullName);
  });

  return (
    <div style={{ overflowX: "auto" }}>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 20 }}>
          {[...Array(skeletonRows)].map((_, i) => (
            <div key={i} style={{
              height: 40, borderRadius: 6,
              background: "linear-gradient(90deg,#F1F5F9 25%,#E8EDF2 50%,#F1F5F9 75%)",
              backgroundSize: "200% 100%", animation: "takt-shimmer 1.4s infinite",
            }} />
          ))}
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
                <td style={COL}><StatusBadge member={m} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && sorted.length > 0 && (
        <div style={{ padding: "10px 20px 14px", borderTop: "1px solid #F1F5F9" }}>
          <span style={{ fontSize: 11, color: "#CBD5E1" }}>
            Green ≥ 8 · Amber 5–7 · Red ≤ 4 · Stress & RPE are inverted (lower = better)
          </span>
        </div>
      )}
    </div>
  );
}
