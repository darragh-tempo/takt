# TAKT — Database Schema Reference

> **Single source of truth.** Pulled from live Supabase (project: `aovyynxsqbckqzwuaqfa`, EU region) on 3 April 2026.
> Reference this document before every build session. If a column name isn't in this file, it doesn't exist.

---

## Custom Enums

| Enum Name | Values | Used In |
|---|---|---|
| `user_role` | `employee`, `hr_admin`, `coach`, `admin` | `profiles.role` |
| `plan_archetype` | `A`, `B`, `C`, `D` | `plan_exercises.plan_archetype`, `plan_routing_rules.assigned_plan`, `profiles.assigned_plan`, `session_completions.plan_archetype` |
| `training_age` | `beginner`, `intermediate`, `advanced` | `profiles.training_age`, `plan_routing_rules.training_age` |
| `equipment_access` | `full_gym`, `home`, `none` | `profiles.equipment_access`, `plan_routing_rules.equipment_access` |

---

## Tables

### `companies`

| Column | Type | Default | Nullable | Constraints |
|---|---|---|---|---|
| `id` | `uuid` | `uuid_generate_v4()` | NO | **PK** |
| `name` | `text` | — | NO | |
| `slug` | `text` | — | NO | **UNIQUE** |
| `signup_link` | `text` | — | YES | |
| `max_employees` | `integer` | `50` | YES | |
| `is_active` | `boolean` | `true` | YES | |
| `created_at` | `timestamptz` | `now()` | YES | |
| `updated_at` | `timestamptz` | `now()` | YES | |

**Referenced by:** `profiles.company_id`, `check_ins.company_id`, `coach_assignments.company_id`, `culture_questions.company_id`, `session_completions.company_id`

---

### `profiles`

| Column | Type | Default | Nullable | Constraints |
|---|---|---|---|---|
| `id` | `uuid` | — | NO | **PK**, **FK → auth.users.id** |
| `full_name` | `text` | — | YES | |
| `email` | `text` | — | NO | |
| `role` | `user_role` | `'employee'` | NO | |
| `company_id` | `uuid` | — | YES | **FK → companies.id** |
| `onboarding_complete` | `boolean` | `false` | YES | |
| `training_age` | `training_age` | — | YES | |
| `equipment_access` | `equipment_access` | — | YES | |
| `has_injury` | `boolean` | `false` | YES | |
| `injury_details` | `text` | — | YES | |
| `education_interests` | `text[]` | — | YES | |
| `assigned_plan` | `plan_archetype` | — | YES | |
| `plan_start_date` | `date` | — | YES | |
| `current_week` | `integer` | `1` | YES | |
| `injury_flagged` | `boolean` | `false` | YES | |
| `injury_flagged_at` | `timestamptz` | — | YES | |
| `created_at` | `timestamptz` | `now()` | YES | |
| `updated_at` | `timestamptz` | `now()` | YES | |
| `last_login_at` | `timestamptz` | — | YES | |

**Referenced by:** `check_ins.employee_id`, `session_completions.employee_id`, `culture_questions.created_by`

> ⚠️ **Common mistake:** The column is `onboarding_complete` (not `onboarding_completed`).

---

### `check_ins`

| Column | Type | Default | Nullable | Constraints |
|---|---|---|---|---|
| `id` | `uuid` | `uuid_generate_v4()` | NO | **PK** |
| `employee_id` | `uuid` | — | NO | **FK → profiles.id**, part of UNIQUE(employee_id, week_number, year) |
| `company_id` | `uuid` | — | NO | **FK → companies.id** |
| `sessions_completed` | `integer` | — | NO | |
| `rpe` | `integer` | — | NO | |
| `energy_level` | `integer` | — | NO | |
| `stress_level` | `integer` | — | NO | |
| `mood` | `integer` | — | NO | |
| `culture_score` | `integer` | — | YES | |
| `culture_question_id` | `uuid` | — | YES | **FK → culture_questions.id** |
| `week_number` | `integer` | — | NO | part of UNIQUE |
| `year` | `integer` | `EXTRACT(year FROM now())` | NO | part of UNIQUE |
| `submitted_at` | `timestamptz` | `now()` | YES | |

**Unique constraint:** `(employee_id, week_number, year)` — one check-in per employee per week.

> ⚠️ **Common mistake:** The column is `mood` (not `wellbeing` or `mood_score`).
> ⚠️ **Common mistake:** The column is `culture_score` (not `culture_pulse` or `culture_rating`).

---

### `session_completions`

| Column | Type | Default | Nullable | Constraints |
|---|---|---|---|---|
| `id` | `uuid` | `uuid_generate_v4()` | NO | **PK** |
| `employee_id` | `uuid` | — | NO | **FK → profiles.id**, part of UNIQUE(employee_id, week_number, day_number) |
| `company_id` | `uuid` | — | NO | **FK → companies.id** |
| `plan_archetype` | `plan_archetype` | — | NO | |
| `week_number` | `integer` | — | NO | part of UNIQUE |
| `day_number` | `integer` | — | NO | part of UNIQUE |
| `completed_at` | `timestamptz` | `now()` | YES | |

**Unique constraint:** `(employee_id, week_number, day_number)` — one completion per employee per session.

---

### `plan_exercises`

| Column | Type | Default | Nullable | Constraints |
|---|---|---|---|---|
| `id` | `uuid` | `uuid_generate_v4()` | NO | **PK** |
| `plan_archetype` | `plan_archetype` | — | NO | part of UNIQUE(plan_archetype, week_number, day_number, exercise_order) |
| `week_number` | `integer` | — | NO | part of UNIQUE |
| `day_number` | `integer` | — | NO | part of UNIQUE |
| `exercise_order` | `integer` | `1` | NO | part of UNIQUE |
| `exercise_name` | `text` | — | NO | |
| `sets` | `integer` | — | NO | |
| `reps` | `text` | — | NO | |
| `rest_seconds` | `integer` | — | YES | |
| `video_url` | `text` | — | YES | |
| `video_thumbnail` | `text` | — | YES | |
| `notes` | `text` | — | YES | |
| `created_at` | `timestamptz` | `now()` | YES | |
| `updated_at` | `timestamptz` | `now()` | YES | |

**Unique constraint:** `(plan_archetype, week_number, day_number, exercise_order)` — one exercise per slot.

---

### `plan_routing_rules`

| Column | Type | Default | Nullable | Constraints |
|---|---|---|---|---|
| `id` | `uuid` | `uuid_generate_v4()` | NO | **PK** |
| `training_age` | `training_age` | — | NO | part of UNIQUE(training_age, equipment_access) |
| `equipment_access` | `equipment_access` | — | NO | part of UNIQUE |
| `assigned_plan` | `plan_archetype` | — | NO | |

**Unique constraint:** `(training_age, equipment_access)` — one plan assignment per combination.

---

### `culture_questions`

| Column | Type | Default | Nullable | Constraints |
|---|---|---|---|---|
| `id` | `uuid` | `uuid_generate_v4()` | NO | **PK** |
| `company_id` | `uuid` | — | NO | **FK → companies.id** |
| `question` | `text` | — | NO | |
| `is_active` | `boolean` | `false` | YES | |
| `created_by` | `uuid` | — | YES | **FK → profiles.id** |
| `created_at` | `timestamptz` | `now()` | YES | |
| `updated_at` | `timestamptz` | `now()` | YES | |

---

### `coach_assignments`

| Column | Type | Default | Nullable | Constraints |
|---|---|---|---|---|
| `id` | `uuid` | `uuid_generate_v4()` | NO | **PK** |
| `coach_id` | `uuid` | — | NO | part of UNIQUE(coach_id, company_id) |
| `company_id` | `uuid` | — | NO | **FK → companies.id**, part of UNIQUE |
| `assigned_at` | `timestamptz` | `now()` | YES | |

**Unique constraint:** `(coach_id, company_id)` — one assignment per coach-company pair.

> ⚠️ **Note:** `coach_id` has no FK to `profiles.id` in the current schema. Consider adding this.

---

### `waitlist_signups`

| Column | Type | Default | Nullable | Constraints |
|---|---|---|---|---|
| `id` | `uuid` | `gen_random_uuid()` | NO | **PK** |
| `created_at` | `timestamptz` | `now()` | NO | |
| `full_name` | `text` | — | NO | |
| `email` | `text` | — | NO | **UNIQUE** |

---

## Views

### `v_company_participation`

Returns participation rate for the **current week** per company.

| Output Column | Type | Source |
|---|---|---|
| `company_id` | `uuid` | `companies.id` |
| `week_number` | `integer` | `EXTRACT(week FROM now())` |
| `year` | `integer` | `EXTRACT(year FROM now())` |
| `checked_in_count` | `bigint` | COUNT of employees who submitted a check-in |
| `total_employees` | `bigint` | COUNT of onboarded employees (`onboarding_complete = true`) |
| `participation_rate` | `numeric` | `(checked_in_count / total_employees) * 100`, rounded to 1 decimal |

**Join logic:** Only counts employees where `role = 'employee'` AND `onboarding_complete = true`.

---

### `v_company_weekly_averages`

Returns aggregated check-in averages per company per week (all historical weeks).

| Output Column | Type | Source |
|---|---|---|
| `company_id` | `uuid` | `check_ins.company_id` |
| `week_number` | `integer` | `check_ins.week_number` |
| `year` | `integer` | `check_ins.year` |
| `response_count` | `bigint` | COUNT of check-ins |
| `avg_sessions` | `numeric` | AVG of `sessions_completed` |
| `avg_rpe` | `numeric` | AVG of `rpe` |
| `avg_energy` | `numeric` | AVG of `energy_level` |
| `avg_stress` | `numeric` | AVG of `stress_level` |
| `avg_mood` | `numeric` | AVG of `mood` |
| `avg_culture` | `numeric` | AVG of `culture_score` |

**Ordered by:** `year DESC, week_number DESC`

---

## Foreign Key Map

```
auth.users.id ──→ profiles.id
companies.id  ──→ profiles.company_id
              ──→ check_ins.company_id
              ──→ session_completions.company_id
              ──→ culture_questions.company_id
              ──→ coach_assignments.company_id
profiles.id   ──→ check_ins.employee_id
              ──→ session_completions.employee_id
              ──→ culture_questions.created_by
culture_questions.id ──→ check_ins.culture_question_id
```

---

## Known Gotchas

| Mistake | Correct | Wrong |
|---|---|---|
| Onboarding flag | `onboarding_complete` | `onboarding_completed` |
| Mood column | `mood` | `wellbeing`, `mood_score` |
| Culture score | `culture_score` | `culture_pulse`, `culture_rating` |
| Role enum values | `hr_admin` | `hr`, `hradmin`, `HR_Admin` |
| Equipment enum | `full_gym` | `gym`, `full-gym`, `fullGym` |
| Coach assignments FK | `coach_id` has NO FK (just uuid) | Don't assume it joins to profiles |
| Profile ID | Links to `auth.users.id` (not auto-generated) | Don't use `uuid_generate_v4()` |
| Check-in uniqueness | `(employee_id, week_number, year)` | Not just `employee_id` |

---

*Last updated: 3 April 2026. Re-run the information_schema query and update this file after any migration.*
