# Features

Detailed breakdown of every module and feature in the MachineIQ platform.

---

## 1. Opportunity / Machine Request Intake

The entry point for all new business. Sales teams capture customer requests and machine specifications before any engineering work begins.

### Capabilities

- **Create opportunity** with customer info, machine type, specifications, and estimated budget
- **Attach files** — RFQs, drawings, customer correspondence
- **Priority assignment** — Critical, High, Medium, Low
- **Status tracking** — `new` → `under_review` → `feasibility_in_progress` → `approved` / `rejected` → `converted_to_project`
- **Auto-assignment** — Route to feasibility reviewers based on department
- **Customer linking** — Associate opportunities with existing customer records
- **Audit trail** — Every status change logged

### Who Uses It

| Role                 | Access                                     |
| -------------------- | ------------------------------------------ |
| Sales                | Create, edit, view all opportunities       |
| Project Manager      | Review, approve/reject, convert to project |
| Manager / Leadership | View and filter                            |
| Admin                | Full access                                |

---

## 2. Feasibility Review

A structured evaluation of whether an opportunity is technically and commercially viable before committing engineering resources.

### Capabilities

- **Review checklist** — Technical capability, timeline viability, resource availability, commercial margin
- **Feasibility notes** — Free-form technical assessment per department
- **Decision capture** — Approved / Rejected with rationale stored in Decision Log
- **Multi-department input** — Mechanical, Electrical, Controls teams can each contribute
- **Risk flagging** — Identify risks early before project commitment
- **Conversion trigger** — Approved opportunities can be converted to projects with one action

### Workflow

```
Opportunity (new)
  → Sales submits for review
  → PM assigns feasibility reviewers
  → Departments provide input
  → PM marks approved/rejected
  → If approved → Convert to Project
```

---

## 3. Kickoff Workspace

A structured space where the project manager prepares all the information needed before engineering begins.

### Capabilities

- **Kickoff record** — Date, attendees (user references), notes, action items
- **Requirement capture** — Carry forward opportunity requirements into project scope
- **Team assignment** — Assign engineers to departments/roles for this project
- **Initial milestone creation** — Set key dates before work begins
- **Machine breakdown initialization** — Create the top-level machine structure
- **Document attachment** — Link kickoff meeting minutes, preliminary drawings

### Output

A fully initialized project with:

- Defined scope and requirements
- Assigned team members
- Milestone timeline
- Initial machine breakdown structure

---

## 4. Project & Stage Management

Central hub for tracking project lifecycle from inquiry through completion.

### Capabilities

- **Project stages** — `inquiry` → `feasibility` → `concept_approved` → `engineering_in_progress` → `review_release` → `procurement_in_progress` → `build_assembly` → `fat_sat` → `completed`
- **Special states** — `on_hold`, `cancelled` (with reason tracking)
- **Milestone tracking** — Named milestones with target dates and completion status
- **Health indicators** — `on_track`, `at_risk`, `delayed`, `critical` — auto-calculated from task/milestone status
- **Budget tracking** — Estimated vs actual budget at project level
- **Progress percentage** — Computed from task completion ratios
- **Filtering** — By stage, health, department, customer, date range
- **Opportunity linking** — Every project traces back to its originating opportunity

### Dashboard Integration

Projects feed data to:

- Executive Dashboard (portfolio health overview)
- Project Dashboard (single-project deep dive)
- Department Dashboard (department workload across projects)

---

## 5. Machine Breakdown Structure

Hierarchical decomposition of what needs to be built. This is the engineering backbone of the system.

### Hierarchy

```
Project
  └── Machine (e.g., "Assembly Line Unit A")
        └── Module (e.g., "Conveyor System")
              └── Subassembly (e.g., "Drive Unit")
                    └── Task / Deliverable (e.g., "Design drive shaft")
```

### Capabilities

- **Tree view** — Expandable/collapsible hierarchy in the UI
- **CRUD at every level** — Create, edit, delete machines, modules, subassemblies
- **Status rollup** — Parent status reflects worst-case child status
- **Department ownership** — Each module/subassembly can be owned by a department
- **Task attachment** — Tasks and deliverables live under subassemblies
- **Search & filter** — Find any node in the tree by name, status, or owner
- **Breakdown export** — Full structure visible for project reporting

### Mobile Experience

On mobile, the tree renders as nested cards with tap-to-expand interaction, optimized for touch navigation.

---

## 5A. Component-Level Engineering Lifecycle

Components are a first-class execution object under the machine breakdown. This layer is distinct from generic tasks and is used to track machine component readiness from engineering through procurement and assembly.

### Component Model

- **Per-machine component tracking** — a machine can contain many independently tracked components
- **Engineer owner** — every component is assigned to a specific engineer
- **Reviewer gate** — components in review require an assigned reviewer
- **Due date management** — due-soon, overdue, and escalated states are tracked
- **Dependencies** — upstream component delays can block downstream work
- **Deliverable linkage** — drawings, specs, BOMs, and related outputs attach directly to a component

### Lifecycle

`design` → `review` → `release` → `procurement_ready` → `ordered` → `received` → `assembly_ready`

### Workflow Rules

- Procurement does not see components until **Release**
- Procurement action starts at **Procurement Ready**
- Ordering and receipt are explicit lifecycle states
- **Assembly Ready** depends on **Received**
- Delayed dependencies automatically mark downstream components as blocked
- Blocked and delayed components surface in dashboards as execution blockers

### Reminder System

- Reminder before due date
- Overdue alert once past due
- Escalation to project manager after threshold

### Dashboard Metrics

- Number of components per machine
- Completed vs pending components
- Delayed components
- Components blocking procurement
- Components blocking assembly

---

## 6. Task & Deliverable Management

Where the actual engineering work happens. Every piece of work is tracked as either a task (action) or deliverable (output).

### Task Features

- **Types** — `design`, `review`, `approval`, `manufacturing`, `testing`, `documentation`, `other`
- **Statuses** — `not_started` → `in_progress` → `waiting_for_input` → `under_review` → `blocked` → `released` → `closed`
- **Priority levels** — Critical, High, Medium, Low
- **Assignment** — Assign to specific users with department context
- **Due dates** — With overdue detection and visual indicators
- **Estimated vs actual hours** — Track effort accuracy over time
- **Dependency tracking** — `dependsOn` references to other tasks
- **Blocker flagging** — Mark tasks as blocked with reason and responsible party

### Deliverable Features

- **Procurement linkage** — Deliverables can have procurement status (`not_needed`, `spec_ready`, `rfq_sent`, `po_issued`, `delivered`)
- **Long-lead flagging** — `isLongLead` boolean for items requiring early procurement action
- **Approval workflow** — Deliverables go through review/approval status gates

### View Modes

| View               | When                                                             |
| ------------------ | ---------------------------------------------------------------- |
| **List view**      | Quick scanning and filtering — table on desktop, cards on mobile |
| **Kanban board**   | Drag-and-drop workflow — columns by status                       |
| **Filtered views** | By project, department, assignee, status, priority, overdue      |

### Notifications

- Assignment notifications sent via Socket.IO when a task is assigned
- Status change notifications sent to assignee and project manager
- Overdue alerts when due date passes with incomplete status

---

## 7. Dependency & Blocker Tracking

Visibility into what's waiting on what, and what's stuck.

### Dependencies

- **Task-to-task** dependencies with type classification (`finish_to_start`, `start_to_start`, `finish_to_finish`)
- **Cross-department** dependency tracking — e.g., Electrical waiting on Mechanical design freeze
- **Visual indicators** — Dependent tasks show upstream blockers
- **Cascade detection** — When a dependency is delayed, downstream tasks are flagged

### Blockers

- **Blocker creation** — Any team member can flag a blocker on a task
- **Fields** — Description, raised by, assigned to, severity, resolution date
- **Escalation** — Unresolved blockers auto-escalate after configurable time
- **Resolution tracking** — Closed blockers capture resolution notes

---

## 8. Procurement Readiness & Handover

Bridge between engineering decisions and purchasing execution.

### Procurement Items

- **Status pipeline** — `not_needed` → `spec_ready` → `rfq_sent` → `po_issued` → `delivered`
- **Long-lead identification** — Flag items that need early ordering
- **Supplier linking** — Associate items with approved suppliers
- **Budget tracking** — Estimated vs actual cost per item
- **Quantity and unit** — Track what's needed and in what measure
- **Due date tracking** — When items must arrive to stay on schedule

### Supplier Management

- **Supplier database** — Name, contact person, email, phone, address, category
- **Item-supplier linking** — Which suppliers provide which items
- **Performance notes** — Track supplier reliability

### Dashboard

- **Procurement dashboard metrics** — Items by status, overdue items, budget utilization
- **Department view** — What each department needs procured
- **Risk view** — Long-lead items not yet ordered

---

## 9. Notifications, Reminders & Escalation

Real-time awareness across the platform.

### Notification Types

| Type                   | Trigger                                      |
| ---------------------- | -------------------------------------------- |
| `task_assigned`        | Task assigned to a user                      |
| `status_change`        | Task/deliverable/project status updated      |
| `comment_added`        | New comment on a task or document            |
| `blocker_raised`       | Blocker created on a task                    |
| `deadline_approaching` | Due date within configured threshold         |
| `escalation`           | Unresolved blocker or overdue task escalated |
| `approval_required`    | Deliverable ready for review                 |

### Delivery Channels

- **In-app** — Notification bell with unread count, full notification list page
- **Real-time push** — Socket.IO delivers instant updates without page refresh
- **Mark as read** — Individual and bulk mark-as-read

### Real-Time Behavior

- On login, the client connects to Socket.IO and joins a user-specific room
- New notifications appear instantly in the topbar bell icon
- Unread count updates in real-time

---

## 10. Dashboards & Reporting

Four specialized dashboards provide visibility at every level of the organization.

### Executive Dashboard

- **Portfolio overview** — Total projects, active/on-hold/completed counts
- **Health breakdown** — Projects by health status (on_track, at_risk, delayed, critical)
- **Bottleneck detection** — Top blocked/overdue items across all projects
- **Budget summary** — Total estimated vs actual spend
- **KPI cards** — Key metrics with trend indicators

### Project Dashboard

- **Single-project deep dive** — Stage progress, milestone timeline, task completion
- **Team workload** — Tasks per assignee with status breakdown
- **Risk register** — Open risks and blockers for this project
- **Timeline view** — Milestones against target dates

### Department Dashboard

- **Department workload** — Tasks assigned to department members across all projects
- **Capacity view** — Who's overloaded, who has bandwidth
- **Cross-project visibility** — See all work items for one department

### Procurement Dashboard

- **Pipeline view** — Items flowing through procurement statuses
- **Budget tracking** — Spend by project, by supplier, by category
- **Long-lead alert** — Items flagged as long-lead that haven't been ordered
- **Supplier performance** — Delivery status by supplier

---

## 11. Documents & Decision Log

Centralized document management and decision tracking.

### Documents

- **Upload & categorize** — Attach documents to projects with title, type, version
- **Version tracking** — Version string on each document
- **Type classification** — Drawing, specification, report, minutes, contract, other
- **Project scoping** — Documents are always associated with a project
- **Uploaded-by tracking** — Who uploaded, when

### Decision Log

- **Structured decisions** — Title, description, decided by, date, impact assessment
- **Status tracking** — `proposed` → `approved` → `rejected` → `superseded`
- **Project context** — Decisions linked to specific projects
- **Searchable history** — Full-text search across decision titles and descriptions

### Comments

- **Threaded comments** — Add comments to any entity (task, document, decision)
- **User attribution** — Who said what, when
- **Entity linking** — Comments reference their parent entity type and ID

---

## 12. Admin / Role Permissions

System administration and access control.

### User Management

- **CRUD users** — Create, edit, deactivate (soft-delete) user accounts
- **Role assignment** — Sales, Project Manager, Engineer, Procurement, Manager, Admin
- **Department assignment** — Link users to their department
- **Profile fields** — Name, email, phone, avatar URL

### Role Capabilities

| Role            | Create                      | Read                         | Update                       | Delete            | Admin                  |
| --------------- | --------------------------- | ---------------------------- | ---------------------------- | ----------------- | ---------------------- |
| Sales           | Opportunities               | Own opportunities, projects  | Own opportunities            | —                 | —                      |
| Project Manager | Projects, tasks, milestones | All project data             | Projects, tasks, assignments | Soft-delete tasks | —                      |
| Engineer        | Tasks (own), blockers       | Assigned tasks, project data | Own tasks, add files         | —                 | —                      |
| Procurement     | Procurement items           | All procurement data         | Procurement statuses         | —                 | —                      |
| Manager         | —                           | All dashboards, reports      | —                            | —                 | —                      |
| Admin           | Everything                  | Everything                   | Everything                   | Everything        | Users, roles, settings |

### Security Enforcement

- Role checks happen server-side via `RolesGuard` on every protected endpoint
- JWT tokens carry the role — no client-side role spoofing possible
- Failed authorization returns 403 Forbidden
- All admin actions logged to AuditLog

---

## Cross-Cutting Features

### Audit Trail

Every state-changing action across the platform creates an `AuditLog` entry with:

- Who performed the action (`userId`)
- What entity was affected (`entityType`, `entityId`)
- What changed (`previousValues`, `newValues`)
- When it happened (`createdAt`)
- Which project it relates to (`projectId`)

### Soft Delete

No data is ever physically deleted. All delete operations set `deletedAt` to the current timestamp. Data can be restored by clearing this field.

### Mobile-First Design

Every interface is designed for mobile screens first, then enhanced for desktop:

- **Mobile**: Card-based layouts, touch-friendly buttons, hamburger menu
- **Desktop**: Table views, sidebar navigation, multi-column layouts
- **Breakpoint**: `lg:` (1024px) is the primary desktop breakpoint

### Search & Filtering

Every list view supports:

- Text search (name, title, description)
- Status filter (multi-select)
- Department filter
- Date range filter
- Owner/assignee filter
