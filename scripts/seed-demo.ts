// scripts/seed-demo.ts
//
// Provisions a complete demo environment for the Takt HR dashboard.
//
// Prerequisites:
//   .env.local must contain:
//     NEXT_PUBLIC_SUPABASE_URL=...
//     SUPABASE_SERVICE_ROLE_KEY=...   (Supabase Dashboard → Project Settings → API)
//
// Run with:
//   npm run seed:demo

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Env loading (tsx doesn't auto-load dotenv) ───────────────────────────────

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local may not exist in CI — rely on real env vars
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── ISO week helper ──────────────────────────────────────────────────────────

function getIsoWeekInfo(date: Date): { week: number; year: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return { week, year: d.getUTCFullYear() };
}

// ─── Demo data definitions ────────────────────────────────────────────────────

const DEMO_PASSWORD = "DemoCorp2026!";

const HR_ADMIN = {
  email: "hr@democorp.com",
  full_name: "Sarah Mitchell",
};

// Indices 2, 5, 8 are "struggling" — they show a sharp wellbeing drop in the
// last 2 weeks, which triggers v_company_flagged_employees for the demo.
const EMPLOYEES = [
  { full_name: "Alice Murphy",      email: "alice.murphy@democorp.com",     training_age: "intermediate", equipment_access: "full_gym", assigned_plan: "A" },
  { full_name: "Ciarán Walsh",      email: "ciaran.walsh@democorp.com",     training_age: "beginner",     equipment_access: "home",     assigned_plan: "B" },
  { full_name: "Niamh O'Brien",     email: "niamh.obrien@democorp.com",     training_age: "advanced",     equipment_access: "full_gym", assigned_plan: "A" }, // struggling
  { full_name: "Seán Fitzpatrick",  email: "sean.fitzpatrick@democorp.com", training_age: "intermediate", equipment_access: "none",     assigned_plan: "C" },
  { full_name: "Laura Doherty",     email: "laura.doherty@democorp.com",    training_age: "beginner",     equipment_access: "full_gym", assigned_plan: "B" },
  { full_name: "Rory Gallagher",    email: "rory.gallagher@democorp.com",   training_age: "advanced",     equipment_access: "home",     assigned_plan: "A" }, // struggling
  { full_name: "Emma Byrne",        email: "emma.byrne@democorp.com",       training_age: "intermediate", equipment_access: "full_gym", assigned_plan: "A" },
  { full_name: "Darragh Quinn",     email: "darragh.quinn@democorp.com",    training_age: "beginner",     equipment_access: "none",     assigned_plan: "C" },
  { full_name: "Sinéad Kelly",      email: "sinead.kelly@democorp.com",     training_age: "intermediate", equipment_access: "home",     assigned_plan: "B" }, // struggling
  { full_name: "Patrick Connolly",  email: "patrick.connolly@democorp.com", training_age: "advanced",     equipment_access: "full_gym", assigned_plan: "A" },
] as const;

const STRUGGLING_INDICES = new Set([2, 5, 8]);

// Per-week check-in values for normal employees (8 weeks, index 0 = oldest).
// Small per-employee variation applied via empVariant (0, 1, or 2).
const NORMAL: Record<string, number[]> = {
  sessions: [3, 4, 3, 4, 5, 4, 3, 4],
  rpe:      [6, 5, 7, 6, 6, 5, 7, 6],
  energy:   [7, 8, 7, 8, 8, 7, 8, 7],
  stress:   [4, 3, 5, 4, 3, 4, 4, 3],
  mood:     [7, 8, 7, 8, 7, 8, 7, 8],
  culture:  [8, 7, 8, 9, 7, 8, 7, 9],
};

// Per-employee twist so the 7 normal employees don't look identical.
// Applied as an additive offset; clamped to valid ranges after.
const VARIANT_OFFSETS = [
  { energy: +1, stress: -1, mood:  0, sessions:  0 }, // variant 0
  { energy:  0, stress:  0, mood: -1, sessions: +1 }, // variant 1
  { energy: -1, stress: +1, mood: +1, sessions:  0 }, // variant 2
];

// Struggling employees: normal weeks 1–5, dip in weeks 6–7, sharp drop in week 8.
// Week 8 vs week 7: energy 3 vs 6 → delta −3 ≤ −2 → FLAGGED ✓
//                   mood   4 vs 7 → delta −3 ≤ −2 → FLAGGED ✓
const STRUGGLING: Record<string, number[]> = {
  sessions: [3, 4, 3, 4, 5, 2, 3, 2],
  rpe:      [6, 5, 7, 6, 6, 7, 8, 8],
  energy:   [7, 8, 7, 8, 8, 5, 6, 3],  // sharp drop at week 8
  stress:   [4, 3, 5, 4, 3, 7, 7, 9],
  mood:     [7, 8, 7, 8, 7, 6, 7, 4],  // sharp drop at week 8
  culture:  [8, 7, 8, 9, 7, 6, 5, 5],
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// Placeholder exercises for the training plan. 4 days × 4 plans × 8 weeks.
// These give v_company_training_adherence a denominator to work with.
const EXERCISE_NAMES = ["Back Squat", "Romanian Deadlift", "Bench Press", "Barbell Row"];

// ─── Step A: Company ──────────────────────────────────────────────────────────

async function seedCompany(): Promise<string> {
  console.log("\n── Step A: Company ──────────────────────────────────");

  const { data, error } = await supabase
    .from("companies")
    .upsert(
      { name: "Demo Corp", slug: "demo-corp", is_active: true, max_employees: 50 },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (error || !data) {
    console.error("  ✗  Failed to upsert company:", error?.message);
    process.exit(1);
  }

  console.log(`  ✓  Demo Corp — id: ${data.id}`);
  return data.id as string;
}

// ─── Step B: HR admin ─────────────────────────────────────────────────────────

async function seedHrAdmin(companyId: string): Promise<void> {
  console.log("\n── Step B: HR admin ─────────────────────────────────");

  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) { console.error("  ✗  listUsers failed:", listError.message); process.exit(1); }

  const existing = listData.users.find((u) => u.email === HR_ADMIN.email);
  if (existing) {
    // Upsert profile to ensure company_id is set even if auth pre-existed
    await supabase.from("profiles").upsert({
      id: existing.id,
      email: HR_ADMIN.email,
      role: "hr_admin",
      full_name: HR_ADMIN.full_name,
      company_id: companyId,
      onboarding_complete: true,
    }, { onConflict: "id" });
    console.log(`  ⏭  ${HR_ADMIN.email} — auth exists, profile updated`);
    return;
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: HR_ADMIN.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    console.error("  ✗  Auth creation failed:", authError?.message);
    process.exit(1);
  }

  // Upsert in case a trigger already created a bare profile row on auth user creation
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: authData.user.id,
    email: HR_ADMIN.email,
    role: "hr_admin",
    full_name: HR_ADMIN.full_name,
    company_id: companyId,
    onboarding_complete: true,
  }, { onConflict: "id" });

  if (profileError) {
    console.error("  ✗  Profile upsert failed:", profileError.message);
    process.exit(1);
  }

  console.log(`  ✓  ${HR_ADMIN.email} — created (${authData.user.id})`);
}

// ─── Step C: Employees ────────────────────────────────────────────────────────

async function seedEmployees(companyId: string): Promise<string[]> {
  console.log("\n── Step C: Employees ────────────────────────────────");

  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) { console.error("  ✗  listUsers failed:", listError.message); process.exit(1); }

  const existingEmails = new Set(listData.users.map((u) => u.email));
  const employeeIds: string[] = [];

  for (let i = 0; i < EMPLOYEES.length; i++) {
    const emp = EMPLOYEES[i];

    if (existingEmails.has(emp.email)) {
      const existing = listData.users.find((u) => u.email === emp.email);
      if (!existing) continue;

      employeeIds.push(existing.id);

      // Upsert the profile to ensure company_id, plan, etc. are set correctly
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: existing.id,
        email: emp.email,
        role: "employee",
        full_name: emp.full_name,
        company_id: companyId,
        onboarding_complete: true,
        training_age: emp.training_age,
        assigned_plan: emp.assigned_plan,
        current_week: 8,
      }, { onConflict: "id" });

      if (profileError) {
        console.warn(`  ⚠  ${emp.email} — profile upsert failed: ${profileError.message}`);
      } else {
        console.log(`  ⏭  ${emp.email} — auth exists, profile updated`);
      }
      continue;
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: emp.email,
      password: DEMO_PASSWORD,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      console.error(`  ✗  ${emp.email} — auth failed: ${authError?.message}`);
      continue;
    }

    // Collect the ID immediately — a trigger may have already created the profile row
    employeeIds.push(authData.user.id);

    // Upsert in case the trigger created a bare profile; equipment_access omitted
    // because only 'full_gym' is confirmed valid in the live enum.
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: authData.user.id,
      email: emp.email,
      role: "employee",
      full_name: emp.full_name,
      company_id: companyId,
      onboarding_complete: true,
      training_age: emp.training_age,
      assigned_plan: emp.assigned_plan,
      current_week: 8,
    }, { onConflict: "id" });

    if (profileError) {
      console.warn(`  ⚠  ${emp.email} — profile upsert failed (auth OK): ${profileError.message}`);
    } else {
      console.log(`  ✓  ${emp.email} — created (${authData.user.id})`);
    }
  }

  return employeeIds;
}

// ─── Step D: Plan exercises ───────────────────────────────────────────────────
// Seeds 4 training days per plan per week so v_company_training_adherence
// has a non-zero denominator.

async function seedPlanExercises(): Promise<void> {
  console.log("\n── Step D: Plan exercises ───────────────────────────");

  const rows: object[] = [];
  const plans = ["A", "B", "C", "D"] as const;

  for (const plan of plans) {
    for (let week = 1; week <= 8; week++) {
      for (let day = 1; day <= 4; day++) {
        rows.push({
          plan_archetype: plan,
          week_number: week,
          day_number: day,
          exercise_order: 1,
          exercise_name: EXERCISE_NAMES[day - 1],
          sets: 3,
          reps: "8-10",
        });
      }
    }
  }

  const { error } = await supabase
    .from("plan_exercises")
    .upsert(rows, { onConflict: "plan_archetype,week_number,day_number,exercise_order" });

  if (error) {
    console.warn("  ⚠  plan_exercises upsert failed (non-fatal):", error.message);
    console.warn("     Training Adherence KPI will show 0% until plan exercises exist.");
    return;
  }

  console.log(`  ✓  ${rows.length} plan exercise rows upserted (4 plans × 8 weeks × 4 days)`);
}

// ─── Step E: Check-ins ────────────────────────────────────────────────────────

async function seedCheckIns(
  employeeIds: string[],
  companyId: string
): Promise<Record<string, number[]>> {
  console.log("\n── Step E: Check-ins ────────────────────────────────");

  // Build week info for 8 weeks: i=0 → 7 weeks ago, i=7 → current week
  const weekInfos = Array.from({ length: 8 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (7 - i) * 7);
    const { week, year } = getIsoWeekInfo(d);
    return { seedWeekIdx: i, isoWeek: week, year, date: d };
  });

  // Track sessions_completed per [empIdx][weekIdx] for session_completions seeding
  const sessionsGrid: number[][] = [];

  const rows: object[] = [];

  for (let empIdx = 0; empIdx < employeeIds.length; empIdx++) {
    const empId = employeeIds[empIdx];
    if (!empId) continue;

    const isStruggling = STRUGGLING_INDICES.has(empIdx);
    const pattern = isStruggling ? STRUGGLING : NORMAL;
    const variant = VARIANT_OFFSETS[empIdx % 3];
    const empSessions: number[] = [];

    for (let wi = 0; wi < 8; wi++) {
      const { isoWeek, year, date } = weekInfos[wi];

      let sessions = pattern.sessions[wi];
      let rpe      = pattern.rpe[wi];
      let energy   = pattern.energy[wi];
      let stress   = pattern.stress[wi];
      let mood     = pattern.mood[wi];
      let culture  = pattern.culture[wi];

      // Apply per-employee variation (not applied to struggling employees
      // in their dip weeks — keep those values precise for the flag logic)
      if (!isStruggling || wi < 5) {
        sessions = clamp(sessions + variant.sessions, 1, 7);
        energy   = clamp(energy   + variant.energy,   1, 10);
        stress   = clamp(stress   + variant.stress,   1, 10);
        mood     = clamp(mood     + variant.mood,      1, 10);
      }

      empSessions.push(sessions);

      rows.push({
        employee_id:        empId,
        company_id:         companyId,
        sessions_completed: sessions,
        rpe,
        energy_level:       energy,
        stress_level:       stress,
        mood,
        culture_score:      culture,
        week_number:        isoWeek,
        year,
        submitted_at:       date.toISOString(),
      });
    }

    sessionsGrid.push(empSessions);
  }

  const { error } = await supabase
    .from("check_ins")
    .upsert(rows, { onConflict: "employee_id,week_number,year" });

  if (error) {
    console.error("  ✗  check_ins upsert failed:", error.message);
    process.exit(1);
  }

  console.log(`  ✓  ${rows.length} check-in rows upserted (${employeeIds.length} employees × 8 weeks)`);

  return { sessionsGrid: sessionsGrid.flat(), weekInfosFlat: weekInfos.map(w => w.isoWeek) } as unknown as Record<string, number[]>;
}

// ─── Step F: Session completions ─────────────────────────────────────────────

async function seedSessionCompletions(
  employeeIds: string[],
  companyId: string
): Promise<void> {
  console.log("\n── Step F: Session completions ──────────────────────");

  const weekInfos = Array.from({ length: 8 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (7 - i) * 7);
    const { week, year } = getIsoWeekInfo(d);
    return { isoWeek: week, year, date: d };
  });

  // Check-in pattern data (same order as seedCheckIns so counts match)
  const rows: object[] = [];

  for (let empIdx = 0; empIdx < employeeIds.length; empIdx++) {
    const empId = employeeIds[empIdx];
    if (!empId) continue;

    const isStruggling = STRUGGLING_INDICES.has(empIdx);
    const pattern = isStruggling ? STRUGGLING : NORMAL;
    const variant = VARIANT_OFFSETS[empIdx % 3];
    const emp = EMPLOYEES[empIdx];

    for (let wi = 0; wi < 8; wi++) {
      const { isoWeek, date } = weekInfos[wi];

      let sessions = pattern.sessions[wi];
      if (!isStruggling || wi < 5) {
        sessions = clamp(sessions + variant.sessions, 1, 7);
      }

      // One row per completed session, day_number 1..sessions
      for (let day = 1; day <= sessions; day++) {
        rows.push({
          employee_id:    empId,
          company_id:     companyId,
          plan_archetype: emp.assigned_plan,
          week_number:    isoWeek,
          day_number:     day,
          completed_at:   date.toISOString(),
        });
      }
    }
  }

  const { error } = await supabase
    .from("session_completions")
    .upsert(rows, { onConflict: "employee_id,week_number,day_number" });

  if (error) {
    console.error("  ✗  session_completions upsert failed:", error.message);
    process.exit(1);
  }

  console.log(`  ✓  ${rows.length} session_completion rows upserted`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱  Seeding Takt demo environment…");

  const companyId = await seedCompany();
  await seedHrAdmin(companyId);
  const employeeIds = await seedEmployees(companyId);

  if (employeeIds.length === 0) {
    console.warn("\n⚠  No employee IDs collected — check-in and session seeding skipped.");
    console.warn("   If employees already existed, re-run will collect their IDs automatically.");
  } else {
    await seedPlanExercises();
    await seedCheckIns(employeeIds, companyId);
    await seedSessionCompletions(employeeIds, companyId);
  }

  console.log("\n─────────────────────────────────────────────────────");
  console.log("  Demo environment ready.");
  console.log("");
  console.log("  Login credentials:");
  console.log("    HR Admin   hr@democorp.com            /  DemoCorp2026!");
  console.log("    Employee   alice.murphy@democorp.com  /  DemoCorp2026!");
  console.log("    Struggling niamh.obrien@democorp.com  /  DemoCorp2026!");
  console.log("");
  console.log("  Expected dashboard state:");
  console.log("    • Participation:  100% (10/10 checked in this week)");
  console.log("    • Flagged:        3 members (Niamh, Rory, Sinéad)");
  console.log("    • Wellbeing chart: visible dip in last 2 data points");
  console.log("    • Team table:     3 rows flagged amber, 7 green/active");
  console.log("");
}

main().catch((err) => {
  console.error("\nUnhandled error:", err);
  process.exit(1);
});
