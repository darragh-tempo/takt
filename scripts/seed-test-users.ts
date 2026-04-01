// NOTE: Before running this script, make sure your .env.local contains:
//   SUPABASE_SERVICE_ROLE_KEY=<your service role key>  (Settings > API in Supabase dashboard)
//   NEXT_PUBLIC_SUPABASE_URL=<your project URL>
//
// Run with: npm run seed:users

import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Load env vars from .env.local manually — tsx doesn't auto-load dotenv
// ---------------------------------------------------------------------------
import { readFileSync } from "fs";
import { resolve } from "path";

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

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Test user definitions
// ---------------------------------------------------------------------------

const TEST_USERS = [
  {
    email: "employee@test.com",
    password: "testpass123",
    role: "employee" as const,
    full_name: "Test Employee",
    company_id: null as string | null, // set below if you have an RSPL company ID
    onboarding_complete: false, // intentionally false to test the onboarding redirect
  },
  {
    email: "hr@test.com",
    password: "testpass123",
    role: "hr_admin" as const,
    full_name: "Test HR Admin",
    company_id: null as string | null,
    onboarding_complete: true,
  },
  {
    email: "coach@test.com",
    password: "testpass123",
    role: "coach" as const,
    full_name: "Test Coach",
    company_id: null as string | null, // coaches are not company-scoped
    onboarding_complete: true,
  },
  {
    email: "admin@test.com",
    password: "testpass123",
    role: "admin" as const,
    full_name: "Test Admin",
    company_id: null as string | null, // admins are platform-scoped
    onboarding_complete: true,
  },
] as const;

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

type Result = { email: string; status: "created" | "skipped" | "error"; detail?: string };

async function seedUser(user: (typeof TEST_USERS)[number]): Promise<Result> {
  // Check if the auth user already exists by listing users and matching email.
  // admin.createUser throws on duplicate email, so we pre-check to give a
  // clean "skipped" result instead of an error.
  const { data: listData, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    return { email: user.email, status: "error", detail: listError.message };
  }

  const existing = listData.users.find((u) => u.email === user.email);

  if (existing) {
    console.log(`  ⏭  ${user.email} — already exists, skipping`);
    return { email: user.email, status: "skipped" };
  }

  // Create the auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true, // skip the confirmation email for test accounts
  });

  if (authError || !authData.user) {
    console.error(`  ✗  ${user.email} — auth creation failed: ${authError?.message}`);
    return { email: user.email, status: "error", detail: authError?.message };
  }

  const userId = authData.user.id;
  console.log(`  ✓  ${user.email} — auth user created (${userId})`);

  // Insert the profile row
  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    role: user.role,
    full_name: user.full_name,
    company_id: user.company_id,
    onboarding_complete: user.onboarding_complete,
  });

  if (profileError) {
    console.error(
      `  ✗  ${user.email} — profile insert failed: ${profileError.message}`
    );
    // Auth user was created but profile failed — report error but don't crash
    return {
      email: user.email,
      status: "error",
      detail: `auth OK, profile failed: ${profileError.message}`,
    };
  }

  console.log(
    `  ✓  ${user.email} — profile inserted (role: ${user.role}, onboarding: ${user.onboarding_complete})`
  );

  return { email: user.email, status: "created" };
}

async function main() {
  console.log("\n🌱 Seeding test users...\n");

  const results: Result[] = [];

  for (const user of TEST_USERS) {
    const result = await seedUser(user);
    results.push(result);
  }

  // Summary
  const created = results.filter((r) => r.status === "created");
  const skipped = results.filter((r) => r.status === "skipped");
  const errored = results.filter((r) => r.status === "error");

  console.log("\n─────────────────────────────────");
  console.log(`  Created : ${created.length}`);
  console.log(`  Skipped : ${skipped.length}`);
  console.log(`  Errors  : ${errored.length}`);

  if (errored.length > 0) {
    console.log("\nFailed:");
    for (const r of errored) {
      console.log(`  • ${r.email} — ${r.detail}`);
    }
  }

  console.log("\nTest credentials:");
  console.log("  employee@test.com  / testpass123  (onboarding_complete: false)");
  console.log("  hr@test.com        / testpass123");
  console.log("  coach@test.com     / testpass123");
  console.log("  admin@test.com     / testpass123");
  console.log("");

  if (errored.length > 0) process.exit(1);
}

main();
