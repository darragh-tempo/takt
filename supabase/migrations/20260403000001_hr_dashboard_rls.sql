-- ============================================================
-- RLS policies for the HR leadership dashboard
-- Created: 2026-04-03
--
-- Both new views use security_invoker = true, which means the
-- caller's RLS context is applied to every underlying table
-- read.  Without these policies an hr_admin gets zero rows.
--
-- Views covered:
--   v_company_training_adherence  → profiles, plan_exercises,
--                                   session_completions
--   v_company_flagged_employees   → profiles, check_ins
--
-- Direct queries covered:
--   culture_questions             → getActiveCultureQuestion()
--   (v_company_participation and v_company_weekly_averages
--    share the same underlying tables)
-- ============================================================


-- ── Ensure RLS is on for every table we touch ───────────────
-- These statements are no-ops if RLS is already enabled.

ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins            ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_completions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_exercises       ENABLE ROW LEVEL SECURITY;
ALTER TABLE culture_questions    ENABLE ROW LEVEL SECURITY;


-- ── Security-definer helpers ────────────────────────────────
-- These run as the DB owner, bypassing RLS.  Using them in
-- policies prevents the recursive-policy problem that arises
-- when a subquery on `profiles` is evaluated while already
-- evaluating a `profiles` policy.

CREATE OR REPLACE FUNCTION get_my_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$;


-- ── profiles ─────────────────────────────────────────────────

-- Every authenticated user can always read their own row.
-- This is the bootstrap policy that makes get_my_company_id()
-- and get_my_role() work for everyone else.
DROP POLICY IF EXISTS "users_select_own_profile" ON profiles;
CREATE POLICY "users_select_own_profile"
ON profiles FOR SELECT TO authenticated
USING (id = auth.uid());

-- hr_admin can read all profiles that share their company_id.
-- Covers the employee list scan in both new views.
DROP POLICY IF EXISTS "hr_admin_select_company_profiles" ON profiles;
CREATE POLICY "hr_admin_select_company_profiles"
ON profiles FOR SELECT TO authenticated
USING (
  company_id = get_my_company_id()
  AND get_my_role() = 'hr_admin'
);


-- ── check_ins ────────────────────────────────────────────────

-- Employees can read their own check-in rows (needed for the
-- employee dashboard and existing v_company_* views).
DROP POLICY IF EXISTS "employees_select_own_check_ins" ON check_ins;
CREATE POLICY "employees_select_own_check_ins"
ON check_ins FOR SELECT TO authenticated
USING (employee_id = auth.uid());

-- hr_admin can read all check-ins for their company.
-- Required by v_company_flagged_employees and
-- v_company_weekly_averages.
DROP POLICY IF EXISTS "hr_admin_select_company_check_ins" ON check_ins;
CREATE POLICY "hr_admin_select_company_check_ins"
ON check_ins FOR SELECT TO authenticated
USING (
  company_id = get_my_company_id()
  AND get_my_role() = 'hr_admin'
);


-- ── session_completions ──────────────────────────────────────

-- Employees can read their own session rows.
DROP POLICY IF EXISTS "employees_select_own_session_completions" ON session_completions;
CREATE POLICY "employees_select_own_session_completions"
ON session_completions FOR SELECT TO authenticated
USING (employee_id = auth.uid());

-- hr_admin can read all session completions for their company.
-- Required by v_company_training_adherence.
DROP POLICY IF EXISTS "hr_admin_select_company_session_completions" ON session_completions;
CREATE POLICY "hr_admin_select_company_session_completions"
ON session_completions FOR SELECT TO authenticated
USING (
  company_id = get_my_company_id()
  AND get_my_role() = 'hr_admin'
);


-- ── plan_exercises ───────────────────────────────────────────
-- Not company-scoped — the same exercise library is shared
-- across all companies.  Any authenticated user may read it.

DROP POLICY IF EXISTS "authenticated_select_plan_exercises" ON plan_exercises;
CREATE POLICY "authenticated_select_plan_exercises"
ON plan_exercises FOR SELECT TO authenticated
USING (true);


-- ── culture_questions ────────────────────────────────────────
-- hr_admin reads their company's active question for the
-- Culture Pulse metric card.

DROP POLICY IF EXISTS "hr_admin_select_company_culture_questions" ON culture_questions;
CREATE POLICY "hr_admin_select_company_culture_questions"
ON culture_questions FOR SELECT TO authenticated
USING (
  company_id = get_my_company_id()
  AND get_my_role() = 'hr_admin'
);
