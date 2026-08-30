# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**machineIQ** is a production-grade SaaS platform for OEM machine-building companies. It unifies sales handover, project kickoff, engineering task execution, procurement readiness, and management dashboards.

Reference docs:
- `productspec.md` — Full product specification, module details, data model, workflows
- `master build.md` — Build goals, required modules, dashboards, permissions, non-functional requirements

---

## Commands

```bash
./scripts/setup.sh      # Install all dependencies + create .env files (run once)
./scripts/seed.sh       # Seed MongoDB with departments, users, sample data
./scripts/dev.sh        # Start backend (:4051) + frontend (:4050) — Ctrl+C stops all
./scripts/logs.sh       # Watch live dev server logs (run in separate terminal)
./scripts/build.sh      # Production build
./scripts/restart.sh    # Restart dev servers
./scripts/stop.sh       # Stop all running services
./scripts/clean.sh      # Remove node_modules and build artifacts
```

All scripts live in [scripts/](scripts/). You can also use `./miq <command>` as a shorthand from anywhere inside the project.

> **Install note:** `setup.sh` uses `--legacy-peer-deps` because `@nestjs/mongoose@10` declares a peer on `mongoose@^8` while the project runs `mongoose@^9`. The app functions correctly — this is a peer-dep declaration gap only.

**Dev credentials (seeded):**

| Email | Password | Role |
|-------|----------|------|
| `admin@machineiq.com` | `password123` | admin |
| `demo@machineiq.com` | `password123` | admin |
| `sarah@machineiq.com` | `password123` | sales |
| `james@machineiq.com` | `password123` | admin |
| `anna@machineiq.com` | `password123` | designer |
| `tom@machineiq.com` | `password123` | designer |
| `lisa@machineiq.com` | `password123` | admin |
| `david@machineiq.com` | `password123` | leadership |

> **Note:** `password123` does not meet the production password policy (min 10 chars, upper + lower + number). Update credentials before any non-dev deployment.

### Lint

```bash
cd backend && npm run lint
cd frontend && npm run lint
```

### Tests

**Backend unit tests (Jest):**
```bash
cd backend && npm test              # run all unit tests
cd backend && npm run test:watch    # watch mode
cd backend && npm run test:cov      # with coverage report
```

**Frontend E2E tests (Playwright):**
```bash
cd frontend && npx playwright test                        # all tests
cd frontend && npx playwright test tests/auth.spec.ts     # single file
cd frontend && npx playwright test tests/settings.spec.ts # settings page
cd frontend && npx playwright test --reporter=list        # verbose output
cd frontend && npx playwright show-report                 # open HTML report
```

**Known pre-existing failures (4 tests, 8 runs desktop+mobile):**
- `workflows.spec.ts` — project detail execution snapshot, machine breakdown tree, procurement mobile view, opportunity-to-project conversion. These fail because those page sections are not yet fully implemented. All other tests pass.

---

## Architecture

### Stack

| Layer     | Technology                                          |
|-----------|-----------------------------------------------------|
| Frontend  | Next.js 14 (App Router) + Tailwind CSS + Lucide icons |
| Backend   | NestJS (modular, API-first)                         |
| Database  | MongoDB (Mongoose ODM)                              |
| Real-time | Socket.IO via @nestjs/websockets                    |
| Auth      | JWT + RBAC                                          |

### Backend — `backend/src/`

NestJS modules follow the pattern: `modules/<name>/<name>.controller.ts` + `<name>.service.ts` + `<name>.module.ts`. Mongoose schemas are in `schemas/` (one file per domain area). Common enums live in `common/`.

**Key cross-cutting concerns:**
- `@Roles()` decorator + `RolesGuard` — RBAC enforced on every endpoint (never trust client-side)
- `AuditLog` — every mutation that changes project/task state must create an AuditLog entry via the audit-log module
- Soft-delete — entities have a `deletedAt` field; never hard-delete production data
- DTOs with `class-validator` for all input validation at API boundaries
- Mongoose `populate()` for relational queries across the 13+ schemas

### Frontend — `frontend/src/`

- `app/(app)/` — Protected routes requiring JWT. The `layout.tsx` wraps with the Auth provider.
- `lib/api.ts` — `ApiClient` singleton that auto-injects `Bearer <token>` from `localStorage` (`machineiq_token`, `machineiq_user`). 401 responses trigger auto-logout and redirect to `/login`.
- `lib/socket.ts` — Socket.IO client for real-time notifications.
- All business logic stays in the backend; the frontend consumes REST only.

---

## Domain Model

The ISA-88 machine breakdown hierarchy is:

```
Project → Machine → Unit → EquipmentModule → ControlModule → Component
```

Core entities: `User`, `Department`, `Customer`, `Opportunity`, `Project`, `Milestone`, `Machine`, `Unit`, `EquipmentModule`, `ControlModule`, `Component`, `Task`, `ProcurementItem`, `Supplier`, `Document`, `DecisionLog`, `Notification`, `AuditLog`

Always enforce `departmentId`, `status`, and ownership on tasks and components.

**Roles** (`backend/src/common/enums.ts`):
`admin` | `sales` | `designer` | `leadership`

---

## Conventions

**Status enums** — use exact string values from `backend/src/common/enums.ts`, never numbers:
- **Task:** `not_started` | `in_progress` | `waiting_for_input` | `under_review` | `blocked` | `released` | `closed`
- **Opportunity:** `new` | `under_review` | `feasibility_in_progress` | `approved` | `rejected` | `converted_to_project`
- **Project stage:** `inquiry` | `feasibility` | `concept_approved` | `engineering_in_progress` | `review_release` | `procurement_in_progress` | `build_assembly` | `fat_sat` | `completed` | `on_hold` | `cancelled`
- **Project health:** `healthy` | `watch` | `at_risk` | `delayed`
- **Priority:** `low` | `medium` | `high` | `critical`
- **Task type:** `design` | `review` | `approval` | `release` | `procurement_handover` | `follow_up`
- **Procurement status:** `not_applicable` | `pending_design_release` | `ready_for_procurement` | `ordered` | `partially_received` | `received` | `changed_after_release`
- **Module coordination status:** `not_started` | `in_progress` | `blocked` | `completed` | `ready_for_procurement`
- **Component design status:** `NotStarted` | `InDesign` | `UnderReview` | `Released`
- **Component procurement status:** `NotReady` | `Ready` | `Ordered` | `Received`
- **Component assembly status:** `NotReady` | `Ready` | `Installed`
- **Component lifecycle stage:** `design` | `review` | `release` | `procurement_ready` | `ordered` | `received` | `assembly_ready` | `blocked`

**Naming & formatting:**
- `camelCase` for Mongoose schema fields, API response fields, and all TypeScript/JS code
- Dates in ISO 8601 UTC

**UI patterns:**
- Table views (desktop) + card views (mobile) for data lists
- Kanban board for tasks; hierarchical tree for Machine Breakdown Structure
- Status badges with semantic Tailwind colour coding
- Strong filtering by project, department, owner, status, risk

---

## Security

### What is in place

| Layer | Control |
|-------|---------|
| HTTP headers | `helmet` — sets `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Content-Security-Policy`, `X-XSS-Protection` on every response |
| Rate limiting | `@nestjs/throttler` — global 120 req/min; login 5/min; register 3/min |
| Auth | JWT via `passport-jwt`; token validated on every protected route |
| RBAC | `@Roles()` + `RolesGuard` enforced server-side on every endpoint |
| Input validation | `ValidationPipe` with `whitelist: true` + `forbidNonWhitelisted: true`; all request bodies use typed DTOs |
| Password policy | Min 10 chars, max 128, must contain upper + lower + number; `MaxLength(128)` on `LoginDto` prevents bcrypt DoS |
| NoSQL injection | Enum fields (`role`, `status`, `priority`) whitelisted against `Object.values(enum)` before use in queries; all ID fields validated with `Types.ObjectId.isValid()` |
| Error handling | `AllExceptionsFilter` — unhandled errors return generic `500`; stack traces logged server-side only, never sent to client |
| CORS | Explicit origin whitelist from `CORS_ORIGIN` env var; explicit method + header whitelist |
| Password storage | bcrypt with 12 rounds; `select: false` on schema + explicit `.select('-password')` on all user queries |
| Soft-delete | `deletedAt` field; no hard deletes — audit trail always preserved |
| Mass assignment | All `PATCH` endpoints use strict DTOs — `password` and `email` excluded from `UpdateUserDto` |

### Key files

- `backend/src/main.ts` — helmet, CORS config, JWT secret startup validation, global exception filter
- `backend/src/app.module.ts` — `ThrottlerModule` registration and global `ThrottlerGuard`
- `backend/src/filters/http-exception.filter.ts` — prevents stack trace leakage
- `backend/src/modules/auth/auth.dto.ts` — password complexity rules
- `backend/src/modules/auth/auth.controller.ts` — per-endpoint `@Throttle` overrides
- `backend/src/modules/users/users.dto.ts` — `UpdateUserDto` (mass assignment protection)

### Rules to follow when adding endpoints

1. Always apply `@UseGuards(AuthGuard('jwt'), RolesGuard)` at controller level
2. Always add `@Roles(...)` — if omitted, `RolesGuard` allows any authenticated user
3. Never use `@Body() dto: any` — always define a typed DTO
4. Validate ObjectId params before querying: `if (!Types.ObjectId.isValid(id)) throw new NotFoundException()`
5. Whitelist enum query params against `Object.values(MyEnum)` before adding to filter objects

### Known accepted risks (future work)

- JWT stored in `localStorage` — vulnerable to XSS. Migrating to httpOnly cookies requires a dedicated sprint (CSRF tokens, backend session management)
- JWT expiry `8h` — intentional for UX during business hours; add refresh token flow when reducing to `1–2h`

---

## Environment Variables

**Backend** (`.env`):
- `MONGODB_URI` — default `mongodb://localhost:27017/machineiq`
- `JWT_SECRET` — **required**, min 32 chars, must not start with `change-this` (server refuses to start otherwise)
- `JWT_EXPIRATION` — default `8h`
- `PORT` — default `4051`
- `CORS_ORIGIN` — default `http://localhost:4050`; comma-separate for multiple origins

**Frontend** (`.env.local`):
- `NEXT_PUBLIC_API_URL` — default `http://localhost:4051/api`
- `NEXT_PUBLIC_SOCKET_URL` — default `http://localhost:4051`
