# Workflows

End-to-end business processes that define how work flows through the MachineIQ platform.

---

## 1. Opportunity Intake → Review → Feasibility → Project Conversion

The complete lifecycle from customer inquiry to active project.

```
draft ──submit──▶ new ──assign reviewer──▶ under_review ──start──▶ feasibility_in_progress
                                                                                  │
                                                                                  ├──approve──▶ approved ──convert──▶ converted_to_project
                                                                                  │
                                                                                  └──reject───▶ rejected ──reopen────▶ under_review
```

### Step-by-Step

1. **Sales creates opportunity** — New requests start as `draft`; intake can be saved without entering the active pipeline.
2. **Sales submits draft** — The Intake tab calls `PATCH /api/opportunities/:id/status` with `new`.
3. **Manager/Admin assigns reviewer** — The Workflow Control panel saves `assignedReviewer` through `PATCH /api/opportunities/:id/review`.
4. **Manager/Admin sends to review** — The status moves from `new` to `under_review`; backend rejects this if no reviewer is assigned.
5. **Reviewer or Manager/Admin starts feasibility** — The status moves from `under_review` to `feasibility_in_progress`.
6. **Reviewer records feasibility** — Feasibility, complexity, and risk notes are saved through `PATCH /api/opportunities/:id/review`.
7. **Manager/Admin approves/rejects** — Approval requires feasibility, complexity, and risk notes. Rejection can be reopened by Manager/Admin.
8. **Manager/Admin converts approved opportunity** — `POST /api/opportunities/:id/convert` creates a linked Project and moves the opportunity to `converted_to_project`.

### Backend Rules

Allowed transitions are enforced in `backend/src/modules/opportunities/opportunities.service.ts`.

| From | To | Who |
|------|----|-----|
| `draft` | `new` | Sales, Manager, Admin |
| `new` | `under_review` | Manager, Admin |
| `new` | `draft` | Sales, Manager, Admin |
| `under_review` | `feasibility_in_progress` | Assigned reviewer, Manager, Admin |
| `feasibility_in_progress` | `approved` | Manager, Admin |
| `feasibility_in_progress` | `rejected` | Manager, Admin |
| `rejected` | `under_review` | Manager, Admin |
| `approved` | `converted_to_project` | Manager, Admin via project conversion |

The UI does not mutate statuses locally. It calls the backend and renders the returned opportunity.

### Audit Points

- Opportunity creation → AuditLog entry
- Every status change → AuditLog entry
- Reviewer assignment and feasibility notes → AuditLog entry
- Conversion to project → AuditLog entries for both opportunity and new project

---

## 1A. Quotation → Acceptance → Project and Invoice

Commercial quotation is deliberately separate from delivery and billing.

```
opportunity/customer ──▶ quote draft ──send──▶ sent
                                            │
                                            ├──accept──▶ accepted commercial baseline
                                            │                │
                                            │                ├──create project kickoff/planning
                                            │                └──create draft invoice
                                            │
                                            ├──decline──▶ declined
                                            └──expire───▶ expired
```

### Architectural Decision

An accepted quotation is the commercial baseline. It does not become a project or invoice by itself; it unlocks both actions.

- Many quotations can belong to one customer or machine inquiry.
- Rejected and expired quotations remain as commercial history.
- Only an accepted quotation can create a project or an invoice.
- Project and invoice records are separate because delivery and billing have different lifecycles.
- Project records keep `sourceQuoteId` and a `commercialSnapshot`.
- Invoice records keep `sourceQuoteId` and optionally `projectId`.

### Backend Rules

Allowed quote transitions are enforced in `backend/src/modules/quotes/quotes.service.ts`.

| From | To | Meaning |
|------|----|---------|
| `draft` | `sent` | Quote has been issued to the customer |
| `sent` | `accepted` | Customer accepted the commercial offer |
| `sent` | `declined` | Customer rejected the offer |
| `sent` | `expired` | Quote validity ended without acceptance |

Accepted quotes expose two downstream actions:

- `POST /api/quotes/:id/convert-to-project` creates a linked Project and updates the linked opportunity to `converted_to_project`.
- `POST /api/invoices/from-quote/:quoteId` creates a draft Invoice copied from the accepted quote totals, line items, customer snapshot, and organization snapshot.

The invoice starts as `draft` so finance can review it before sending.

---

## 2. Project Kickoff

Structured initialization of a new project before engineering begins.

```
┌──────────────┐     ┌──────────────────┐     ┌───────────────────┐     ┌──────────────┐
│  PM creates  │     │  PM sets up      │     │  Kickoff meeting  │     │  PM records  │
│  project     │────▶│  milestones &    │────▶│  with team        │────▶│  kickoff     │
│  (inquiry)   │     │  assigns team    │     │                   │     │  record      │
└──────────────┘     └──────────────────┘     └───────────────────┘     └──────┬───────┘
                                                                                │
                                                                                ▼
                                                                       ┌──────────────┐
                                                                       │  Create      │
                                                                       │  machine     │
                                                                       │  breakdown   │
                                                                       └──────┬───────┘
                                                                                │
                                                                                ▼
                                                                       ┌──────────────┐
                                                                       │  Stage →     │
                                                                       │  engineering │
                                                                       │  _in_progress│
                                                                       └──────────────┘
```

### Step-by-Step

1. **PM creates project** — Links to customer and (optionally) opportunity, sets initial stage to `inquiry` or `feasibility`
2. **PM defines milestones** — Design freeze, prototype complete, FAT, SAT, ship date
3. **PM assigns team** — Adds users to `teamMembers` array, sets `projectManager`
4. **Kickoff meeting** — PM holds meeting with team, vendors if needed
5. **PM records kickoff** — Captures date, attendees, notes, action items via POST `/api/projects/:id/kickoff`
6. **PM creates machine breakdown** — Defines Machine → Module → Subassembly hierarchy
7. **PM advances stage** — Moves project to `concept_approved` or `engineering_in_progress`

---

## 3. Engineering Execution

Day-to-day engineering work tracked through tasks and deliverables.

```
┌──────────────┐     ┌──────────────────┐     ┌───────────────────┐     ┌──────────────┐
│  PM creates  │     │  Engineer works  │     │  Engineer submits │     │  PM reviews  │
│  tasks &     │────▶│  on task         │────▶│  for review       │────▶│  & releases  │
│  assigns     │     │  (in_progress)   │     │  (under_review)   │     │  (released)  │
└──────────────┘     └──────────────────┘     └───────────────────┘     └──────────────┘
       │
       │ Notification
       ▼
 ┌──────────────┐
 │  Engineer    │
 │  notified    │
 │  via Socket  │
 └──────────────┘
```

### Task Lifecycle

```
not_started ──▶ in_progress ──▶ under_review ──▶ released ──▶ closed
                    │                │
                    ▼                ▼
              waiting_for_input   blocked
                    │                │
                    ▼                ▼
              in_progress      (resolve blocker)
                                    │
                                    ▼
                              in_progress
```

### Step-by-Step

1. **PM creates tasks** — Assigned to engineers, linked to subassemblies, with due dates and priorities
2. **Engineer receives notification** — Socket.IO pushes `task_assigned` notification
3. **Engineer starts work** — Updates status to `in_progress`, logs hours
4. **Engineer encounters issue** — Can set `waiting_for_input` or flag a Blocker
5. **Engineer completes work** — Moves to `under_review`
6. **PM/Lead reviews** — Evaluates work quality, checks against requirements
7. **PM releases** — Sets status to `released`, task is done
8. **PM closes** — Marks task as `closed` when fully verified

### Dependency Handling

- Tasks with `dependsOn` references can't start until upstream tasks reach `released` status
- The UI highlights blocked dependencies
- Blocking tasks show a cascade warning

---

## 4. Blocker Resolution

When work is stuck, blockers provide visibility and drive resolution.

```
┌──────────────┐     ┌──────────────────┐     ┌───────────────────┐     ┌──────────────┐
│  Engineer    │     │  Notification    │     │  Resolver         │     │  Resolver    │
│  raises      │────▶│  sent to         │────▶│  investigates     │────▶│  resolves    │
│  blocker     │     │  assignee & PM   │     │                   │     │  blocker     │
└──────────────┘     └──────────────────┘     └───────────────────┘     └──────┬───────┘
                                                                                │
                                                                                ▼
                                                                       ┌──────────────┐
                                                                       │  Task moves  │
                                                                       │  back to     │
                                                                       │  in_progress │
                                                                       └──────────────┘
```

### Step-by-Step

1. **Engineer flags blocker** — Creates blocker with description, severity, assigns to resolver
2. **Task status → blocked** — Visual indicator in all views
3. **Notifications sent** — `blocker_raised` notification to assigned resolver and PM
4. **Resolver investigates** — Works to unblock (may involve procurement, other teams, customer)
5. **Resolver closes blocker** — Sets status to `resolved`, adds resolution notes
6. **Task unblocked** — Engineer resumes work, status back to `in_progress`
7. **Escalation** — If blocker remains unresolved past threshold, auto-escalation notification to management

---

## 5. Procurement Pipeline

Moving from engineering decisions to purchased materials.

```
┌──────────────┐     ┌──────────────────┐     ┌───────────────────┐     ┌──────────────┐     ┌──────────────┐
│  Deliverable │     │  Procurement     │     │  Procurement      │     │  Supplier    │     │  Item        │
│  flagged for │────▶│  item created    │────▶│  sends RFQ        │────▶│  selected &  │────▶│  delivered   │
│  procurement │     │  (spec_ready)    │     │  (rfq_sent)       │     │  PO issued   │     │  (delivered) │
│              │     │                  │     │                   │     │  (po_issued) │     │              │
└──────────────┘     └──────────────────┘     └───────────────────┘     └──────────────┘     └──────────────┘
```

### Step-by-Step

1. **Engineer creates deliverable** — Sets `procurementStatus: 'spec_ready'` and optionally `isLongLead: true`
2. **Procurement team creates item** — Links to deliverable, specifies quantity, unit, estimated cost
3. **Procurement assigns supplier** — Selects from supplier database or creates new
4. **RFQ sent** — Status updated to `rfq_sent`, supplier quoted
5. **PO issued** — Purchase order placed, status → `po_issued`, `orderedDate` set
6. **Item delivered** — Status → `delivered`, `deliveredDate` set, `actualCost` recorded

### Long-Lead Item Handling

- Items marked `isLongLead: true` appear on procurement dashboard with urgency indicators
- These items may need ordering before engineering is complete
- Dashboard highlights long-lead items not yet at `po_issued` stage

### Procurement Dashboard Metrics

- Items by status (pipeline view)
- Budget: estimated vs actual
- Overdue items (past `requiredDate` but not delivered)
- Long-lead items at risk

---

## 6. Project Stage Progression

How projects move through their lifecycle stages.

```
inquiry
  │
  ▼
feasibility ──── (if rejected) ──── cancelled
  │
  ▼
concept_approved
  │
  ▼
engineering_in_progress
  │
  ▼
review_release
  │
  ▼
procurement_in_progress
  │
  ▼
build_assembly
  │
  ▼
fat_sat ──── (Factory Acceptance Test / Site Acceptance Test)
  │
  ▼
completed

Any stage can transition to:
  • on_hold (with reason)
  • cancelled (with reason)
```

### Stage Gate Criteria

| Stage                     | Entry Criteria                                  |
| ------------------------- | ----------------------------------------------- |
| `feasibility`             | Opportunity approved or direct project creation |
| `concept_approved`        | Feasibility review passed, customer agreement   |
| `engineering_in_progress` | Kickoff completed, machine breakdown defined    |
| `review_release`          | All design tasks completed or released          |
| `procurement_in_progress` | Engineering drawings released, specs finalized  |
| `build_assembly`          | Critical procurement items delivered            |
| `fat_sat`                 | Machine assembled, ready for testing            |
| `completed`               | FAT/SAT passed, customer acceptance             |

---

## 7. Notification & Escalation Flow

How the system keeps everyone informed and escalates when needed.

```
┌─────────────────────────────────────────────────────┐
│                EVENT OCCURS                          │
│  (task assigned, status change, blocker, deadline)   │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              NotificationsService.create()            │
│  Creates Notification document in MongoDB             │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│           NotificationsGateway.sendToUser()           │
│  Emits 'notification' event to user's Socket.IO room │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              CLIENT RECEIVES                         │
│  Bell icon count updates, notification appears        │
│  User can click to navigate to relevant entity        │
└─────────────────────────────────────────────────────┘
```

### Escalation Rules

- **Overdue tasks**: When a task passes its `dueDate` without reaching `released`/`closed`, an `escalation` notification is sent to the project manager
- **Unresolved blockers**: Blockers open beyond threshold trigger escalation to management
- **Approaching deadlines**: `deadline_approaching` notifications sent when due date is within configured window

---

## 8. Audit Trail Flow

Every state-changing action follows this pattern.

```
Controller receives request
       │
       ▼
  Validate DTO (class-validator)
       │
       ▼
  Service performs business logic
       │
       ├──▶ Mongoose save/update
       │
       ├──▶ AuditLogService.log({
       │      action: 'update',
       │      entityType: 'task',
       │      entityId: task._id,
       │      projectId: task.projectId,
       │      userId: currentUser._id,
       │      previousValues: { status: 'not_started' },
       │      newValues: { status: 'in_progress' }
       │    })
       │
       └──▶ Return response
```

### What Gets Audited

| Entity          | Actions Logged                                         |
| --------------- | ------------------------------------------------------ |
| Opportunity     | Create, status change, feasibility update, conversion  |
| Project         | Create, stage change, health change, milestone updates |
| Task            | Create, status change, assignment, blocker             |
| Deliverable     | Create, status change, procurement status change       |
| ProcurementItem | Create, status change, cost updates                    |
| User            | Create, role change, deactivation                      |
| Decision        | Create, status change                                  |

### Querying the Audit Log

- By entity: `GET /api/audit-log?entityType=task&entityId=...`
- By project: `GET /api/audit-log?projectId=...`
- By user: `GET /api/audit-log?userId=...`
- By date range: `GET /api/audit-log?startDate=...&endDate=...`

---

## 9. Machine Breakdown Workflow

How the hierarchical structure is built and managed.

```
  PM creates Machine
       │
       ▼
  PM/Engineer adds Modules
       │
       ▼
  Engineer adds Subassemblies
       │
       ▼
  Engineer creates Tasks under Subassemblies
       │
       ▼
  Tasks generate Deliverables
       │
       ▼
  Deliverables feed Procurement Items
```

### Tree View Interaction

1. **Project page** → Click "Machine Breakdown"
2. **Tree loads** via `GET /api/machines/breakdown/:projectId`
3. **Expand/collapse** — Click machine → shows modules → shows subassemblies → shows tasks
4. **Status rollup** — Parent nodes show aggregate status (worst-case child)
5. **Add nodes** — "+" buttons at each level to add children
6. **Mobile** — Nested card stack with tap-to-expand

---

## 10. Dashboard Data Flow

How dashboards aggregate data from across the system.

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Projects   │  │   Tasks     │  │ Procurement │  │  Blockers   │
│  Collection │  │  Collection │  │  Collection │  │  Collection │
└──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
       │                │                │                │
       └────────────────┴────────────────┴────────────────┘
                                │
                    MongoDB Aggregation Pipelines
                    ($match, $group, $lookup, $project)
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Dashboard Service   │
                    │   Returns computed    │
                    │   metrics             │
                    └───────────┬───────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
              ┌─────┴─────┐          ┌──────┴──────┐
              │ Executive │          │  Project /  │
              │ Dashboard │          │ Department  │
              │           │          │ Procurement │
              └───────────┘          └─────────────┘
```

Dashboards compute on-demand — no pre-computed materialized views. For production workloads with many projects, consider adding caching or materialized views.
