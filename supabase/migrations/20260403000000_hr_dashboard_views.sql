-- ============================================================
-- HR Leadership Dashboard Views
-- Created: 2026-04-03
-- ============================================================

-- ============================================================
-- VIEW 1: v_company_training_adherence
-- Training adherence rate per company for the current week.
--
-- Planned sessions  = distinct day_numbers in plan_exercises
--                     for each employee's assigned_plan + current_week.
-- Completed sessions = rows in session_completions for the
--                     current ISO week + year (via completed_at).
-- ============================================================

DROP VIEW IF EXISTS v_company_training_adherence;

CREATE OR REPLACE VIEW v_company_training_adherence
WITH (security_invoker = true)
AS
WITH eligible_employees AS (
  -- Onboarded employees with an assigned plan
  SELECT
    p.id            AS employee_id,
    p.company_id,
    p.assigned_plan,
    p.current_week
  FROM profiles p
  WHERE p.role             = 'employee'
    AND p.onboarding_complete = true
    AND p.assigned_plan    IS NOT NULL
),

employee_planned AS (
  -- Count distinct training days planned for each employee's
  -- current position in their plan programme.
  SELECT
    e.employee_id,
    e.company_id,
    COUNT(DISTINCT pe.day_number)::integer AS planned_sessions
  FROM eligible_employees e
  LEFT JOIN plan_exercises pe
         ON pe.plan_archetype = e.assigned_plan
        AND pe.week_number    = e.current_week
  GROUP BY e.employee_id, e.company_id
),

employee_completed AS (
  -- Rows logged in session_completions for the current
  -- ISO week of the current calendar year.
  SELECT
    sc.employee_id,
    COUNT(*)::integer AS completed_sessions
  FROM session_completions sc
  WHERE sc.week_number = EXTRACT(week FROM now())::integer
    AND EXTRACT(year FROM sc.completed_at)::integer
        = EXTRACT(year FROM now())::integer
  GROUP BY sc.employee_id
),

company_totals AS (
  SELECT
    ep.company_id,
    SUM(ep.planned_sessions)                  AS total_planned,
    SUM(COALESCE(ec.completed_sessions, 0))   AS total_completed
  FROM employee_planned ep
  LEFT JOIN employee_completed ec USING (employee_id)
  GROUP BY ep.company_id
)

SELECT
  company_id,
  EXTRACT(week FROM now())::integer           AS week_number,
  EXTRACT(year FROM now())::integer           AS year,
  total_completed                             AS completed_sessions,
  total_planned                               AS planned_sessions,
  CASE
    WHEN total_planned = 0 THEN 0::numeric
    ELSE ROUND(
           (total_completed::numeric / total_planned::numeric) * 100,
           1
         )
  END                                         AS adherence_rate
FROM company_totals;


-- ============================================================
-- VIEW 2: v_company_flagged_employees
-- Count of employees whose mood OR energy_level dropped 2+
-- points between their most recent check-in and the check-in
-- from the previous week (week_number - 1, same year).
-- ============================================================

DROP VIEW IF EXISTS v_company_flagged_employees;

CREATE OR REPLACE VIEW v_company_flagged_employees
WITH (security_invoker = true)
AS
WITH latest_checkins AS (
  -- Most recent check-in per employee (highest week_number in current year)
  SELECT DISTINCT ON (ci.employee_id)
    ci.employee_id,
    ci.company_id,
    ci.week_number,
    ci.year,
    ci.mood,
    ci.energy_level
  FROM check_ins ci
  JOIN profiles p
    ON p.id   = ci.employee_id
   AND p.role = 'employee'
  WHERE ci.year = EXTRACT(year FROM now())::integer
  ORDER BY ci.employee_id, ci.week_number DESC
),

prev_checkins AS (
  -- The check-in from week_number - 1 in the same year
  SELECT
    ci.employee_id,
    ci.mood         AS prev_mood,
    ci.energy_level AS prev_energy_level
  FROM check_ins ci
  JOIN latest_checkins lc
    ON  lc.employee_id  = ci.employee_id
   AND  ci.week_number  = lc.week_number - 1
   AND  ci.year         = lc.year
),

flagged_employees AS (
  -- Employees where mood OR energy_level fell by 2 or more points
  SELECT
    lc.employee_id,
    lc.company_id
  FROM latest_checkins lc
  JOIN prev_checkins pc USING (employee_id)
  WHERE (lc.mood         - pc.prev_mood)         <= -2
     OR (lc.energy_level - pc.prev_energy_level) <= -2
)

SELECT
  company_id,
  COUNT(*) AS flagged_count
FROM flagged_employees
GROUP BY company_id;
