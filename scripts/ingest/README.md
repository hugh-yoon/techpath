# Data ingestion

Automated sync jobs keep TechPath course and instructor data current from
two external sources. **Cadence differs by data type** — course offerings
change slowly; professor ratings and reviews change frequently.

## Sync schedule

| Cadence | Job | Edge Function | Source | What gets updated |
|---------|-----|---------------|--------|-------------------|
| **Monthly** (1st, 03:00 UTC) | `banner-sync-monthly` | `banner-sync` | [GT Banner class search](https://registration.banner.gatech.edu/StudentRegistrationSsb/ssb/classSearch/classSearch) | **Course & section info** — titles, subjects, course numbers, section codes, credit hours, CRNs, term/year, instructors (names), meeting times, campus, locations, schedule types (lecture/lab), linked sections |
| **Daily** (04:00 UTC) | `rmp-sync-daily` | `rmp-sync` | [Rate My Professors — GT (school 361)](https://www.ratemyprofessors.com/search/professors/361?q=*) | **Teacher info** — quality ratings, difficulty, “would take again” %, rating counts, individual review comments; matched to instructors discovered via Banner |

### Why different cadences?

- **Course info (monthly)** — Banner schedules are published per term and
  rarely change mid-semester. A monthly pull of current + next term is enough.
- **Teacher info (daily)** — RMP ratings and reviews accumulate continuously.
  A daily pull keeps instructor profiles and `instructor_reviews` (where
  `source = 'rmp'`) fresh for students evaluating professors.

### Data flow

```
Banner (monthly)  →  courses, sections, terms, instructor names
                              ↓
RMP (daily)       →  instructor ratings, reviews, difficulty
                     (matched to instructors from Banner)
```

## Design choices (confirmed)

| Decision | Choice |
|----------|--------|
| Cron host | Supabase Edge Functions + `pg_cron` |
| Course sync cadence | **Monthly** (`banner-sync`) |
| Teacher/RMP sync cadence | **Daily** (`rmp-sync`) |
| RMP reviews | Merged into `instructor_reviews` with `source = 'rmp'` |
| Banner terms | Current + next term only |
| Unmatched professors | Best-effort auto-match (confidence ≥ 0.75) |
| Stale sections | `is_active = false` (preserve student schedules) |

## Setup

1. Apply migrations in `supabase/migrations/`.
2. Add secrets to `.env` (see `.env.example`):
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET` (optional but recommended)
3. Deploy Edge Functions:
   ```bash
   supabase functions deploy banner-sync --no-verify-jwt
   supabase functions deploy rmp-sync --no-verify-jwt
   ```
4. Set **custom** function secrets in Supabase Dashboard → Edge Functions →
   Secrets. Only add secrets you own — **do not** add names starting with
   `SUPABASE_` (the dashboard will reject them).

   | Add manually | Required? |
   |--------------|-----------|
   | `CRON_SECRET` | Yes — your random bearer token for cron/manual triggers |

   **Already injected by Supabase** (no action needed):
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, etc.
   See [Edge Function secrets docs](https://supabase.com/docs/guides/functions/secrets).
5. Enable cron jobs — uncomment SQL in
   `supabase/migrations/20250609130000_ingestion_cron.sql` after
   storing `project_url` and `cron_secret` in Vault.

## Manual trigger

```bash
curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://<project-ref>.supabase.co/functions/v1/banner-sync

curl -X POST \
  -H "Authorization: Bearer $CRON_SECRET" \
  https://<project-ref>.supabase.co/functions/v1/rmp-sync
```

## Sources

- [GT Banner class search](https://registration.banner.gatech.edu/StudentRegistrationSsb/ssb/classSearch/classSearch)
- [RMP — Georgia Tech (school 361)](https://www.ratemyprofessors.com/search/professors/361?q=*)

## Banner API flow (validated)

1. `GET classSearch/get_subject?term={code}&offset=1&max=500`
2. `POST term/search` (form body) — establishes session cookies
3. `GET searchResults/searchResults?txt_subject=CS&txt_term={code}&pageOffset=0&pageMaxSize=500`

## RMP API

GraphQL `POST https://www.ratemyprofessors.com/graphql` with
`Authorization: Basic dGVzdDp0ZXN0` and GT school id `U2Nob29sLTM2MQ==`.

## Remaining steps

1. Surface RMP-sourced reviews in instructor UI with attribution.
2. Admin view for `sync_jobs` run history.
3. Enable `pg_cron` schedules after deploy verification.
