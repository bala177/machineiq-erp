# OEM Machine Execution Platform — Copilot Instructions

## Project Overview

**MachineIQ** is a production-grade SaaS platform for OEM machine-building companies. It connects sales handover, project kickoff, engineering task execution, procurement readiness, and management visibility in one unified system.

Core docs:

- [`productspec.md`](../productspec.md) — Full product specification, module details, data model, and workflows
- [`master build.md`](../master%20build.md) — Build goals, required modules, dashboards, permissions, and non-functional requirements

---

## Architecture

| Layer     | Technology                                                          |
| --------- | ------------------------------------------------------------------- |
| Frontend  | Next.js 14 (App Router) + Tailwind CSS — mobile-first enterprise UI |
| Backend   | Node.js with NestJS (modular, API-first)                            |
| Database  | MongoDB (Mongoose ODM)                                              |
| Real-time | Socket.IO (via @nestjs/websockets)                                  |
| Auth      | JWT + role-based access control (RBAC)                              |

**Modular, API-first**: All business logic lives in backend NestJS modules. The frontend consumes REST APIs only — no business logic in the UI layer. Real-time notifications are delivered via Socket.IO.

**12 core modules** (see `productspec.md §7`):

1. Opportunity / Machine Request Intake
2. Feasibility Review
3. Kickoff Workspace
4. Project & Stage Management
5. Machine Breakdown Structure (Project → Machine → Module → Subassembly → Task/Deliverable)
6. Task & Deliverable Management
7. Dependency & Blocker Tracking
8. Procurement Readiness & Handover
9. Notifications / Reminders / Escalation
10. Dashboards & Reporting (Executive, Project, Department, Procurement)
11. Documents & Decision Log
12. Admin / Role Permissions

---

## Data Model

Core entities (see `master build.md` for full list):
`User`, `Department`, `Customer`, `Opportunity`, `Requirement`, `Project`, `Milestone`, `Machine`, `Module`, `Subassembly`, `Task`, `Deliverable`, `Dependency`, `Blocker`, `ProcurementItem`, `Supplier`, `Document`, `DecisionLog`, `Comment`, `Notification`, `Risk`, `AuditLog`

Always enforce ownership, `departmentId`, and `status` on tasks and deliverables. Every mutation that affects project state must create an `AuditLog` entry.

---

## Role-Based Permissions

| Role                 | Capabilities                                      |
| -------------------- | ------------------------------------------------- |
| Sales                | Create/view opportunities                         |
| Project Manager      | Manage projects, milestones, kickoff, assignments |
| Engineer / Designer  | Update assigned tasks, add files/blockers         |
| Procurement          | Manage procurement statuses and comments          |
| Manager / Leadership | View dashboards and reports                       |
| Admin                | Manage users, roles, workflow rules, templates    |

Always check role permissions server-side — never trust client-side role checks.

---

## Conventions

- **Task statuses**: `not_started` | `in_progress` | `waiting_for_input` | `under_review` | `blocked` | `released` | `closed`
- **Opportunity statuses**: `new` | `under_review` | `feasibility_in_progress` | `approved` | `rejected` | `converted_to_project`
- **Project stages**: `inquiry` | `feasibility` | `concept_approved` | `engineering_in_progress` | `review_release` | `procurement_in_progress` | `build_assembly` | `fat_sat` | `completed` | `on_hold` | `cancelled`
- Use `camelCase` for Mongoose schema fields and API response fields; `camelCase` in TypeScript/JS code.
- All dates in ISO 8601 UTC.
- Soft-delete entities (add `deletedAt` field) — never hard-delete production data.
- Validate all inputs at API boundaries. Use class-validator (NestJS DTOs).
- Mongoose schemas live in `backend/src/schemas/`. One file per domain area.

---

## UI Expectations

- Mobile-first responsive design — enterprise-grade look and feel
- Clean industrial SaaS look — professional, minimal clutter
- Table views (desktop) and card views (mobile) for data lists
- Kanban board view for tasks
- Hierarchical tree view for Machine Breakdown Structure
- Status badges with semantic colour coding using Tailwind
- Strong filtering: by project, department, owner, status, risk
- Responsive layout (mobile-first, desktop-optimized)

---

## Non-Functional Requirements

- Role-based security enforced server-side on every endpoint
- Audit trail on all state-changing actions (`AuditLog`)
- Scalable structure — no monolithic controllers; use service/repository layers
- Clean API separation — frontend must not bypass the API
- Form validation on every input surface
