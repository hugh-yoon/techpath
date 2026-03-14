# TechPath

Georgia Tech course information and planning platform — search courses, view instructors, build semester schedules, and plan your degree.

## Stack

- **React 19** + **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4** — styling; Georgia Tech brand palette (Tech Gold, Navy, White)
- **Supabase** - PostgresSQL database, client API (no auth implemented ATM)
- **Shadcn / Radix UI** — dialogs, selects, tables, tabs
- **Zustand** — client state (search filters, active schedule, active career)
- **dnd-kit** — drag-and-drop for career planner (reorder semesters, move sections)
- **Zod** + **React Hook Form** + **@hookform/resolvers** — form validation

## Setup

### Prerequisites

- **Node.js** 18+ and **npm**

### 1. Clone and install

```bash
git clone <repo-url>
cd techpath
npm install
```

### 2. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

**Other commands**

- `npm run build` — production build
- `npm run start` — run production server (after `npm run build`)
- `npm run lint` — run ESLint
- `npm run seed` — generate `scripts/seed/seed.sql` from Georgia Tech catalog data (courses, random instructors, sections)

### 3. Database seed (optional)

To populate the Supabase database with Georgia Tech catalog courses and synthetic instructors/sections:

1. Generate the seed file: `npm run seed`
2. In the [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor, run the contents of `scripts/seed/seed.sql` (or run it via `psql` if you have a direct connection).

Run the seed **once on empty tables**. To re-seed, truncate dependent tables (e.g. `schedule_sections`, `sections`, `courses`, `instructors`) in an order that respects foreign keys, then run the SQL again.

**See PRD in RULES and System Architecture**

- For project layout and overall site structure & features

## Features

- **Course search** — Filter by department, course number, name, instructor.
- **Course & instructor pages** — Details, sections, reviews, add section to schedule.
- **Schedule builder** — Create schedules, add sections, weekly calendar (7 AM–9 PM).
- **Career planner** — Order semesters, drag sections between schedules, prerequisite validation and conflict resolution.
- **Admin** — CRUD for courses, instructors, sections, prerequisites; view/delete reviews.
