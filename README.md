# MachineIQ — OEM Machine Execution Platform

A production-grade SaaS platform for OEM machine-building companies. MachineIQ connects sales handover, project kickoff, engineering task execution, procurement readiness, and management visibility in one unified system.

## The Problem

OEM companies manage machine projects across Excel, email, meetings, CAD tools, ERP, and shared folders. This causes:

- Weak handover from sales to engineering
- Poor task ownership and accountability
- Hidden dependencies between departments
- Procurement delays from unclear release status
- No dashboard visibility for managers and leadership

**MachineIQ replaces all of that with a single operational execution layer.**

---

## Tech Stack

| Layer         | Technology                             |
| ------------- | -------------------------------------- |
| **Frontend**  | Next.js 14 (App Router) + Tailwind CSS |
| **Backend**   | Node.js + NestJS (modular, API-first)  |
| **Database**  | PostgreSQL 16 + TypeORM (`synchronize: false`) |
| **Real-time** | Socket.IO via `@nestjs/websockets`     |
| **Auth**      | JWT + role-based access control (RBAC) |

---

## Quick Start

```bash
# 1. Clone and setup
git clone <repo-url> machineiq && cd machineiq
./scripts/setup.sh  # installs deps + creates .env files

# 2. Prepare PostgreSQL 16 and apply migrations
./scripts/postgres-setup.sh
npm --prefix backend run db:migration:run

# 3. Seed deterministic Release 1 demo data
npm --prefix backend run seed

# 4. Run development servers
./scripts/dev.sh     # starts backend (:4051) + frontend (:4050)
```

**Local demo login:** `reviewer@machineiq.local` / `ChangeMe123!`

### Shell Scripts

| Script       | Purpose                                        |
| ------------ | ---------------------------------------------- |
| `./scripts/setup.sh` | Install dependencies + create `.env` files |
| `./scripts/seed.sh`  | Seed PostgreSQL with deterministic demo data |
| `./scripts/dev.sh`   | Start backend + frontend concurrently      |
| `./scripts/build.sh` | Production build (both apps)               |
| `./scripts/clean.sh` | Remove `node_modules` and build artifacts  |

---

## Core Modules

| #   | Module                      | Description                                                        |
| --- | --------------------------- | ------------------------------------------------------------------ |
| 1   | **Opportunity Intake**      | Capture customer machine requests with specs, targets, attachments |
| 2   | **Feasibility Review**      | Engineering reviews risk, complexity, and go/no-go decision        |
| 3   | **Kickoff Workspace**       | Meeting notes, attendees, decisions, action items, risks           |
| 4   | **Project Management**      | Stage tracking from inquiry to completion with milestones          |
| 5   | **Machine Breakdown**       | Hierarchical tree: Project → Machine → Module → Subassembly        |
| 6   | **Tasks & Deliverables**    | Assignment, status, priority, due dates, dependencies              |
| 7   | **Dependencies & Blockers** | Upstream/downstream impact visibility and escalation               |
| 8   | **Procurement Handover**    | Track release readiness, ordering status, long-lead risks          |
| 9   | **Notifications**           | Real-time alerts via Socket.IO + in-app notification center        |
| 10  | **Dashboards**              | Executive, Project, Department, and Procurement dashboards         |
| 11  | **Documents & Decisions**   | File attachments, decision log, comments                           |
| 12  | **Admin & Roles**           | User management, RBAC, department config                           |

---

## Documentation

Detailed docs live in the [`docs/`](docs/) folder:

- [Setup Guide](docs/setup-guide.md) — Prerequisites, installation, configuration
- [Architecture](docs/architecture.md) — System design, folder structure, module boundaries
- [Features & Functionality](docs/features.md) — Every module explained in depth
- [Workflows](docs/workflows.md) — End-to-end business processes
- [Data Model](docs/data-model.md) — All entities, fields, relationships, indexes
- [API Reference](docs/api-reference.md) — Every endpoint, method, auth, and payload
- [Specification & Release Tracker](docs/release-spec-tracker.md) — Client requirement traceability, release targets, gates, and build history

---

## Testing & Verification

### Core Commands

```bash
# Frontend production build
cd frontend && npm run build

# Backend production build
cd backend && npm run build

# Backend unit tests
cd backend && npm test -- --runInBand

# Frontend Playwright E2E
cd frontend && npm run test:e2e -- --workers=1

# Standard release-candidate evidence, including a disposable PostgreSQL DB
POSTGRES_TEST_DATABASE_URL=postgresql://machineiq:machineiq@localhost:5432/machineiq_test \
  npm run release:check -- v2.1.0-rc.1

# Include Playwright when the test environment is running
RUN_E2E=1 npm run release:check -- v2.1.0-rc.1
```

### Local PostgreSQL

MachineIQ uses the locally installed PostgreSQL 16 service for development; Docker is not required.

```bash
./scripts/postgres-setup.sh
npm --prefix backend run db:migration:run
npm --prefix backend run seed
npm --prefix backend run db:validate
```

See [Release 1 PostgreSQL testing](docs/postgresql-release1-testing.md) for the
migration integration gate and backup/restore procedure.

Render provisions its own managed PostgreSQL database from `render.yaml` and injects `DATABASE_URL` into the backend.

### Deploy to Render

1. Push the `main` branch to GitHub.
2. In Render, select **New > Blueprint**, connect the repository, and apply
  `render.yaml`.
3. Wait for `machineiq-api` and `machineiq-web` to become healthy. The backend
  runs pending TypeORM migrations before each start.
4. Configure the DNS records Render provides for `www.machineiq.tech` and
  `machineiq.tech`, or remove the `domains` block from `render.yaml` when
  deploying without those domains.

Render generates `JWT_SECRET`; do not add production secrets to this repository.
The frontend is preconfigured to call `https://machineiq-api.onrender.com`.

### Latest Verification Snapshot

Last verified on **August 28, 2026** for `v2.1.0-rc.1`.

| Check | Result | Notes |
| ----- | ------ | ----- |
| Frontend build | Passed | `next build` completed successfully |
| Backend build | Passed | `nest build` completed successfully |
| Backend unit tests | Passed | `367/367` tests passed |
| PostgreSQL migration integration | Passed | Baseline apply, revert, and reapply passed (`2/2`) |
| PostgreSQL seed validation | Passed | `12/12` integrity checks; repeated seed and backup/restore verified |
| Playwright E2E | Partial | Updated auth, setup, navigation, settings, and critical inquiry flows pass; complete desktop/mobile rerun remains |

### Current E2E Status

The Playwright suite is currently **not fully release-certified**. Release 1
navigation/settings expectations and the critical inquiry flows have been
updated, but the complete desktop/mobile matrix still needs a clean run.

Artifacts from the latest run:

- HTML report: `frontend/playwright-report/index.html`
- Raw results, screenshots, videos, and traces: `frontend/playwright-results/`

### Interpretation

The `v2.1.0-rc.1` application is buildable and testable with PostgreSQL. It is
not a final release until the remaining administration UI, complete Playwright
matrix, and Git release commit/tag gates are complete.

---

## Project Structure

```
machineiq/
├── backend/                  # NestJS API server
│   └── src/
│       ├── common/           # Enums, constants
│       ├── decorators/       # @Roles, @CurrentUser
│       ├── guards/           # RolesGuard
│       ├── schemas/          # Mongoose schemas (one per domain)
│       ├── modules/
│       │   ├── auth/         # JWT login/register
│       │   ├── users/        # User CRUD
│       │   ├── departments/  # Department CRUD
│       │   ├── customers/    # Customer CRUD
│       │   ├── opportunities/# Opportunity intake + feasibility
│       │   ├── projects/     # Projects, milestones, kickoff
│       │   ├── machines/     # Machine breakdown (machine/module/sub)
│       │   ├── tasks/        # Task management
│       │   ├── deliverables/ # Deliverable management
│       │   ├── procurement/  # Procurement items + suppliers
│       │   ├── documents/    # Files, decision log, comments
│       │   ├── notifications/# Notifications + Socket.IO gateway
│       │   ├── dashboard/    # Aggregation endpoints
│       │   └── audit-log/    # Audit trail
│       └── seeds/            # Database seeder
├── frontend/                 # Next.js 14 App Router
│   └── src/
│       ├── app/
│       │   ├── login/        # Auth page
│       │   └── (app)/        # Protected layout
│       │       ├── dashboard/
│       │       ├── opportunities/
│       │       ├── projects/
│       │       ├── tasks/
│       │       ├── machines/
│       │       ├── procurement/
│       │       ├── documents/
│       │       ├── notifications/
│       │       └── admin/
│       ├── components/       # Shared UI components
│       ├── lib/              # API client, socket, utils
│       └── providers/        # Auth context provider
├── docs/                     # Project documentation
├── setup.sh / dev.sh / ...   # Management scripts
└── package.json              # Root monorepo scripts
```

---

## Roles & Permissions

| Role                     | Access                                            |
| ------------------------ | ------------------------------------------------- |
| **Admin**                | Full access — users, roles, settings, all data    |
| **Sales**                | Create/view opportunities and requirements        |
| **Project Manager**      | Manage projects, milestones, kickoff, assignments |
| **Engineer / Designer**  | Update assigned tasks, add files, flag blockers   |
| **Procurement**          | Manage procurement statuses, suppliers, ordering  |
| **Manager / Leadership** | View dashboards, reports, escalations             |

All permissions are enforced **server-side** via `@Roles()` guard — never client-side only.

---

## License

Proprietary — All rights reserved.
