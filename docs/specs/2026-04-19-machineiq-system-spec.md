# MachineIQ — Complete System Specification
**Date:** 2026-04-19  
**Status:** Living document — updated as the platform evolves  
**Audience:** Product, Engineering, QA

---

## 1. Product Purpose

MachineIQ is a SaaS platform built for **OEM machine-building companies** (Original Equipment Manufacturers). It digitises and connects the full lifecycle of a custom machine build:

```
Customer Enquiry → Feasibility → Project Kickoff → 
Engineering Design → Procurement → Build & Assembly → FAT/SAT → Delivery
```

The platform serves every department involved in that journey: Sales, Project Management, Mechanical Engineering, Electrical Engineering, Controls Engineering, Procurement, and Leadership.

---

## 2. Who Uses It

| Role | Who They Are | Primary Job in the Tool |
|------|-------------|------------------------|
| `admin` | Platform administrator | Full access, user management, system settings |
| `sales` | Sales / Marketing | Capture enquiries, manage opportunities |
| `project_manager` | PM / Program Manager | Run projects, assign tasks, track milestones |
| `engineer` | Mechanical / Electrical / Controls designer | Execute design tasks, manage components |
| `designer` | CAD / Drafter | Same as engineer for design work |
| `procurement` | Purchasing team | Manage suppliers and procurement items |
| `manager` | Department heads | Read-only oversight, dashboard reporting |
| `leadership` | C-suite / Directors | Executive dashboards and KPIs |

---

## 3. Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Lucide icons |
| Backend | NestJS (modular, API-first), TypeScript |
| Database | MongoDB via Mongoose ODM |
| Auth | JWT (8h expiry) + RBAC via `@Roles()` guard |
| Real-time | Socket.IO via `@nestjs/websockets` |
| Background jobs | Custom worker services (component reminders) |

**Dev URLs:**
- Frontend: `http://localhost:4050`
- Backend API: `http://localhost:4051/api`

---

## 4. Domain Model

### 4.1 ISA-88 Machine Hierarchy

The platform uses the ISA-88 standard as the structural spine for all machine engineering work:

```
Project
└─ Machine                          (top-level product)
   └─ Unit / Module                 (functional section, e.g. "Infeed Section")
      │  Department: Mechanical | Electrical | Automation
      └─ Equipment Module           (physical subassembly, e.g. "Timing Screw Assembly")
         └─ Control Module          (control grouping, e.g. "Servo Timing Axis")
            └─ Component            (individual part or item, e.g. "Servo Gearbox")
```

Every component is tagged to its exact position in this hierarchy, enabling full traceability from a part to its machine context.

### 4.2 Complete Entity List

| Entity | Description |
|--------|-------------|
| `User` | Platform user with role and department |
| `Department` | Organisational unit (Mechanical Eng, Electrical Eng, Procurement, etc.) |
| `Customer` | OEM's customer (the company buying the machine) |
| `Opportunity` | A sales enquiry / machine request, pre-project |
| `Project` | An active machine build project |
| `Machine` | Top-level ISA-88 node |
| `Unit` | Second-level ISA-88 node (module/section) |
| `EquipmentModule` | Third-level ISA-88 node (subassembly) |
| `ControlModule` | Fourth-level ISA-88 node (controls grouping) |
| `Component` | Leaf node — actual parts with full lifecycle tracking |
| `Task` | A unit of work assigned to a person/department |
| `Deliverable` | A structured output (document, drawing, BOM) |
| `ProcurementItem` | A line item to be ordered from a supplier |
| `Supplier` | A vendor in the supplier master |
| `ProjectDocument` | A file attachment on a project |
| `DecisionLog` | A formal decision record with participants |
| `Comment` | Inline comment on a task, deliverable, or opportunity |
| `Notification` | In-app notification record |
| `AuditLog` | Immutable record of every mutation |
| `Risk` | Project risk register entry |
| `SystemSetting` | Key-value platform configuration |

---

## 5. Module-by-Module Specification

### 5.1 Authentication

**Endpoints:**
- `POST /auth/login` — Returns JWT. Rate limited to 5 requests/min.
- `POST /auth/register` — Creates user account. Rate limited to 3 requests/min.

**Security:**
- Bcrypt password hashing (12 rounds)
- Password policy: min 10 chars, max 128, must contain uppercase + lowercase + number
- JWT stored in `localStorage` (known XSS risk — documented, migration to httpOnly cookies is future work)
- Token expiry: 8 hours (intentional for business-day UX)
- `401` responses trigger auto-logout and redirect to `/login`

---

### 5.2 Users

**What it does:** Manages platform users — creation, role assignment, activation/deactivation.

**Fields:** `firstName`, `lastName`, `email`, `password`, `role`, `departmentId`, `title`, `phone`, `isActive`, `deletedAt`

**Access rules:**
- Any authenticated user can view their own profile
- `admin`, `project_manager`, `manager`, `leadership` can list all users
- Only `admin` can create, edit, or deactivate users

**Soft-delete:** Users are never hard-deleted. `deletedAt` is set; they disappear from active lists but audit history is preserved.

---

### 5.3 Customers

**What it does:** CRM for the OEM's customer companies. Customers are linked to Opportunities and Projects.

**Fields:** `name`, `contactPerson`, `email`, `phone`, `website`, `address`, `country`, `city`, `stateProvince`, `postalCode`, `industry`, `notes`

**Access rules:**
- Anyone authenticated can read
- `admin`, `sales`, `project_manager` can create and edit
- Only `admin` can delete

---

### 5.4 Opportunities

**What it does:** Captures the sales enquiry lifecycle from initial contact through to project conversion.

**Status workflow:**
```
new → under_review → feasibility_in_progress → approved → converted_to_project
                                             ↘ rejected
```

**Fields — Intake (captured by Sales):**
- `title` — Request name / machine description *(required)*
- `customerId` — Linked customer *(required)*
- `endCustomer` — The final site / end user (if different from direct customer)
- `machineType` — Type of machine requested *(required)*
- `productApplication` — What the machine processes or produces
- `axisCount` — Number of servo axes
- `throughputTarget` — Target production rate
- `safetyRequirements` — Safety standard requirements (free text)
- `complianceRegion` — Geographic compliance region (CE, North America, etc.)
- `deliveryTargetDate` — Customer's required delivery date *(required)*
- `budgetNotes` — Budget context (free text)
- `specialRequirements` — Any non-standard requirements (free text)
- `customRequirements` — Structured array of `{title, details}` for machine-specific items
- `priority` — `low | medium | high | critical`
- `attachments` — File URLs (RFQ docs, layout drawings)

**Fields — Review (captured by Engineering / PM):**
- `assignedReviewer` — User responsible for feasibility
- `feasibilityNotes` — Technical feasibility assessment
- `riskNotes` — Engineering risk assessment
- `complexityNotes` — Complexity and effort assessment

**Conversion to Project:**
- Triggered by `POST /opportunities/:id/convert`
- Creates a linked `Project` record in `inquiry` stage
- Sets `convertedProjectId` on the Opportunity
- Access: `admin`, `project_manager` only

**Access rules:**
- `sales`, `admin`, `project_manager` — Create and edit intake fields
- `admin`, `project_manager`, `engineer` — Update review fields and status
- Only `admin` can delete

---

### 5.5 Projects

**What it does:** The central container for an active machine build. Every engineering, procurement, and assembly activity links back to a Project.

**Stage workflow:**
```
inquiry → feasibility → concept_approved → engineering_in_progress → 
review_release → procurement_in_progress → build_assembly → fat_sat → completed

Exit states: on_hold | cancelled
```

**Health states:** `healthy | watch | at_risk | delayed`

**Fields:**
- `name`, `description`
- `opportunityId` — Link back to originating opportunity (nullable)
- `customerId` — Customer this project is for
- `projectManagerId` — Assigned PM
- `teamMembers` — Array of User IDs
- `stage`, `health`, `priority`
- `targetDeliveryDate`, `startDate`
- `milestones` — Array of `{title, targetDate, actualDate, completed, notes}`
- `kickoff` — Structured meeting record:
  - `date`, `attendees[]`, `agendaItems[]`, `decisions[]`, `actionItems[]`, `risks[]`, `notes`
- `attachments` — File URLs

**Relationships (one project → many):**
- Machines → Units → Equipment Modules → Control Modules → Components
- Tasks
- Deliverables
- Procurement Items
- Documents
- Decision Logs
- Notifications
- Audit Logs

**Access rules:**
- `admin`, `project_manager` — Create, edit, manage milestones, record kickoff
- All authenticated users — Read
- Only `admin` — Delete (soft-delete)

---

### 5.6 Machines & ISA-88 Hierarchy

**What it does:** Represents the physical machine structure using ISA-88. This is the engineering backbone — all design work, tasks, and components attach here.

**Machine fields:** `name`, `description`, `projectId`, `ownerId`, `sortOrder`

**Unit (Module) fields:**
- `name`, `description`, `projectId`, `machineId`
- `ownerId`, `ownerName`
- `department` — `Mechanical | Electrical | Automation`
- `plannedStartDate`, `plannedEndDate`
- `status` — `not_started | in_progress | blocked | completed | ready_for_procurement`
- `deliverables` — Array of `{label, completed}` (module-level checklist)
- `releaseReady` — Boolean flag
- `componentsLocked` — Boolean flag
- `releasedToProcurementAt` — Timestamp when released

**Equipment Module fields:** `name`, `description`, `unitId`, `machineId`, `projectId`, `ownerId`, `sortOrder`

**Control Module fields:** `name`, `description`, `equipmentModuleId`, `unitId`, `machineId`, `projectId`, `ownerId`, `sortOrder`

**Special endpoints:**
- `GET /machines/:id/tree` — Returns full ISA-88 tree for a machine
- `GET /machines/:id/stats` — Component/task rollup stats
- `POST /machines/:id/import` — Import machine structure from JSON
- `POST /machines/units/:id/release-to-procurement` — Marks unit released

---

### 5.7 Components

**What it does:** Individual parts and items that make up the machine. Each component has a three-stage lifecycle covering design, procurement, and assembly.

**Fields:**
- `name`, `code`, `partName`, `description`, `quantity`
- `category` — `Mechanical | Electrical | COTS | Custom`
- `discipline` — `Mechanical | Electrical | Controls`
- `supplier`, `leadTimeWeeks`, `longLeadRisk`
- `status` — `Planned | Confirmed | Ordered`
- `remarks`
- ISA-88 context: `projectId`, `machineId`, `unitId`, `equipmentModuleId`, `controlModuleId`
- `parentType`, `parentId` — Where in the hierarchy this component lives
- `ownerId`, `reviewerId`, `dueDate`

**Three-stage lifecycle:**

| Stage | Field | States |
|-------|-------|--------|
| Design | `designStatus` | `NotStarted → InDesign → UnderReview → Released` |
| Procurement | `procurementStatus` | `NotReady → Ready → Ordered → Received` |
| Assembly | `assemblyStatus` | `NotReady → Ready → Installed` |

**Lifecycle timestamps:** `reviewApprovedAt`, `releasedAt`, `procurementReadyAt`, `orderedAt`, `receivedAt`, `assemblyReadyAt`

**Dependency tracking:**
- `dependencyIds` — Components this one depends on
- `blockedByComponentIds` — Components currently blocking it
- `blockedByDependencies` — Boolean flag
- `blockerReason` — Description of what is blocking

**Delay tracking:**
- `isDelayed` — Boolean
- `delayedAt` — When the delay was detected
- `reminderSentAt`, `overdueNotifiedAt`, `escalatedAt` — Notification milestones

**Background worker:** `component-reminder.worker.ts` runs on schedule and:
1. Finds components approaching due date → sends `due_reminder` notification
2. Finds overdue components → sends `overdue` notification
3. Finds long-overdue components → sends `escalation` notification

---

### 5.8 Tasks

**What it does:** Work items assigned to individuals or departments. The primary mechanism for tracking who is doing what and whether it's on time.

**Status workflow:**
```
not_started → in_progress → waiting_for_input ↘
                          → under_review       → released → closed
                          → blocked           ↗
```

**Task types:** `design | review | approval | release | procurement_handover | follow_up`

**Fields:**
- `title`, `description`
- `projectId`, `machineId`, `moduleId`, `subassemblyId` — ISA-88 context
- `ownerId`, `departmentId`
- `status`, `priority`, `type`
- `dueDate`, `startDate`, `completedDate`
- `dependsOn` — Array of Task IDs this task is blocked by
- `dependsOnTaskId`, `dependencyBlocked` — Primary blocker
- `blockerReason`
- `attachments`

**Access rules:**
- `admin`, `project_manager`, `engineer`, `designer` — Create
- Any authenticated user — Update status (owner can self-update)
- `admin`, `project_manager` — Delete

---

### 5.9 Deliverables

**What it does:** Structured outputs expected from engineering — drawings, BOMs, specifications, documents. Sits alongside Tasks but tracks an output artifact rather than a work action.

**Fields:**
- `title`, `description`
- `projectId`, `machineId`, `moduleId`, `subassemblyId`
- `ownerId`, `departmentId`
- `status` (TaskStatus enum), `priority`
- `procurementStatus` — Whether this deliverable has been handed to procurement
- `dueDate`
- `isProcurementRelated`, `isLongLead`
- `attachments`

---

### 5.10 Procurement

**What it does:** Tracks every item that needs to be ordered — from design release through to receipt on the shop floor.

**ProcurementItem status workflow:**
```
not_applicable → pending_design_release → ready_for_procurement → 
ordered → partially_received → received

Special state: changed_after_release (ECO triggered after order)
```

**ProcurementItem fields:**
- `name`, `description`, `projectId`
- `deliverableId` — Links to the engineering deliverable that released this item
- `supplierId` — Links to supplier master
- `status`
- `isLongLead`, `estimatedLeadTimeDays`
- `orderDate`, `expectedDeliveryDate`
- `notes`

**Supplier fields:**
- `name`, `contactPerson`, `email`, `phone`, `address`
- `category` — Type of supplier (e.g. Motors, Controls, Fasteners)

**Access rules:**
- `admin`, `project_manager`, `procurement` — Create and edit items
- `admin`, `procurement` — Create and edit suppliers
- All authenticated users — Read

---

### 5.11 Documents, Decisions & Comments

**Project Documents:**
- File attachments on projects and tasks
- Fields: `title`, `description`, `projectId`, `taskId`, `moduleId`, `fileUrl`, `fileType`, `fileSize`, `uploadedBy`

**Decision Logs:**
- Formal record of decisions made in meetings or reviews
- Fields: `title`, `decision`, `rationale`, `projectId`, `madeBy`, `participants[]`, `tags[]`

**Comments:**
- Inline comments attached to tasks, deliverables, opportunities, or projects
- Fields: `content`, `authorId`, `taskId`, `deliverableId`, `opportunityId`, `projectId`
- **Note:** Comments are flat — no threading or replies.

---

### 5.12 Notifications

**What it does:** In-app notification system, delivered in real-time via WebSocket.

**Notification types:**
| Type | When fired |
|------|-----------|
| `assignment` | Task or component assigned to user |
| `due_reminder` | Task/component approaching due date |
| `overdue` | Task/component past due date |
| `blocker` | A dependency is blocked |
| `escalation` | Long-overdue item escalated to PM |
| `status_change` | Task/component status updated |
| `comment` | New comment on item user follows |
| `milestone_risk` | Project milestone at risk |

**Fields:** `userId`, `title`, `message`, `type`, `projectId`, `taskId`, `read`, `link`

**Transport:** Socket.IO gateway broadcasts to user-specific rooms on connect.

**Limitations:**
- In-app only — no email delivery
- No notification preferences (all types sent to all users)
- No notification templates

---

### 5.13 Dashboards

Six dashboard aggregations are available:

| Dashboard | Audience | Key data |
|-----------|---------|---------|
| Executive | Admin, Manager, Leadership, PM | Portfolio KPIs, health, at-risk projects, milestone burndown |
| Project | PM, Engineers | Stage, health, task rollup, milestone timeline, team workload |
| Department | Manager, Engineers | Task workload by owner, priority, overdue/blocked counts |
| Procurement | Procurement, PM, Manager | Items by status, long-lead risk, supplier delivery tracking |
| Machines | All | Machine tree, module status, component design progress |
| Project Components | PM, Engineers | Component lifecycle by stage/discipline, critical path |

---

### 5.14 Audit Log

Every mutation (create, update, delete) generates an `AuditLog` record.

**Fields:** `action`, `entityType`, `entityId`, `performedBy`, `projectId`, `previousValues`, `newValues`, `ipAddress`

**Access:** `admin`, `project_manager`, `manager`, `leadership`, `sales`, `engineer` can read logs.

**Limitation:** Read-only. No reversion capability. No field-level diff UI.

---

### 5.15 Settings

Key-value system configuration, accessible only by `admin`.

---

## 6. Security Summary

| Control | Implementation |
|---------|--------------|
| HTTP headers | `helmet` — XSS, clickjacking, CSP |
| Rate limiting | 120 req/min global; 5/min login; 3/min register |
| Auth | JWT validated on every protected route |
| RBAC | `@Roles()` + `RolesGuard` server-side on every endpoint |
| Input validation | `ValidationPipe` with `whitelist: true` + `forbidNonWhitelisted: true` |
| Password policy | Min 10, max 128, upper + lower + number |
| NoSQL injection | Enum fields whitelisted; all IDs validated with `Types.ObjectId.isValid()` |
| Error handling | `AllExceptionsFilter` — no stack traces to client |
| CORS | Explicit origin whitelist from `CORS_ORIGIN` env var |
| Password storage | bcrypt 12 rounds, `select: false` on schema |
| Soft-delete | `deletedAt` — no hard deletes, audit trail always preserved |
| Mass assignment | Strict DTOs on all PATCH endpoints |

**Known accepted risks:**
- JWT in `localStorage` (XSS risk) — httpOnly cookie migration is future work
- JWT expiry 8h — refresh token flow is future work
- No MFA / SSO

---

## 7. Frontend Route Map

All routes under `(app)/` require JWT authentication.

| Route | Purpose |
|-------|---------|
| `/dashboard` | Role-aware dashboard (executive / PM / engineer / procurement) |
| `/opportunities` | Opportunity list with status filters |
| `/opportunities/new` | 3-step tabbed intake form |
| `/opportunities/[id]` | Opportunity detail, feasibility review, convert to project |
| `/projects` | Project portfolio list |
| `/projects/new` | Create project (standalone or from opportunity) |
| `/projects/[id]` | Project detail: kickoff, milestones, team, machine tree |
| `/machines` | ISA-88 machine tree editor |
| `/tasks` | Task board (kanban/list), filters, assignment |
| `/procurement` | Procurement dashboard, items, suppliers |
| `/documents` | Document library, decision log |
| `/notifications` | Notification inbox |
| `/customers` | Customer CRM |
| `/admin/users` | User management (admin only) |
| `/admin/settings` | System settings (admin only) |

---

## 8. Environment Configuration

**Backend `.env`:**
```
MONGODB_URI=mongodb://localhost:27017/machineiq
JWT_SECRET=<min 32 chars, must not start with "change-this">
JWT_EXPIRATION=8h
PORT=4051
CORS_ORIGIN=http://localhost:4050
```

**Frontend `.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:4051/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:4051
```

---

## 9. Dev Credentials (Seeded)

All passwords: `password123`

| Email | Role |
|-------|------|
| admin@machineiq.com | admin |
| demo@machineiq.com | admin |
| sarah@machineiq.com | sales |
| james@machineiq.com | project_manager |
| anna@machineiq.com | engineer (Mechanical) |
| tom@machineiq.com | engineer (Electrical) |
| lisa@machineiq.com | procurement |
| david@machineiq.com | manager |

> These passwords do not meet production policy. Do not deploy without rotating credentials.

---

## 10. Dev Commands

```bash
./setup.sh        # Install dependencies + create .env files
./seed.sh         # Seed full demo data
./reset-db.sh     # Wipe DB + seed users only (clean slate)
./reset-db.sh --demo  # Wipe DB + seed full demo project
./dev.sh          # Start backend :4051 + frontend :4050
./logs.sh         # Watch live dev logs
./build.sh        # Production build
./stop.sh         # Stop all services
./clean.sh        # Remove node_modules and build artifacts
```
