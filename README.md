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

**See PRD in RULES and System Architecture**

- For project layout and overall site structure & features

## Features

- **Course search** — Filter by department, course number, name, instructor.
- **Course & instructor pages** — Details, sections, reviews, add section to schedule.
- **Schedule builder** — Create schedules, add sections, weekly calendar (7 AM–9 PM).
- **Career planner** — Order semesters, drag sections between schedules, prerequisite validation and conflict resolution.
- **Admin** — CRUD for courses, instructors, sections, prerequisites; view/delete reviews.
