# Architecture

System architecture, technology decisions, and module boundaries for the MachineIQ platform.

---

## High-Level Overview

```
┌──────────────────────────────────────────────────┐
│                  CLIENTS                         │
│  ┌──────────────┐  ┌──────────────┐              │
│  │  Web Browser  │  │   Mobile     │              │
│  │  (Desktop)    │  │   Browser    │              │
│  └──────┬───────┘  └──────┬───────┘              │
└─────────┼─────────────────┼──────────────────────┘
          │  HTTPS / WSS    │
          ▼                 ▼
┌──────────────────────────────────────────────────┐
│              FRONTEND (Next.js 14)               │
│  App Router · Tailwind CSS · Socket.IO Client    │
│  Port 4050                                       │
└──────────────────┬───────────────────────────────┘
                   │  REST API / WebSocket
                   ▼
┌──────────────────────────────────────────────────┐
│              BACKEND (NestJS 10)                 │
│  Modular Services · JWT Auth · RBAC Guards       │
│  Socket.IO Gateway · Mongoose ODM                │
│  Port 4051                                       │
└──────────────────┬───────────────────────────────┘
                   │  Mongoose Driver
                   ▼
┌──────────────────────────────────────────────────┐
│              DATABASE (MongoDB)                  │
│  Collections · Indexes · Soft Deletes            │
│  Port 27017                                      │
└──────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer          | Technology                          | Why                                                                                   |
| -------------- | ----------------------------------- | ------------------------------------------------------------------------------------- |
| **Frontend**   | Next.js 14 (App Router)             | Server-side rendering, file-based routing, React Server Components                    |
| **Styling**    | Tailwind CSS 3.4                    | Utility-first, mobile-first responsive design, design-token approach                  |
| **Backend**    | NestJS 10                           | Modular architecture, dependency injection, decorators for guards/pipes               |
| **Database**   | MongoDB 7 + Mongoose 8              | Flexible document model for hierarchical data (Machine → Module → Subassembly → Task) |
| **Real-time**  | Socket.IO                           | Bi-directional events for notifications, presence, live updates                       |
| **Auth**       | Passport JWT + bcrypt               | Stateless authentication, role-based access control                                   |
| **Validation** | class-validator / class-transformer | DTO-level input validation at API boundaries                                          |

---

## Backend Module Architecture

NestJS modules follow a strict boundary pattern:

```
backend/src/
├── main.ts                    # Bootstrap, CORS, validation pipe, Socket.IO adapter
├── app.module.ts              # Root module — imports all domain modules
├── common/
│   └── enums.ts               # Shared enumerations (Role, TaskStatus, etc.)
├── decorators/
│   ├── roles.decorator.ts     # @Roles() metadata decorator
│   └── current-user.decorator.ts  # @CurrentUser() param decorator
├── guards/
│   └── roles.guard.ts         # CanActivate guard — checks JWT role vs @Roles()
├── schemas/                   # Mongoose schema definitions (one file per domain)
│   ├── user.schema.ts
│   ├── department.schema.ts
│   ├── customer.schema.ts
│   ├── opportunity.schema.ts
│   ├── project.schema.ts
│   ├── machine.schema.ts       # Machine + Module + Subassembly
│   ├── component.schema.ts     # Component lifecycle and blockers
│   ├── task.schema.ts
│   ├── deliverable.schema.ts
│   ├── procurement.schema.ts   # ProcurementItem + Supplier
│   ├── dependency.schema.ts    # Dependency + Blocker
│   ├── document.schema.ts      # ProjectDocument + DecisionLog + Comment
│   ├── notification.schema.ts  # Notification + Risk
│   └── audit-log.schema.ts
├── modules/
│   ├── auth/                  # JWT login · register · strategy
│   ├── users/                 # User CRUD · soft-delete
│   ├── departments/           # Department CRUD
│   ├── customers/             # Customer CRUD
│   ├── opportunities/         # Intake · feasibility · conversion
│   ├── projects/              # Project lifecycle · milestones · kickoff
│   ├── machines/              # Machine breakdown structure (tree)
│   ├── components/            # Component lifecycle · reminders · blockers
│   ├── tasks/                 # Task CRUD · Kanban · overdue/blocked
│   ├── deliverables/          # Deliverables · procurement status
│   ├── procurement/           # ProcurementItem + Supplier CRUD
│   ├── documents/             # Documents · decision log · comments
│   ├── notifications/         # Notification CRUD + Socket.IO gateway
│   ├── audit-log/             # Immutable audit trail
│   └── dashboard/             # Aggregation-based analytics
└── seeds/
    └── run-seed.ts            # Database seeding script
```

### Module Boundary Rules

1. Each module owns its **service**, **controller**, and any DTOs
2. Cross-module communication goes through injected services (NestJS DI)
3. Schemas are shared via `MongooseModule.forFeature()` imports
4. No circular dependencies — notifications module is imported by modules that need to emit events
5. All mutations log to `AuditLog` via `AuditLogService`

---

## Frontend Architecture

```
frontend/src/
├── app/
│   ├── layout.tsx              # Root layout — fonts, viewport, AuthProvider
│   ├── page.tsx                # Entry redirect → /dashboard or /login
│   ├── globals.css             # Tailwind layers + component classes
│   ├── login/
│   │   └── page.tsx            # Authentication form
│   └── (app)/
│       ├── layout.tsx          # Protected layout — AppShell wrapper
│       ├── dashboard/page.tsx
│       ├── opportunities/page.tsx
│       ├── projects/page.tsx
│       ├── tasks/page.tsx
│       ├── machines/page.tsx
│       ├── procurement/page.tsx
│       ├── documents/page.tsx
│       ├── notifications/page.tsx
│       └── admin/
│           ├── users/page.tsx
│           └── settings/page.tsx
├── components/
│   ├── AppShell.tsx            # Sidebar + topbar + mobile drawer
│   ├── StatusBadge.tsx         # Semantic status pills
│   ├── MetricCard.tsx          # KPI display card
│   ├── EmptyState.tsx          # Zero-data illustration
│   ├── LoadingSpinner.tsx      # Loading indicator
│   └── PageHeader.tsx          # Page title + action buttons
├── lib/
│   ├── api.ts                  # HTTP client with JWT management
│   ├── socket.ts               # Socket.IO singleton
│   └── utils.ts                # Status colors, formatters, helpers
└── providers/
    └── auth-provider.tsx       # AuthContext — login/logout/token state
```

### Frontend Patterns

- **Route groups**: `(app)/` groups all authenticated pages under a shared layout with sidebar
- **Mobile-first**: Cards on small screens, tables on `lg:` breakpoint
- **View toggles**: Tasks page supports both list and Kanban board views
- **Hierarchical tree**: Machines page renders expandable Machine → Module → Subassembly → Task tree
- **Component workflow layer**: component lifecycle adds review, release, procurement, and assembly gating on top of the raw breakdown tree

---

## Authentication & Authorization Flow

```
  Client                    Backend
    │                         │
    ├── POST /api/auth/login ─┤
    │   {email, password}     │
    │                         ├── Validate credentials (bcrypt.compare)
    │                         ├── Generate JWT {sub, email, role}
    │   ◄── {token, user} ───┤
    │                         │
    ├── GET /api/tasks ───────┤  (Authorization: Bearer <token>)
    │                         ├── JwtStrategy validates token
    │                         ├── RolesGuard checks @Roles() metadata
    │   ◄── 200 / 403 ───────┤
```

- **JWT payload**: `{ sub: userId, email, role }`
- **Token storage**: `localStorage` on frontend (auto-attached by ApiClient)
- **401 handling**: ApiClient auto-redirects to `/login` and clears token
- **Role check**: Server-side only — `@Roles(Role.Admin, Role.ProjectManager)` on controller methods

---

## Real-Time Architecture

```
  Client (Browser)           Backend (NestJS)
    │                            │
    ├── socket.connect() ────────┤  /notifications namespace
    │                            │
    ├── emit('join', userId) ────┤  → joins room `user:{userId}`
    │                            │
    │                            ├── (Task assigned to user)
    │                            ├── NotificationsGateway.sendToUser()
    │   ◄── 'notification' ─────┤  → emits to room `user:{userId}`
    │                            │
    │   (User reads notification)│
    ├── PATCH /notifications/:id ┤  → marks as read
```

- The `NotificationsGateway` uses rooms keyed by `user:{userId}`
- Services inject `NotificationsService` to create notifications and push via Socket.IO
- Frontend `socket.ts` provides a singleton connection

---

## Data Flow Patterns

### State-Changing Mutations

Every write operation follows this flow:

```
Controller → Validate DTO → Service method → Mongoose save
                                           → AuditLogService.log()
                                           → NotificationsService.create() (if applicable)
                                           → Socket.IO emit (if applicable)
```

### Soft Deletes

All entities use a `deletedAt` timestamp rather than physical deletion:

- Queries filter by `{ deletedAt: null }` by default
- Delete endpoints set `deletedAt: new Date()`
- Data can be restored by setting `deletedAt: null`

### Dashboard Aggregations

Dashboard endpoints use MongoDB aggregation pipelines to compute metrics without loading full documents:

- `$match` → filter by project/department/date
- `$group` → count by status, sum budgets
- `$lookup` → join related collections
- Results are computed on-demand (no materialized views)

---

## Security Layers

| Layer                | Mechanism                                                             |
| -------------------- | --------------------------------------------------------------------- |
| **Transport**        | HTTPS (production)                                                    |
| **Authentication**   | JWT tokens (Passport strategy)                                        |
| **Authorization**    | `@Roles()` decorator + `RolesGuard` on every endpoint                 |
| **Input validation** | `class-validator` DTOs with `whitelist: true` (strips unknown fields) |
| **CORS**             | Restricted to `CORS_ORIGIN` env variable                              |
| **Password storage** | bcrypt with salt rounds                                               |
| **Audit trail**      | Every mutation logged to `AuditLog` collection                        |
| **Soft delete**      | No data destruction — `deletedAt` field                               |

---

## Deployment Considerations

- **Backend**: Stateless NestJS app — can be horizontally scaled behind a load balancer
- **Frontend**: Static export or Node.js server via `next build && next start`
- **Database**: MongoDB replica set recommended for production (enables transactions)
- **Socket.IO**: For multi-instance, add Redis adapter (`@socket.io/redis-adapter`)
- **Environment**: All secrets via environment variables — no hardcoded credentials
