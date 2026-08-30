# API Reference

Complete REST API documentation for the MachineIQ backend. All endpoints are prefixed with `/api`.

**Base URL:** `http://localhost:3001/api`

**Authentication:** Most endpoints require a JWT token in the `Authorization: Bearer <token>` header.

---

## Auth

### POST /auth/register

Create a new user account.

**Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "engineer",
  "departmentId": "64f..."
}
```

**Response:** `201 Created`

```json
{
  "token": "eyJhbG...",
  "user": { "_id": "...", "email": "...", "firstName": "...", "role": "..." }
}
```

### POST /auth/login

Authenticate and receive JWT token.

**Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:** `200 OK`

```json
{
  "token": "eyJhbG...",
  "user": { "_id": "...", "email": "...", "firstName": "...", "role": "..." }
}
```

---

## Users

All endpoints require `Admin` role unless noted.

### GET /users

List all active users. Returns users where `deletedAt` is null.

### GET /users/:id

Get a single user by ID.

### PATCH /users/:id

Update user fields (name, email, role, department, phone, avatar).

### DELETE /users/:id

Soft-delete a user (sets `deletedAt`).

---

## Departments

### GET /departments

List all departments.

**Auth:** Any authenticated user.

### GET /departments/:id

Get a single department.

### POST /departments

Create a department. **Auth:** Admin only.

**Body:**

```json
{
  "name": "Mechanical Engineering",
  "code": "MECH",
  "description": "Mechanical design and manufacturing"
}
```

### PATCH /departments/:id

Update a department. **Auth:** Admin only.

### DELETE /departments/:id

Soft-delete a department. **Auth:** Admin only.

---

## Customers

### GET /customers

List all customers.

### GET /customers/:id

Get a single customer.

### POST /customers

Create a customer. **Auth:** Sales, Project Manager, Admin.

**Body:**

```json
{
  "name": "Acme Manufacturing",
  "contactPerson": "Jane Smith",
  "email": "jane@acme.com",
  "phone": "+1-555-0100",
  "address": "123 Industrial Ave",
  "industry": "Automotive"
}
```

### PATCH /customers/:id

Update a customer.

### DELETE /customers/:id

Soft-delete a customer.

---

## Opportunities

### GET /opportunities

List all opportunities. Supports query filters:

- `?status=new` — Filter by status
- `?customerId=64f...` — Filter by customer
- `?priority=high` — Filter by priority

### GET /opportunities/:id

Get a single opportunity with full details.

### POST /opportunities

Create a new opportunity. **Auth:** Sales, Admin.

**Body:**

```json
{
  "title": "Assembly Line for Acme",
  "customerId": "64f...",
  "description": "New automotive assembly line",
  "machineType": "Assembly Line",
  "estimatedBudget": 500000,
  "priority": "high",
  "requirements": ["24/7 operation", "ISO certified"],
  "specifications": { "speed": "100 units/hr", "voltage": "480V" }
}
```

### PATCH /opportunities/:id

Update an opportunity (status changes create audit log entries).

### POST /opportunities/:id/convert

Convert an approved opportunity to a project. **Auth:** Project Manager, Admin.

**Response:** Returns the newly created project.

---

## Projects

### GET /projects

List all projects. Supports query filters:

- `?stage=engineering_in_progress`
- `?health=at_risk`
- `?customerId=64f...`

### GET /projects/:id

Get a single project with milestones and kickoff record.

### POST /projects

Create a new project. **Auth:** Project Manager, Admin.

**Body:**

```json
{
  "name": "Acme Assembly Line",
  "customerId": "64f...",
  "opportunityId": "64f...",
  "stage": "inquiry",
  "estimatedBudget": 500000,
  "targetStartDate": "2024-03-01T00:00:00Z",
  "targetEndDate": "2024-09-01T00:00:00Z",
  "description": "Full assembly line project"
}
```

### PATCH /projects/:id

Update project fields (stage, health, budget, dates).

### POST /projects/:id/milestones

Add a milestone to a project.

**Body:**

```json
{
  "name": "Design Freeze",
  "targetDate": "2024-04-15T00:00:00Z",
  "description": "All designs finalized"
}
```

### PATCH /projects/:id/milestones/:milestoneId

Update a milestone (mark complete, change date).

### POST /projects/:id/kickoff

Create/update kickoff record.

**Body:**

```json
{
  "date": "2024-03-05T00:00:00Z",
  "attendees": ["64f...", "64f..."],
  "notes": "Kickoff meeting notes...",
  "actionItems": ["Define machine breakdown", "Assign team leads"]
}
```

---

## Machines

### GET /machines?projectId=64f...

List machines for a project.

### GET /machines/:id

Get a single machine.

### GET /machines/breakdown/:projectId

Get the full breakdown tree for a project (Machine → Module → Subassembly with tasks).

### POST /machines

Create a machine. **Auth:** Project Manager, Engineer, Admin.

**Body:**

```json
{
  "name": "Assembly Unit A",
  "projectId": "64f...",
  "description": "Primary assembly unit"
}
```

### PATCH /machines/:id

Update a machine.

### DELETE /machines/:id

Soft-delete a machine.

### POST /machines/modules

Create a module under a machine.

### PATCH /machines/modules/:id

Update a module.

### DELETE /machines/modules/:id

Soft-delete a module.

### POST /machines/subassemblies

Create a subassembly under a module.

### PATCH /machines/subassemblies/:id

Update a subassembly.

### DELETE /machines/subassemblies/:id

Soft-delete a subassembly.

---

## Quotes

Commercial offers sent to customers.

### POST /quotes

Create a draft quote. **Auth:** Sales, Admin.

### PATCH /quotes/:id/status

Move a quote through the commercial lifecycle.

Allowed transitions:

- `draft` → `sent`
- `sent` → `accepted`
- `sent` → `declined`
- `sent` → `expired`

When status becomes `accepted`, the backend stores acceptance metadata such as `acceptedAt`, `acceptedBy`, and optional `customerPoNumber`.

### POST /quotes/:id/convert-to-project

Create a project from an accepted quote. The project receives `sourceQuoteId` and `commercialSnapshot`; the linked opportunity is moved to `converted_to_project`.

---

## Invoices

Billing records created from accepted quotes.

### POST /invoices/from-quote/:quoteId

Create a draft invoice from an accepted quote. The invoice copies quote totals, line items, customer snapshot, and organization snapshot. The invoice remains separate from the project lifecycle.

### GET /invoices

List invoices. Supports `customerId`, `sourceQuoteId`, `projectId`, `status`, `limit`, and `skip`.

### GET /invoices/:id

Get a single invoice.

### PATCH /invoices/:id/status

Move invoice status through `draft`, `sent`, `unpaid`, `partially_paid`, `paid`, `overdue`, or `void`.

### POST /invoices/:id/payments

Record a payment against an open invoice.

---

## Components

Dedicated component-lifecycle API for engineering, review, procurement gating, and assembly readiness.

### GET /components

List components. Supports filters:

- `?projectId=64f...`
- `?machineId=64f...`
- `?ownerId=64f...`
- `?lifecycleStage=review`
- `?blocked=true`

### GET /components/:id

Get a single component with owner, reviewer, dependencies, and deliverables populated.

### POST /components

Create a component. **Auth:** Project Manager, Engineer, Designer, Admin.

**Body:**

```json
{
  "name": "Main Conveyor Frame",
  "projectId": "64f...",
  "machineId": "64f...",
  "moduleId": "64f...",
  "subassemblyId": "64f...",
  "ownerId": "64f...",
  "reviewerId": "64f...",
  "dueDate": "2026-05-01T00:00:00Z",
  "lifecycleStage": "design",
  "dependencyIds": ["64f..."],
  "deliverableIds": ["64f..."]
}
```

### PATCH /components/:id

Update a component. Lifecycle rules enforce:

- `review` requires `reviewerId`
- `release` requires approved review
- `procurement_ready` requires prior `release`
- `received` requires prior `ordered`
- `assembly_ready` requires prior `received`

### POST /components/:id/approve-review

Approve review for a component currently in `review`.

### POST /components/projects/:projectId/sync

Recompute blocked states from dependencies for all components in a project.

### POST /components/projects/:projectId/process-reminders

Process due-soon reminders, overdue alerts, and escalations for project components.

---

## Tasks

### GET /tasks

List tasks. Supports filters:

- `?projectId=64f...`
- `?assigneeId=64f...`
- `?status=in_progress`
- `?priority=critical`
- `?departmentId=64f...`

### GET /tasks/:id

Get a single task with populated references.

### GET /tasks/overdue

Get all overdue tasks (past due date, not closed/released).

### GET /tasks/blocked

Get all blocked tasks.

### POST /tasks

Create a task. **Auth:** Project Manager, Engineer, Admin.

**Body:**

```json
{
  "title": "Design drive shaft",
  "projectId": "64f...",
  "subassemblyId": "64f...",
  "assigneeId": "64f...",
  "departmentId": "64f...",
  "type": "design",
  "priority": "high",
  "status": "not_started",
  "dueDate": "2024-04-01T00:00:00Z",
  "estimatedHours": 40,
  "description": "Design the main drive shaft per specs"
}
```

### PATCH /tasks/:id

Update a task. Status changes trigger notifications.

### DELETE /tasks/:id

Soft-delete a task.

---

## Deliverables

### GET /deliverables

List deliverables. Supports filters: `projectId`, `status`, `procurementStatus`, `isLongLead`.

### GET /deliverables/:id

Get a single deliverable.

### POST /deliverables

Create a deliverable.

**Body:**

```json
{
  "title": "Drive Shaft Assembly Drawing",
  "projectId": "64f...",
  "taskId": "64f...",
  "type": "drawing",
  "status": "not_started",
  "procurementStatus": "not_needed",
  "isLongLead": false,
  "dueDate": "2024-04-10T00:00:00Z"
}
```

### PATCH /deliverables/:id

Update a deliverable.

### DELETE /deliverables/:id

Soft-delete a deliverable.

---

## Procurement

### Procurement Items

#### GET /procurement/items

List procurement items. Filters: `projectId`, `status`, `supplierId`, `isLongLead`.

#### GET /procurement/items/:id

Get a single procurement item.

#### POST /procurement/items

Create a procurement item.

**Body:**

```json
{
  "name": "Drive Motor 5kW",
  "projectId": "64f...",
  "deliverableId": "64f...",
  "supplierId": "64f...",
  "status": "spec_ready",
  "quantity": 2,
  "unit": "pcs",
  "estimatedCost": 3500,
  "isLongLead": true,
  "requiredDate": "2024-05-01T00:00:00Z"
}
```

#### PATCH /procurement/items/:id

Update a procurement item.

### Suppliers

#### GET /procurement/suppliers

List all suppliers.

#### GET /procurement/suppliers/:id

Get a single supplier.

#### POST /procurement/suppliers

Create a supplier.

**Body:**

```json
{
  "name": "Motor Corp International",
  "contactPerson": "John Motors",
  "email": "john@motorcorp.com",
  "phone": "+1-555-0200",
  "address": "456 Motor Drive",
  "category": "Motors & Drives"
}
```

#### PATCH /procurement/suppliers/:id

Update a supplier.

---

## Documents

### GET /documents?projectId=64f...

List project documents.

### POST /documents

Upload/create a document record.

**Body:**

```json
{
  "title": "Assembly Drawing Rev A",
  "projectId": "64f...",
  "type": "drawing",
  "version": "A",
  "url": "/uploads/assembly-drawing-a.pdf",
  "description": "Initial assembly drawing"
}
```

### PATCH /documents/:id

Update document metadata.

### DELETE /documents/:id

Soft-delete a document.

### Decision Log

#### GET /documents/decisions?projectId=64f...

List decisions for a project.

#### POST /documents/decisions

Create a decision log entry.

**Body:**

```json
{
  "title": "Use servo motors for conveyor",
  "projectId": "64f...",
  "description": "Decided to use servo motors instead of VFD for precision",
  "decidedBy": "64f...",
  "decisionDate": "2024-03-15T00:00:00Z",
  "impact": "Increases cost by $5k but improves accuracy",
  "status": "approved"
}
```

### Comments

#### GET /documents/comments?entityType=task&entityId=64f...

List comments for an entity.

#### POST /documents/comments

Add a comment.

**Body:**

```json
{
  "entityType": "task",
  "entityId": "64f...",
  "content": "Updated the design per review feedback",
  "userId": "64f..."
}
```

---

## Notifications

### GET /notifications

List notifications for the current user.

### GET /notifications/unread-count

Get count of unread notifications.

### PATCH /notifications/:id/read

Mark a notification as read.

### PATCH /notifications/read-all

Mark all notifications as read for current user.

---

## Dashboard

### GET /dashboard/executive

Executive dashboard metrics. **Auth:** Manager, Admin.

**Response:**

```json
{
  "totalProjects": 12,
  "activeProjects": 8,
  "completedProjects": 3,
  "onHoldProjects": 1,
  "healthBreakdown": { "on_track": 5, "at_risk": 2, "delayed": 1, "critical": 0 },
  "totalBudget": 2500000,
  "actualSpend": 1200000,
  "overdueTaskCount": 7,
  "blockedTaskCount": 3
}
```

### GET /dashboard/project/:projectId

Single project dashboard. **Auth:** Any authenticated user.

### GET /dashboard/department/:departmentId

Department workload dashboard. **Auth:** Manager, Admin, Project Manager.

### GET /dashboard/procurement

Procurement pipeline dashboard. **Auth:** Procurement, Manager, Admin.

### GET /dashboard/project-components?projectId=64f...

Component lifecycle dashboard for a project.

**Response includes:**

- `totalComponents`
- `completedComponents`
- `pendingComponents`
- `delayedComponents`
- `componentsBlockingProcurement`
- `componentsBlockingAssembly`
- `machineBreakdown`

---

## Audit Log

### GET /audit-log

Query audit log entries. **Auth:** Admin, Manager.

Filters:

- `?entityType=task`
- `?entityId=64f...`
- `?projectId=64f...`
- `?userId=64f...`
- `?startDate=2024-01-01&endDate=2024-12-31`

**Response:**

```json
[
  {
    "_id": "64f...",
    "action": "update",
    "entityType": "task",
    "entityId": "64f...",
    "projectId": "64f...",
    "userId": "64f...",
    "previousValues": { "status": "not_started" },
    "newValues": { "status": "in_progress" },
    "createdAt": "2024-03-15T10:30:00Z"
  }
]
```

---

## Error Responses

All endpoints return standard error responses:

| Status | Meaning                               |
| ------ | ------------------------------------- |
| 400    | Validation error — check request body |
| 401    | Missing or invalid JWT token          |
| 403    | Insufficient role permissions         |
| 404    | Resource not found                    |
| 500    | Internal server error                 |

**Error format:**

```json
{
  "statusCode": 400,
  "message": ["title must be a string", "priority must be a valid enum value"],
  "error": "Bad Request"
}
```

---

## WebSocket Events

**Namespace:** `/notifications`

### Client → Server

| Event  | Payload          | Description                   |
| ------ | ---------------- | ----------------------------- |
| `join` | `userId: string` | Join user's notification room |

### Server → Client

| Event          | Payload               | Description                     |
| -------------- | --------------------- | ------------------------------- |
| `notification` | `Notification` object | New notification pushed to user |
