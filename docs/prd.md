

**TAKT BY TEMPO**

Product Requirements Document

V1.0 — MVP Specification

TEMPO Development

March 2026

**CONFIDENTIAL**

# **Document Information**

| Product Name | Takt by TEMPO |
| :---- | :---- |
| **Version** | 1.0 — MVP |
| **Date** | 27 March 2026 |
| **Authors** | Darragh Curtin (COO), Rhys (CEO), Max (Head of Performance) |
| **Status** | Active Development |
| **Target Launch** | May 2026 (Pilot), June 2026 (General Availability) |

# **1\. Purpose and Vision**

## **1.1 Problem Statement**

Corporate wellness programmes fail because they deliver generic, unmeasured interventions with no accountability loop. HR and People & Culture leaders spend significant budget on wellness initiatives (gym memberships, meditation apps, one-off workshops) with no way to measure return on investment, track team-level outcomes, or identify at-risk employees before performance declines.

Employees receive fragmented, self-directed wellness perks with no structure, no progression, and no connection to their team or manager. Engagement drops within weeks because there is no habit loop, no accountability, and no visible benefit to the individual.

## **1.2 Solution**

Takt by TEMPO is a B2B corporate performance platform that replaces unstructured wellness perks with a managed, data-driven performance programme. It combines structured fitness coaching, weekly behavioural tracking, and leadership reporting into a single platform.

The core value proposition is: employees get a structured programme they can follow. HR and leadership get a dashboard that shows measurable team performance data they can present to the board. TEMPO coaches get a scalable delivery mechanism that replaces manual tools.

## **1.3 Success Metrics (V1)**

* Employee weekly check-in completion rate above 70%

* HR dashboard accessed at least weekly by client stakeholders

* Training plan adherence (sessions completed vs. planned) above 60%

* Pilot client (RSPL) converts to full 6-month contract

* £10,000 MRR by end of Q2 2026, £100,000 MRR by end of Q4 2026

# **2\. Users and Roles**

Takt serves four distinct user types, each with different access levels, views, and capabilities within the platform.

## **2.1 Employee**

**Description:** An individual within a corporate client organisation who participates in the TEMPO performance programme.

**Access:** Own profile, own training plan, own check-in history. Cannot see other employees or company-level data.

**Key Actions:**

* Complete onboarding questionnaire on first login

* View assigned training plan with exercise videos

* Mark sessions as complete

* Submit weekly check-in

* Flag injury or limitation

* View own progress over time

## **2.2 HR Admin**

**Description:** The HR lead, People & Culture manager, or CEO at the corporate client organisation. This is the primary buyer and contract holder.

**Access:** Company-level aggregated data. Can see team trends but not individual employee check-in details (anonymised by default, configurable).

**Key Actions:**

* View leadership dashboard with team performance metrics

* See participation rates, adherence trends, and engagement scores

* Invite employees via bulk email upload or share company signup link

* Download reports for board or leadership presentations

## **2.3 TEMPO Coach**

**Description:** A TEMPO performance coach assigned to one or more corporate clients. Responsible for programme delivery, plan adjustments, and client communication.

**Access:** Full data for assigned clients. Can see individual employee data, check-in responses, and training plan status.

**Key Actions:**

* View all employees within assigned companies

* Monitor check-in data and flag at-risk individuals

* Adjust plan assignments (swap archetype, modify for injury)

* Set and rotate the weekly culture question per company

* Manage employee invitations and onboarding

## **2.4 TEMPO Admin (Superadmin)**

**Description:** TEMPO co-founders and senior operations staff. Full platform access across all clients.

**Access:** All companies, all data, all settings.

**Key Actions:**

* Create and configure new company accounts

* Assign coaches to companies

* View cross-client analytics and platform health

* Manage plan archetypes and exercise content library

* All TEMPO Coach capabilities

# **3\. Features — V1 (MVP)**

The following features constitute the minimum viable product.

## **3.1 Authentication and Access Control**

**Purpose:** Secure login with role-based access. Each user sees only the data and features relevant to their role.

**User Flow:**

1. Employee receives invite email or accesses company signup link

2. Employee creates account with email and password

3. On first login, employee is routed to onboarding questionnaire

4. On subsequent logins, employee lands on their dashboard

5. HR Admin, TEMPO Coach, and TEMPO Admin accounts are created manually by TEMPO Admin

**Technical Notes:**

* Authentication handled by Supabase Auth (email \+ password)

* Roles stored in a profiles table linked to Supabase auth.users

* Row Level Security (RLS) enforces data isolation between companies

* Two invitation methods: bulk email upload and unique company signup link

## **3.2 Employee Onboarding**

**Purpose:** Capture the minimum information needed to assign the correct training plan archetype. Replaces the current Typeform intake.

**Onboarding Questions (6 fields):**

| \# | Field | Type | Purpose |
| :---- | :---- | :---- | :---- |
| 1 | Full Name | Text input | Profile identification |
| 2 | Email | Pre-filled from signup | Account identifier |
| 3 | Training Age | Select: Beginner / Intermediate / Advanced | Routes to plan complexity |
| 4 | Equipment Access | Select: Full Gym / Home / None | Routes to plan archetype |
| 5 | Injury/Limitation | Yes/No \+ body area if Yes | Coach review flag |
| 6 | Education Interest | Multi-select: Nutrition / Sleep / Stress / Mobility / None | Content personalisation |

**Plan Routing Matrix:**

|  | Full Gym | Home/Minimal | No Equipment |
| :---- | :---- | :---- | :---- |
| **Beginner** | Plan A | Plan B | Plan B |
| **Intermediate** | Plan A | Plan C | Plan C |
| **Advanced** | Plan D | Plan C | Plan C |

Note: This routing matrix is configurable by Max based on pilot feedback.

## **3.3 Training Plan Viewer**

**Purpose:** Display the assigned training programme with exercises, sets, reps, rest periods, and embedded video demonstrations. Replaces PT Distinction for client-facing delivery.

**User Flow:**

1. Employee logs in and sees their current week’s programme

2. Each day shows: exercise name, sets, reps, rest period, and video thumbnail

3. Employee taps an exercise to view the video demonstration

4. Employee marks each session as complete when finished

5. Employee can flag an injury, triggering a plan review

**Plan Data Schema:**

| Field | Type | Example |
| :---- | :---- | :---- |
| plan\_archetype | Text | A / B / C / D |
| week\_number | Integer | 1–16 |
| day\_number | Integer | 1–5 |
| exercise\_name | Text | Barbell Back Squat |
| sets | Integer | 4 |
| reps | Text | 8–10 |
| rest\_seconds | Integer | 90 |
| video\_url | URL | https://videos.takt.com/squat.mp4 |
| notes | Text | Tempo: 3-1-1-0 |

## **3.4 Weekly Check-In**

**Purpose:** Collect weekly behavioural and wellbeing data from each employee. Powers the leadership dashboard. Designed to take under 60 seconds.

**Check-In Fields (6 fields):**

| \# | Field | Input | Dashboard Use |
| :---- | :---- | :---- | :---- |
| 1 | Sessions Completed | Number (0–7) | Adherence rate |
| 2 | RPE (Perceived Effort) | Slider (1–10) | Training load monitoring |
| 3 | Energy Level | Slider (1–10) | Team energy trends |
| 4 | Stress Level | Slider (1–10) | Wellbeing monitoring |
| 5 | Mood / Wellbeing | Slider (1–10) | Wellbeing trends |
| 6 | Culture Question | Slider (1–10) | Culture pulse data |

**Culture Question Configuration:**

The rotating culture question is configurable per company by TEMPO coaches. Examples: “How supported do you feel by your manager this week?”, “How connected do you feel to your team?”, “How clearly do you understand your current priorities?”. Coaches can add, edit, and rotate these questions per company from their dashboard.

## **3.5 Leadership Dashboard**

**Purpose:** The primary feature that sells and renews contracts. Gives HR leads and CEOs a real-time view of team performance and engagement.

**Dashboard Metrics:**

| Metric | Description |
| :---- | :---- |
| Participation Rate | % of enrolled employees who submitted a check-in this week |
| Training Adherence | Average sessions completed vs. planned across the team |
| Team Energy Trend | Average energy score over 4 weeks with trend direction |
| Team Stress Trend | Average stress score over 4 weeks with trend direction |
| Mood / Wellbeing Trend | Average mood score over 4 weeks with trend direction |
| Culture Pulse Score | Average response to the current rotating culture question |
| Flagged Individuals | Count of employees with significantly declining scores |

**Data Privacy:**

By default, the leadership dashboard shows aggregated, anonymised data. Individual employee scores are not visible to HR unless explicitly configured and agreed in the service contract. TEMPO coaches can see individual data for programme adjustment purposes.

## **3.6 Design System**

**Colour Palette:**Primary brand colour is a deep teal. Use it for primary buttons, active states, selected tabs, progress bars, and key accent moments. Not everywhere — it should feel intentional when it appears. Hex: `#0D9488`. A darker variant for hover states and headings where you want weight: `#0F766E`. A lighter tint for backgrounds of cards or highlighted sections: `#CCFBF1`.

The secondary accent is a warm coral-orange. Use sparingly — for notifications, alerts, CTAs that need to stand out against the teal, and the "complete" or "submit" moments. Hex: `#F97316`. This gives energy and warmth without clashing with the teal.

Semantic colours for status: success green `#22C55E`, warning amber `#EAB308`, error red `#EF4444`, info blue `#3B82F6`. Use these only for their specific purposes — don't bleed them into the general UI.

Neutral scale — this is the backbone. Most of the interface is neutral, not colour. Background (page level): `#F8FAFC`. Card/surface background: `#FFFFFF`. Borders and dividers: `#E2E8F0`. Secondary text (labels, captions, timestamps): `#64748B`. Primary text (headings, body): `#0F172A`. Disabled/placeholder text: `#94A3B8`.

**Typography:**Headings: Use semibold (600) for page titles, medium (500) for section headings. Don't use bold (700) — it gets heavy in a light-mode interface.

Body text: Use Inter. Regular (400) for body, medium (500) for emphasis or labels. 

Monospace (for data, numbers on charts, sliders): JetBrains Mono or the system monospace. Only use this in the check-in form sliders, progress stats, and dashboard metric numbers.

Size scale: Page title 24px. Section heading 18px. Card heading 16px. Body text 14px. Small/caption text 12px. Line height 1.5 for body, 1.3 for headings. Letter spacing: 0 for body, \-0.01em for headings (tighten slightly for that premium feel).

**Spacing:** Use a 4px base unit. All spacing should be multiples of 4\. Page padding: 24px on mobile, 48px on desktop. Card internal padding: 20px. Gap between cards: 16px. Gap between sections: 32px. Gap between form fields: 16px. Button padding: 12px vertical, 24px horizontal.

**Border Radius:** Go with 12px as the default for cards, modals, and containers. 8px for buttons, input fields, and smaller interactive elements. 20px or full-round for tags, badges, and pills. 

**Shadows:** Light and subtle only. Cards: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06). Elevated elements (modals, dropdowns): 0 4px 12px rgba(0,0,0,0.08). No heavy drop shadows anywhere. The light mode should feel flat-ish with just enough lift to separate cards from the background.

**Buttons:** Primary button: teal background (`#0D9488`), white text, 8px radius, medium (500) weight. Hover state: darker teal (`#0F766E`). Secondary button: white background, teal border, teal text. Same radius. Ghost button: no border, teal text, subtle hover background (`#F0FDFA`). Disabled: grey background (`#E2E8F0`), grey text (`#94A3B8`). All buttons 14px text, 12px/24px padding.

**Form Inputs:** White background, 1px border (`#E2E8F0`), 8px radius. On focus: border changes to teal (`#0D9488`) with a subtle teal glow (0 0 0 3px rgba(13,148,136,0.1)). Placeholder text in `#94A3B8`. Input text in `#0F172A`. Label text in `#64748B`, 12px, medium weight, positioned above the field.

**Sliders (for check-in):** Track background: `#E2E8F0`. Filled track: teal gradient from `#0D9488` to `#14B8A6`. Thumb: white circle with teal border, slight shadow. Current value displayed as a number above or beside the thumb in monospace.

**Progress Bars:** Background track: `#E2E8F0`. Fill: teal (`#0D9488`). Completed state: success green (`#22C55E`). Border radius matches the bar height (fully rounded ends).

**Navigation:** Bottom tab bar on mobile, left sidebar on desktop. Background: white. Active tab/item: teal icon \+ teal text. Inactive: `#64748B` icon \+ text. No background highlight on active — just the colour change. Keep it minimal.

**Component Rules:** Cards always sit on white (`#FFFFFF`) on the slate background (`#F8FAFC`) — never card-on-card. One level of elevation only. Icons should be outline style, not filled — use Lucide or Phosphor icon sets for consistency. All interactive elements need a visible hover and focus state. Never use teal text on teal backgrounds. The coral accent (`#F97316`) appears on a maximum of one element per page — it's the "look here" colour, not a secondary theme.

# **4\. Technical Architecture**

## **4.1 Tech Stack**

| Layer | Technology | Purpose |
| :---- | :---- | :---- |
| Frontend | Google Stitch \+ Next.js \+ TypeScript | UI, pages, routing |
| Styling | Google Stitch \+ Tailwind CSS | Visual design, responsive layout |
| Backend / API | Next.js API Routes | Server-side logic |
| Database | Supabase (PostgreSQL) | Data storage and queries |
| Authentication | Supabase Auth | Login, sessions, roles |
| Hosting | Vercel | Deployment, CDN, SSL |
| Code Repository | GitHub | Version control |
| Video Hosting | Cloudflare R2 / YouTube | Exercise videos |
| AI Development | Claude Code \+ Cursor | AI-assisted coding |

## **4.2 Database Schema (Core Tables)**

**companies**

Stores each corporate client. All data is scoped to a company\_id for multi-tenancy.

**profiles**

Extends Supabase auth.users with role, company\_id, onboarding status, and plan assignment.

**plans**

Contains the four plan archetypes with full exercise programming data.

**check\_ins**

Weekly check-in submissions. One row per employee per week with all six fields plus timestamp.

**session\_completions**

Records when an employee marks a training session as complete.

**culture\_questions**

Pool of rotating culture questions. Each company has an active question set by the TEMPO coach.

## **4.3 Security and Data Isolation**

* Row Level Security (RLS) on all tables. Employees see only own data. HR sees only own company aggregated. Coaches see assigned companies. Admins see all.

* All connections over HTTPS (enforced by Supabase and Vercel).

* Email \+ password authentication. Future: MFA for HR admin accounts.

* GDPR compliance: privacy policy and Data Processing Agreement required before commercial launch.

* Data deletion capability for employee removal requests.

# **5\. Build Timeline**

| Phase | Deliverable | Duration |
| :---- | :---- | :---- |
| Setup | Dev environment, Supabase, Vercel, project scaffolding | Week 0 (COMPLETE) |
| Phase 1 | Authentication, role-based access, app shell | Week 1 |
| Phase 2 | Employee onboarding flow with plan routing | Week 2 |
| Phase 3 | Training plan viewer with video embedding | Weeks 3–4 |
| Phase 4 | Weekly check-in form and data storage | Week 4 |
| Phase 5 | Leadership dashboard with all metrics | Weeks 5–6 |
| Phase 6 | Polish, mobile responsiveness, pilot deployment | Weeks 6–7 |

**Target:** Product ready for pilot deployment by Week 6 (May 2026).

# **6\. Out of Scope (V1)**

The following are explicitly excluded from V1 to maintain focus:

1. Benefits wallet / credit system (planned for funding phase)

2. AI-powered coaching or automated plan adjustments

3. Native mobile app (V1 is web-only with PWA capability)

4. In-app messaging between employees and coaches

5. Social features, leaderboards, or gamification

6. Wearable device or third-party fitness app integration

7. Automated email notifications (manual for V1)

8. Downloadable PDF reports from dashboard (V1.1)

9. Plan builder interface for coaches (plans entered directly into Supabase for V1)

# **7\. Risks and Dependencies**

| Risk | Impact | Mitigation |
| :---- | :---- | :---- |
| Single developer with AI assistance | Build delays if blocked on technical issues | Claude Code as primary tool; contract dev as escalation |
| Plan data entry dependency on Max | Plan viewer blocked until content populated | Begin data entry in parallel; use placeholder data |
| RSPL pilot timing | Product may not be ready when pilot starts | Run pilot manually; migrate to Takt mid-pilot |
| GDPR / legal compliance | Cannot launch without privacy policy and DPA | Draft during Phase 3; solicitor review before launch |
| Video hosting costs at scale | Costs increase with clients | Start with YouTube; migrate to R2 when revenue justifies |

*— End of Document —*