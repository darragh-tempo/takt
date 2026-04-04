"use client";

// ─── Shared helpers ───────────────────────────────────────────────────────────

export function isoWeek(d: Date): number {
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const ys = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc.getTime() - ys.getTime()) / 86_400_000 + 1) / 7);
}

export function scoreColor(v: number, invert = false): string {
  const good = invert ? v <= 4 : v >= 8;
  const mid  = invert ? v <= 6 : v >= 5;
  return good ? "#22C55E" : mid ? "#F59E0B" : "#EF4444";
}

export function barColor(sessions: number): string {
  if (sessions >= 4)   return "#0D9488";
  if (sessions >= 2.5) return "#F59E0B";
  return "#EF4444";
}

// ─── Icons ────────────────────────────────────────────────────────────────────

export function IconDashboard({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1"    y="1"    width="6.5" height="6.5" rx="1.5" stroke={color} strokeWidth="1.5" />
      <rect x="10.5" y="1"    width="6.5" height="6.5" rx="1.5" stroke={color} strokeWidth="1.5" />
      <rect x="1"    y="10.5" width="6.5" height="6.5" rx="1.5" stroke={color} strokeWidth="1.5" />
      <rect x="10.5" y="10.5" width="6.5" height="6.5" rx="1.5" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function IconTeam({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="6.5"  cy="6" r="2.5" stroke={color} strokeWidth="1.5" />
      <circle cx="12.5" cy="6" r="2"   stroke={color} strokeWidth="1.5" />
      <path d="M1 15c0-2.76 2.46-5 5.5-5s5.5 2.24 5.5 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 11c1.66 0 3 1.34 3 3"                  stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconReports({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="3" y="2" width="12" height="14" rx="2" stroke={color} strokeWidth="1.5" />
      <line x1="6.5" y1="6"  x2="11.5" y2="6"  stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6.5" y1="9"  x2="11.5" y2="9"  stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="6.5" y1="12" x2="9.5"  y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconSignOut({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3"          stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 11l3-3-3-3"                                 stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="14" y1="8" x2="6" y2="8"                      stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconAlert({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L15 14H1L8 2z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="8" y1="7" x2="8" y2="10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="12" r="0.75" fill={color} />
    </svg>
  );
}

export function IconInfo({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.5" />
      <line x1="8" y1="7.5" x2="8" y2="11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="5.5" r="0.75" fill={color} />
    </svg>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

export const NAV = [
  { label: "Dashboard",     href: "/hr",          Icon: IconDashboard },
  { label: "Team Overview", href: "/hr/team",     Icon: IconTeam      },
  { label: "Reports",       href: "/hr/reports",  Icon: IconReports   },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar({ active, onSignOut }: { active: string; onSignOut: () => void }) {
  return (
    <aside
      className="takt-sidebar"
      style={{
        width: 220, flexShrink: 0, background: "#FFFFFF",
        borderRight: "1px solid #E2E8F0", display: "flex", flexDirection: "column",
        height: "100vh", position: "sticky", top: 0,
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
        <button
          onClick={onSignOut}
          style={{
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

export function BottomTabs({ active }: { active: string }) {
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

export function Skeleton({ w, h, radius = 6 }: { w: string | number; h: number; radius?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: "linear-gradient(90deg,#F1F5F9 25%,#E8EDF2 50%,#F1F5F9 75%)",
      backgroundSize: "200% 100%", animation: "takt-shimmer 1.4s infinite",
    }} />
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
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

// ─── Shared page chrome ───────────────────────────────────────────────────────

/** Injects the shimmer keyframe + responsive visibility rules used by all HR pages. */
export function HrPageStyles() {
  return (
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
    `}</style>
  );
}
