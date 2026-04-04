# Takt — Project Status

**Performance & wellness management platform for corporate teams.**
Replaces fragmented wellness perks with a data-driven programme combining structured training, weekly behavioural tracking, and leadership dashboards.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.1 |
| UI | React 19.2.4 + Tailwind CSS 4.0 |
| Language | TypeScript 5 |
| Charts | Recharts 3.8.1 |
| Auth & DB | Supabase (JS SDK 2.100.0, SSR 0.10.0) |
| Auth type | Email/password via Supabase Auth |

---

## 1. Completed

### Auth & Routing
- Email/password login (`/app/login/page.tsx`)
- Middleware-based auth with role detection and onboarding gating (`middleware.ts`)
- Role-based route protection — `/employee`, `/hr`, `/coach`, `/admin` prefixes enforced
- Supabase SSR client setup (`/lib/supabase-browser.ts`, `/lib/supabase-server.ts`)

### Landing Page
- Full marketing page with hero, feature cards, stats strip, and waitlist signup (`/app/page.tsx`)

### Employee Onboarding
- 6-step intake form: name, training age, equipment access, injuries, education interests, review (`/app/employee/onboarding/page.tsx`)
- On submit: writes to `profiles`, queries `plan_routing_rules` to assign training plan, sets `onboarding_complete = true`

### Employee Check-in
- Weekly 60-second pulse form (`/app/employee/check-in/page.tsx`)
- Collects: sessions completed, RPE, energy, stress, mood (sliders/steppers)
- Conditionally shows a company culture question if one is active
- Submits to `check_ins` table

### Employee Dashboard
- Greeting, training plan card, check-in status card, weekly pulse bar chart (`/app/employee/page.tsx`)
- Responsive sidebar (desktop) + bottom tab nav (mobile)

### HR Dashboard
- KPI cards: participation rate, training adherence, flagged employees (`/app/hr/page.tsx`)
- Weekly trend chart (4-week rolling window)
- Action prompts with severity levels
- Data queries via Supabase views (`/lib/queries/hr-dashboard.ts`)

---

## 2. Partially Implemented

### Employee Dashboard (`/app/employee/page.tsx`)
- Training plan card shows `"being prepared by coach"` placeholder — no real plan data rendered
- "Continue Learning" section is hard-coded as "Coming Soon"

### HR Dashboard (`/app/hr/page.tsx`)
- Data and charts render correctly for the main dashboard page only
- Team Overview and Reports nav items reference missing sub-pages (see section 3)

### Employee Profile (`/app/employee/profile/page.tsx`)
- Page and sidebar scaffold exists but the main content area has no form or data — empty shell

---

## 3. Missing (Not Implemented)

The following routes are referenced in navigation but do not exist. Users clicking them will get a 404.

| Route | Referenced In | Purpose |
|-------|--------------|---------|
| `/employee/training` | Employee dashboard nav | Training plan viewer, session tracking |
| `/hr/team` | HR sidebar nav | Team member breakdown table |
| `/hr/reports` | HR sidebar nav | Detailed reporting views |
| `/coach/companies` | Coach sidebar nav | Assigned company management |
| `/coach/athletes` | Coach sidebar nav | Individual athlete profiles & programming |
| `/coach/culture-questions` | Coach sidebar nav | Manage company culture pulse questions |
| `/admin/companies` | Admin sidebar nav | Company management |
| `/admin/coaches` | Admin sidebar nav | Coach assignment |
| `/admin/plans` | Admin sidebar nav | Training plan archetype management |
| `/admin/settings` | Admin sidebar nav | Platform configuration |

Coach (`/app/coach/page.tsx`) and Admin (`/app/admin/page.tsx`) dashboards are placeholder HTML with no backend integration.

---

## 4. Broken & Inconsistent

### Critical Bug — Wrong Column Name
**File:** `/lib/queries/hr-dashboard.ts`
- `getActiveCultureQuestion()` queries `culture_questions.question`
- Schema defines the column as `culture_questions.question_text` (`TAKT_SCHEMA.md`)
- **Result:** always returns `null` — the culture question never appears on check-in

### Dead-End Navigation Links (404s)
**File:** `/app/employee/page.tsx` line ~75
- `href="/employee/training"` — page does not exist

**File:** `/app/hr/page.tsx` lines ~221–224
- `/hr/team` and `/hr/reports` nav items — pages do not exist

**File:** `/app/coach/page.tsx`
- All sidebar nav items link to non-existent sub-pages

### No Fallback for Missing Training Plan
**File:** `/app/employee/onboarding/page.tsx` lines ~276–283
- If no `plan_routing_rules` row matches the employee's training age + equipment, `assigned_plan` is saved as `null`
- Employee sees "being prepared by coach" indefinitely with no indication something went wrong

### Debug Logging in Production Code
**File:** `/app/employee/check-in/page.tsx` lines ~300–305
- Extensive `console.log` statements left in check-in submission handler — leaks internal state

### Empty Profile Page
**File:** `/app/employee/profile/page.tsx`
- Sidebar and page shell render; main content area is empty — no profile data displayed, no edit form

---

## 5. Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts — role, company_id, training metadata, onboarding status |
| `check_ins` | Weekly pulse submissions — mood, energy, stress, sessions, RPE, culture_score |
| `companies` | Organisations |
| `culture_questions` | Per-company pulse questions (optional, weekly) |
| `plan_routing_rules` | training_age + equipment_access → assigned_plan mapping |
| `session_completions` | Training session tracking (referenced, not yet used in app) |

Views: `v_company_participation`, `v_company_weekly_averages`, `v_company_training_adherence`, `v_company_flagged_employees`

---

## 6. Next Steps

Priority order to reach a working product:

1. **Fix `getActiveCultureQuestion()` column name** (`/lib/queries/hr-dashboard.ts`) — rename `question` → `question_text`
2. **Build `/employee/training`** — show the assigned training plan, allow session completion logging to `session_completions`
3. **Build `/hr/team`** — employee breakdown table using `v_company_flagged_employees` and `profiles`
4. **Implement `/employee/profile`** — render and allow editing of training age, equipment, injuries, education interests
5. **Add null fallback for training plan** in onboarding — show a clear message or assign a default plan when no routing rule matches
6. **Remove debug `console.log`** from check-in page
7. **Stub `/hr/reports`** — even a simple date-range export or trend breakdown
8. **Coach dashboard** — company selector, athlete list, basic programming view
9. **Admin dashboard** — company and coach CRUD, plan archetype management

---

## Completion Estimate

| Area | Status |
|------|--------|
| Auth & middleware | 100% |
| Landing page | 100% |
| Employee onboarding | 95% (missing null-plan fallback) |
| Employee check-in | 90% (culture question broken, debug logs) |
| Employee dashboard | 60% (training plan placeholder, learning section missing) |
| Employee profile | 15% (shell only) |
| HR dashboard | 55% (main page works, sub-pages missing) |
| Coach dashboard | 5% (placeholder) |
| Admin dashboard | 5% (placeholder) |
| **Overall** | **~45%** |
