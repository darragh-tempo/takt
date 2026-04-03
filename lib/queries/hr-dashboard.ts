import { supabase } from "@/lib/supabase-browser";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function isoWeekNumber(d: Date): number {
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

// ---------------------------------------------------------------------------
// v_company_participation
// ---------------------------------------------------------------------------

export interface Participation {
  checkedInCount: number;
  totalEmployees: number;
  participationRate: number;
}

export async function getParticipation(
  companyId: string
): Promise<Participation | null> {
  const { data, error } = await supabase
    .from("v_company_participation")
    .select("checked_in_count, total_employees, participation_rate")
    .eq("company_id", companyId)
    .single();

  if (error || !data) return null;

  return {
    checkedInCount: Number(data.checked_in_count),
    totalEmployees: Number(data.total_employees),
    participationRate: Number(data.participation_rate),
  };
}

// ---------------------------------------------------------------------------
// v_company_weekly_averages
// ---------------------------------------------------------------------------

export interface WeeklyAverage {
  weekNumber: number;
  year: number;
  responseCount: number;
  avgSessions: number;
  avgRpe: number;
  avgEnergy: number;
  avgStress: number;
  avgMood: number;
  avgCulture: number | null;
}

export async function getWeeklyAverages(
  companyId: string,
  weeks: number = 4
): Promise<WeeklyAverage[]> {
  const { data, error } = await supabase
    .from("v_company_weekly_averages")
    .select(
      "week_number, year, response_count, avg_sessions, avg_rpe, avg_energy, avg_stress, avg_mood, avg_culture"
    )
    .eq("company_id", companyId)
    .order("year", { ascending: false })
    .order("week_number", { ascending: false })
    .limit(weeks);

  if (error || !data) return [];

  return data.map((row) => ({
    weekNumber: row.week_number,
    year: row.year,
    responseCount: Number(row.response_count),
    avgSessions: Number(row.avg_sessions),
    avgRpe: Number(row.avg_rpe),
    avgEnergy: Number(row.avg_energy),
    avgStress: Number(row.avg_stress),
    avgMood: Number(row.avg_mood),
    avgCulture: row.avg_culture != null ? Number(row.avg_culture) : null,
  }));
}

// ---------------------------------------------------------------------------
// v_company_training_adherence
// ---------------------------------------------------------------------------

export interface TrainingAdherence {
  adherenceRate: number;
}

export async function getTrainingAdherence(
  companyId: string
): Promise<TrainingAdherence | null> {
  const { data, error } = await supabase
    .from("v_company_training_adherence")
    .select("adherence_rate")
    .eq("company_id", companyId)
    .single();

  if (error || !data) return null;

  return { adherenceRate: Number(data.adherence_rate) };
}

// ---------------------------------------------------------------------------
// v_company_flagged_employees
// ---------------------------------------------------------------------------

export interface FlaggedEmployees {
  flaggedCount: number;
}

export async function getFlaggedEmployees(
  companyId: string
): Promise<FlaggedEmployees | null> {
  const { data, error } = await supabase
    .from("v_company_flagged_employees")
    .select("flagged_count")
    .eq("company_id", companyId)
    .single();

  if (error || !data) return null;

  return { flaggedCount: Number(data.flagged_count) };
}

// ---------------------------------------------------------------------------
// culture_questions
// ---------------------------------------------------------------------------

export interface ActiveCultureQuestion {
  question: string;
}

export async function getActiveCultureQuestion(
  companyId: string
): Promise<ActiveCultureQuestion | null> {
  const { data, error } = await supabase
    .from("culture_questions")
    .select("question")
    .eq("company_id", companyId)
    .eq("is_active", true)
    .limit(1)
    .single();

  if (error || !data) return null;

  return { question: data.question };
}

// ---------------------------------------------------------------------------
// Per-employee breakdown (for the team table)
// ---------------------------------------------------------------------------

export interface TeamMember {
  id: string;
  fullName: string;
  assignedPlan: string | null;
  currentWeek: number;
  latestCheckIn: {
    mood: number;
    energyLevel: number;
    stressLevel: number;
    sessionsCompleted: number;
    rpe: number;
    weekNumber: number;
  } | null;
  /** true when mood OR energy dropped ≥ 2 pts vs the preceding week */
  flagged: boolean;
  /** true when latestCheckIn.weekNumber matches the current ISO week */
  checkedInThisWeek: boolean;
}

export async function getTeamBreakdown(companyId: string): Promise<TeamMember[]> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentWeek = isoWeekNumber(now);

  const { data: employees, error: empErr } = await supabase
    .from("profiles")
    .select("id, full_name, assigned_plan, current_week")
    .eq("company_id", companyId)
    .eq("role", "employee")
    .eq("onboarding_complete", true)
    .order("full_name");

  if (empErr || !employees || employees.length === 0) return [];

  const ids = employees.map((e) => e.id);

  // Fetch last 8 weeks of check-ins for these employees
  const { data: checkIns } = await supabase
    .from("check_ins")
    .select(
      "employee_id, mood, energy_level, stress_level, sessions_completed, rpe, week_number, year"
    )
    .in("employee_id", ids)
    .eq("year", currentYear)
    .gte("week_number", Math.max(1, currentWeek - 8))
    .order("week_number", { ascending: false });

  // Group check-ins by employee_id, already ordered most-recent-first
  const ciMap = new Map<string, typeof checkIns>();
  for (const ci of checkIns ?? []) {
    const arr = ciMap.get(ci.employee_id) ?? [];
    arr.push(ci);
    ciMap.set(ci.employee_id, arr);
  }

  return employees.map((emp) => {
    const cis = ciMap.get(emp.id) ?? [];
    const latest = cis[0] ?? null;

    // Compare to the immediately preceding week (not just cis[1])
    const prev = latest
      ? (cis.find(
          (c) => c.week_number === latest.week_number - 1 && c.year === latest.year
        ) ?? null)
      : null;

    const flagged = !!(
      latest &&
      prev &&
      (latest.mood - prev.mood <= -2 || latest.energy_level - prev.energy_level <= -2)
    );

    return {
      id: emp.id,
      fullName: emp.full_name ?? "Unknown",
      assignedPlan: emp.assigned_plan,
      currentWeek: emp.current_week ?? 1,
      latestCheckIn: latest
        ? {
            mood: latest.mood,
            energyLevel: latest.energy_level,
            stressLevel: latest.stress_level,
            sessionsCompleted: latest.sessions_completed,
            rpe: latest.rpe,
            weekNumber: latest.week_number,
          }
        : null,
      flagged,
      checkedInThisWeek: latest?.week_number === currentWeek,
    };
  });
}
