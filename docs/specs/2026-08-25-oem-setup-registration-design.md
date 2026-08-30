# OEM Setup & Registration — Design Spec

**Date:** 2026-08-25
**Status:** Approved, implementation in progress

## Context

MachineIQ has no in-app way to create the first admin account in a fresh
deployment. The only bootstrap mechanism today is running `run-seed.ts` or
`seed-users-only.ts` directly against MongoDB, which hardcodes demo
credentials (`admin@machineiq.com` / `password123`) — not viable for a real
production deployment.

Research confirmed two facts that shape this design:

1. **This is a single-tenant app.** No `Organization`/`Tenant`/`OEM` entity or
   scoping field exists anywhere in `backend/src/schemas/`. "OEM" in the
   product branding means the one company running a given deployment, not a
   per-signup concept. This design does **not** introduce multi-tenancy —
   that would require tenant-scoping every collection and is explicitly out
   of scope.
2. **`POST /auth/register` is a live, unauthenticated privilege-escalation
   hole.** `auth.controller.ts:20-23` has no guard, and `auth.service.ts:15-38`
   persists whatever `role` the caller sends. It's only ever *called* from
   the admin-gated "Add User" screen
   (`frontend/src/app/(app)/admin/users/page.tsx`), but nothing stops a
   direct API call from registering as `admin`. This is fixed as part of
   this change.

## Goals

- Let an OEM bootstrap a fresh production deployment through the UI: company
  name, machine segment, and a first admin account — no shell/Mongo access
  required.
- Close the `POST /auth/register` privilege-escalation hole.
- Keep local dev seeding (`run-seed.ts`, `seed-users-only.ts`,
  `./scripts/reset-db.sh`) exactly as-is — this only changes how *production*
  gets its first user.

## Non-goals

- Multi-tenancy. No `Organization`/`Tenant` schema, no tenant-scoping on
  existing collections.
- A configurable/re-runnable "company settings" wizard beyond the one-time
  bootstrap — company profile editing after setup already exists via
  `SettingsController` (admin-only `PATCH /settings/:key`).
- Auto-creating default departments. The six demo departments
  (Mechanical/Electrical/Controls/Procurement/Sales/PM) are MachineIQ's
  example org structure, not every OEM's — the admin creates whatever fits
  their company via the existing Departments screen.

## Backend design

### `SetupDto` (new, in `auth.dto.ts`)

- `organizationName: string` — required, matches existing
  `Settings.commercial_preferences.organizationName` field name.
- `machineSegment: string` — optional, free text (e.g. "Foundry
  automation", "SPM & fixtures"). No enum — confirmed with user.
- `firstName`, `lastName`, `email`, `password` — identical fields and
  validation rules to `RegisterDto` (password: min 10 / max 128, upper +
  lower + digit).

### `GET /auth/setup/status` (new)

- Public, no guard.
- Returns `{ needsSetup: boolean }` — `true` iff `User.countDocuments({}) ===
  0` (unfiltered — deliberately counts soft-deleted users too, so this
  matches the `POST /auth/setup` gate below exactly; see note there).
- Side-effect-free, safe to call on every page load.

### `POST /auth/setup` (new)

- Public, no guard — but re-checks the same "any user exists?" condition
  server-side as the first thing it does, using the identical unfiltered
  `User.countDocuments({}) === 0` check the status endpoint uses (including
  soft-deleted users deliberately — a deployment that has ever had a user
  can never be re-bootstrapped, even if that user was later deleted). If the
  count is non-zero, throws `ForbiddenException`. This is permanent, not a
  flag — matches the "empty-database gate" pattern confirmed with the user
  (no env var toggle).
- On success:
  1. Upserts `organizationName` and `machineSegment` into the existing
     `SystemSetting` `commercial_preferences` key via `SettingsService`
     (`settings.service.ts:73-94`'s `upsert`) — no new schema.
  2. Creates the first `User` with `role: Role.ADMIN` **hardcoded in the
     service**, never read from the request body (`SetupDto` has no `role`
     field at all — this isn't just a default, the field doesn't exist).
  3. Returns the same `{ accessToken, user }` shape `login`/`register`
     already return, so the frontend can log the admin straight in.
- Rate-limited like `register` (20/min) — cheap defense-in-depth even though
  the empty-DB gate is the real protection.

### Locking down `POST /auth/register`

- Add `@UseGuards(AuthGuard('jwt'), RolesGuard)` + `@Roles(Role.ADMIN)` at
  the controller level (matching the pattern every other admin-only route in
  this codebase already uses per `CLAUDE.md`'s "Rules to follow when adding
  endpoints").
- No frontend change needed: the only caller
  (`frontend/src/app/(app)/admin/users/page.tsx`) already runs inside the
  authenticated `(app)` layout and sends a valid admin JWT via `ApiClient`'s
  auto-injected `Authorization` header.

## Frontend design

### New public page: `frontend/src/app/setup/page.tsx`

- Same split-panel branding as `frontend/src/app/login/page.tsx` (dark hero
  left, form right) — outside the `(app)` route group, like login.
- Fields: OEM name, Machine segment (labeled optional), First name, Last
  name, Email, Password.
- On mount: calls `GET /auth/setup/status`. If `needsSetup: false`, redirect
  to `/login` immediately (nothing to do here, already bootstrapped).
- On submit: `POST /auth/setup`, store the returned token via the same
  `auth-provider.tsx` mechanism `login()` uses, redirect to `/dashboard`.

### `frontend/src/app/login/page.tsx` — one addition

- On mount: calls `GET /auth/setup/status`. If `needsSetup: true`, redirect
  to `/setup` (fresh deployment, nothing to log into yet).

## Testing plan

Backend unit tests (new `auth.service.spec.ts` cases, alongside existing
ones):

- `setup()` succeeds against an empty `User` collection.
- `setup()` throws when any user already exists.
- `setup()` throws on duplicate... n/a (no users exist by definition when it
  succeeds) — but does still validate email format / password complexity via
  the DTO pipe, covered by a rejected-DTO test.
- `setup()` always creates the user with `role: admin` — assert on the
  created document, not on any input, since there is no role input.
- `setup()` writes `organizationName`/`machineSegment` into
  `SystemSetting` under `commercial_preferences`.
- `getSetupStatus()` returns `true`/`false` correctly.
- `register()` now requires an authenticated admin — test that an
  unauthenticated call is rejected, and an authenticated non-admin call is
  rejected, and an authenticated admin call still succeeds (regression
  guard for the "Add User" screen).

## Verification plan

**Local, before pushing:**
Against a genuinely empty local DB (drop all collections, no seed): confirm
`/login` redirects to `/setup`, confirm `/setup` creates the admin and lands
on `/dashboard`, confirm a second `/setup` POST is rejected, confirm
`/login` no longer redirects afterward.

**Production, after deploying, before sharing with the client:**
Hit `GET https://machineiq-api.onrender.com/api/auth/setup/status` directly.
This is the deterministic answer to "is there already a stray user in the
production Atlas DB from an earlier failed seed attempt" — no dashboard/DB
console access needed:
- `{"needsSetup": true}` → clean, proceed to `/setup`.
- `{"needsSetup": false}` → a user already exists; stop and investigate
  before doing anything else.
