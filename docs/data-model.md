# Data Model

Complete reference for all Mongoose schemas, their fields, relationships, and indexes.

**Convention:** All schemas use `camelCase` fields, include `timestamps: true` (auto `createdAt`/`updatedAt`), and support soft-delete via `deletedAt`.

---

## Entity Relationship Overview

```
Customer ──< Opportunity ──< Project ──< Machine ──< Module ──< Subassembly ──< Task
                                   │                                          └──< Deliverable
                                   ├──< Milestone (embedded)
                                   ├──< KickoffRecord (embedded)
                                   ├──< ProcurementItem ──> Supplier
                                   ├──< ProjectDocument
                                   ├──< DecisionLog
                                   ├──< Risk
                                   └──< AuditLog

User ──> Department
Task ──> User (assignee)
Task ──> Department
Task ──>* Task (dependsOn)
Notification ──> User
Comment ──> User, Entity (polymorphic)
```

`──<` = one-to-many, `──>` = reference, `──>*` = array of references

---

## User

| Field          | Type                  | Required | Description                                                               |
| -------------- | --------------------- | -------- | ------------------------------------------------------------------------- |
| `email`        | String                | Yes      | Unique, indexed                                                           |
| `password`     | String                | Yes      | bcrypt hashed, excluded from queries via `select: false`                  |
| `firstName`    | String                | Yes      |                                                                           |
| `lastName`     | String                | Yes      |                                                                           |
| `role`         | Enum(Role)            | Yes      | `admin`, `sales`, `project_manager`, `engineer`, `procurement`, `manager` |
| `departmentId` | ObjectId → Department | No       |                                                                           |
| `phone`        | String                | No       |                                                                           |
| `avatarUrl`    | String                | No       |                                                                           |
| `isActive`     | Boolean               | Yes      | Default: `true`                                                           |
| `deletedAt`    | Date                  | No       | Soft-delete marker                                                        |

**Indexes:** `{ email: 1 }` (unique), `{ role: 1 }`, `{ departmentId: 1 }`

---

## Department

| Field         | Type   | Required | Description                     |
| ------------- | ------ | -------- | ------------------------------- |
| `name`        | String | Yes      | e.g., "Mechanical Engineering"  |
| `code`        | String | Yes      | Unique short code, e.g., "MECH" |
| `description` | String | No       |                                 |
| `deletedAt`   | Date   | No       |                                 |

**Indexes:** `{ code: 1 }` (unique)

---

## Customer

| Field           | Type   | Required | Description     |
| --------------- | ------ | -------- | --------------- |
| `name`          | String | Yes      | Company name    |
| `contactPerson` | String | No       | Primary contact |
| `email`         | String | No       |                 |
| `phone`         | String | No       |                 |
| `address`       | String | No       |                 |
| `industry`      | String | No       |                 |
| `deletedAt`     | Date   | No       |                 |

**Indexes:** `{ name: 1 }`

---

## Opportunity

| Field                  | Type                        | Required | Description                                                                                      |
| ---------------------- | --------------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `title`                | String                      | Yes      |                                                                                                  |
| `customerId`           | ObjectId → Customer         | Yes      |                                                                                                  |
| `description`          | String                      | No       |                                                                                                  |
| `status`               | Enum(OpportunityStatus)     | Yes      | `new`, `under_review`, `feasibility_in_progress`, `approved`, `rejected`, `converted_to_project` |
| `priority`             | Enum(Priority)              | No       | `critical`, `high`, `medium`, `low`                                                              |
| `machineType`          | String                      | No       | Type of machine requested                                                                        |
| `estimatedBudget`      | Number                      | No       |                                                                                                  |
| `requirements`         | [String]                    | No       | List of requirements                                                                             |
| `specifications`       | Mixed                       | No       | Flexible key-value specs                                                                         |
| `feasibilityNotes`     | String                      | No       |                                                                                                  |
| `feasibilityReviewers` | [ObjectId → User]           | No       |                                                                                                  |
| `attachments`          | [{ name, url, uploadedAt }] | No       |                                                                                                  |
| `createdBy`            | ObjectId → User             | Yes      |                                                                                                  |
| `convertedProjectId`   | ObjectId → Project          | No       | Set after conversion                                                                             |
| `deletedAt`            | Date                        | No       |                                                                                                  |

**Indexes:** `{ status: 1 }`, `{ customerId: 1 }`, `{ createdBy: 1 }`

---

## Project

| Field             | Type                   | Required | Description                                  |
| ----------------- | ---------------------- | -------- | -------------------------------------------- |
| `name`            | String                 | Yes      |                                              |
| `customerId`      | ObjectId → Customer    | Yes      |                                              |
| `opportunityId`   | ObjectId → Opportunity | No       | Source opportunity                           |
| `stage`           | Enum(ProjectStage)     | Yes      | See conventions                              |
| `health`          | Enum(ProjectHealth)    | No       | `on_track`, `at_risk`, `delayed`, `critical` |
| `description`     | String                 | No       |                                              |
| `estimatedBudget` | Number                 | No       |                                              |
| `actualBudget`    | Number                 | No       |                                              |
| `targetStartDate` | Date                   | No       |                                              |
| `targetEndDate`   | Date                   | No       |                                              |
| `actualStartDate` | Date                   | No       |                                              |
| `actualEndDate`   | Date                   | No       |                                              |
| `progress`        | Number                 | No       | 0–100 percentage                             |
| `projectManager`  | ObjectId → User        | No       |                                              |
| `teamMembers`     | [ObjectId → User]      | No       |                                              |
| `milestones`      | [Milestone]            | No       | Embedded subdocuments                        |
| `kickoff`         | KickoffRecord          | No       | Embedded subdocument                         |
| `deletedAt`       | Date                   | No       |                                              |

### Milestone (embedded)

| Field           | Type    | Required       |
| --------------- | ------- | -------------- |
| `name`          | String  | Yes            |
| `targetDate`    | Date    | Yes            |
| `completedDate` | Date    | No             |
| `description`   | String  | No             |
| `isCompleted`   | Boolean | Default: false |

### KickoffRecord (embedded)

| Field         | Type              | Required |
| ------------- | ----------------- | -------- |
| `date`        | Date              | Yes      |
| `attendees`   | [ObjectId → User] | No       |
| `notes`       | String            | No       |
| `actionItems` | [String]          | No       |

**Indexes:** `{ stage: 1 }`, `{ customerId: 1 }`, `{ health: 1 }`, `{ projectManager: 1 }`

---

## Quote

Commercial offer sent to a customer. Multiple quotes can belong to the same customer or opportunity.

| Field                | Type                    | Required | Description                                      |
| -------------------- | ----------------------- | -------- | ------------------------------------------------ |
| `quoteNo`            | String                  | Yes      | Human-readable quote number                      |
| `customerId`         | ObjectId → Customer     | Yes      | Customer receiving the offer                     |
| `opportunityId`      | ObjectId → Opportunity  | No       | Source machine inquiry                           |
| `status`             | Enum(QuoteStatus)       | Yes      | `draft`, `sent`, `accepted`, `declined`, `expired` |
| `customerSnapshot`   | Object                  | Yes      | Customer details frozen at quote creation        |
| `lineItems`          | [Object]                | Yes      | Commercial line items                            |
| `grandTotal`         | Number                  | Yes      | Accepted commercial value                        |
| `acceptedAt`         | Date                    | No       | Set when customer accepts                        |
| `acceptedBy`         | ObjectId → User         | No       | User recording acceptance                        |
| `customerPoNumber`   | String                  | No       | Customer purchase order/reference                |
| `convertedProjectId` | ObjectId → Project      | No       | Project created from the accepted quote          |

---

## Invoice

Billing record created from an accepted quote.

| Field              | Type                | Required | Description                                      |
| ------------------ | ------------------- | -------- | ------------------------------------------------ |
| `invoiceNo`        | String              | Yes      | Human-readable invoice number                    |
| `customerId`       | ObjectId → Customer | Yes      | Customer being billed                            |
| `sourceQuoteId`    | ObjectId → Quote    | Yes      | Accepted quote that defines the commercial basis |
| `projectId`        | ObjectId → Project  | No       | Delivery project, when available                 |
| `status`           | Enum(InvoiceStatus) | Yes      | `draft`, `sent`, `unpaid`, `partially_paid`, `paid`, `overdue`, `void` |
| `invoiceDate`      | Date                | Yes      | Invoice date                                     |
| `dueDate`          | Date                | No       | Payment due date                                 |
| `customerSnapshot` | Object              | Yes      | Customer details copied from quote               |
| `lineItems`        | [Object]            | Yes      | Line items copied from quote                     |
| `grandTotal`       | Number              | Yes      | Invoice total                                    |
| `amountPaid`       | Number              | Yes      | Amount collected                                 |
| `balanceDue`       | Number              | Yes      | Remaining amount                                 |

---

## Machine

| Field         | Type               | Required | Description |
| ------------- | ------------------ | -------- | ----------- |
| `name`        | String             | Yes      |             |
| `projectId`   | ObjectId → Project | Yes      |             |
| `description` | String             | No       |             |
| `status`      | String             | No       |             |
| `deletedAt`   | Date               | No       |             |

**Indexes:** `{ projectId: 1 }`

---

## Module

| Field          | Type                  | Required | Description       |
| -------------- | --------------------- | -------- | ----------------- |
| `name`         | String                | Yes      |                   |
| `machineId`    | ObjectId → Machine    | Yes      |                   |
| `departmentId` | ObjectId → Department | No       | Owning department |
| `description`  | String                | No       |                   |
| `status`       | String                | No       |                   |
| `deletedAt`    | Date                  | No       |                   |

**Indexes:** `{ machineId: 1 }`

---

## Subassembly

| Field          | Type                  | Required | Description |
| -------------- | --------------------- | -------- | ----------- |
| `name`         | String                | Yes      |             |
| `moduleId`     | ObjectId → Module     | Yes      |             |
| `departmentId` | ObjectId → Department | No       |             |
| `description`  | String                | No       |             |
| `status`       | String                | No       |             |
| `deletedAt`    | Date                  | No       |             |

**Indexes:** `{ moduleId: 1 }`

---

## Component

| Field                   | Type                          | Required | Description |
| ----------------------- | ----------------------------- | -------- | ----------- |
| `name`                  | String                        | Yes      | Component name |
| `code`                  | String                        | No       | Optional component code |
| `projectId`             | ObjectId → Project            | Yes      | Owning project |
| `machineId`             | ObjectId → Machine            | Yes      | Owning machine |
| `moduleId`              | ObjectId → Module             | No       | Optional module placement |
| `subassemblyId`         | ObjectId → Subassembly        | No       | Optional subassembly placement |
| `ownerId`               | ObjectId → User               | Yes      | Assigned engineer |
| `reviewerId`            | ObjectId → User               | No       | Reviewer for approval gate |
| `dueDate`               | Date                          | No       | Component due date |
| `lifecycleStage`        | Enum(ComponentLifecycleStage) | Yes      | `design`, `review`, `release`, `procurement_ready`, `ordered`, `received`, `assembly_ready`, `blocked` |
| `dependencyIds`         | [ObjectId → Component]        | No       | Upstream components |
| `deliverableIds`        | [ObjectId → Deliverable]      | No       | Attached outputs |
| `procurementVisible`    | Boolean                       | Yes      | True once released |
| `procurementBlocked`    | Boolean                       | Yes      | True while not yet eligible for procurement |
| `assemblyBlocked`       | Boolean                       | Yes      | True until receipt / assembly readiness |
| `blockedByDependencies` | Boolean                       | Yes      | Dependency blocker flag |
| `blockedByComponentIds` | [ObjectId → Component]        | No       | Specific delayed blockers |
| `reviewApprovedBy`      | ObjectId → User               | No       | Reviewer who approved the review stage |
| `reviewApprovedAt`      | Date                          | No       | Review approval timestamp |
| `releasedAt`            | Date                          | No       | Release timestamp |
| `procurementReadyAt`    | Date                          | No       | Procurement-ready timestamp |
| `orderedAt`             | Date                          | No       | Ordered timestamp |
| `receivedAt`            | Date                          | No       | Received timestamp |
| `assemblyReadyAt`       | Date                          | No       | Assembly-ready timestamp |
| `reminderSentAt`        | Date                          | No       | Due reminder sent |
| `overdueNotifiedAt`     | Date                          | No       | Overdue alert sent |
| `escalatedAt`           | Date                          | No       | Escalated to manager |
| `deletedAt`             | Date                          | No       | Soft delete |

**Indexes:** `{ projectId: 1, machineId: 1 }`, `{ ownerId: 1, lifecycleStage: 1 }`, `{ dueDate: 1 }`

---

## Task

| Field                | Type                   | Required | Description                                                                                        |
| -------------------- | ---------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `title`              | String                 | Yes      |                                                                                                    |
| `projectId`          | ObjectId → Project     | Yes      |                                                                                                    |
| `subassemblyId`      | ObjectId → Subassembly | No       | Where in the breakdown                                                                             |
| `assigneeId`         | ObjectId → User        | No       | Assigned engineer                                                                                  |
| `departmentId`       | ObjectId → Department  | No       |                                                                                                    |
| `type`               | Enum(TaskType)         | No       | `design`, `review`, `approval`, `manufacturing`, `testing`, `documentation`, `other`               |
| `status`             | Enum(TaskStatus)       | Yes      | `not_started`, `in_progress`, `waiting_for_input`, `under_review`, `blocked`, `released`, `closed` |
| `priority`           | Enum(Priority)         | No       |                                                                                                    |
| `description`        | String                 | No       |                                                                                                    |
| `dueDate`            | Date                   | No       |                                                                                                    |
| `estimatedHours`     | Number                 | No       |                                                                                                    |
| `actualHours`        | Number                 | No       |                                                                                                    |
| `dependsOn`          | [ObjectId → Task]      | No       | Upstream dependencies                                                                              |
| `blockerDescription` | String                 | No       |                                                                                                    |
| `blockerRaisedBy`    | ObjectId → User        | No       |                                                                                                    |
| `deletedAt`          | Date                   | No       |                                                                                                    |

**Indexes:** `{ projectId: 1 }`, `{ assigneeId: 1 }`, `{ status: 1 }`, `{ departmentId: 1 }`, `{ dueDate: 1 }`

---

## Deliverable

| Field               | Type                    | Required       | Description                                                      |
| ------------------- | ----------------------- | -------------- | ---------------------------------------------------------------- |
| `title`             | String                  | Yes            |                                                                  |
| `projectId`         | ObjectId → Project      | Yes            |                                                                  |
| `taskId`            | ObjectId → Task         | No             | Parent task                                                      |
| `type`              | String                  | No             | drawing, specification, BOM, etc.                                |
| `status`            | Enum(TaskStatus)        | Yes            | Same statuses as Task                                            |
| `procurementStatus` | Enum(ProcurementStatus) | No             | `not_needed`, `spec_ready`, `rfq_sent`, `po_issued`, `delivered` |
| `isLongLead`        | Boolean                 | Default: false | Needs early procurement                                          |
| `dueDate`           | Date                    | No             |                                                                  |
| `description`       | String                  | No             |                                                                  |
| `deletedAt`         | Date                    | No             |                                                                  |

**Indexes:** `{ projectId: 1 }`, `{ taskId: 1 }`, `{ procurementStatus: 1 }`

---

## ProcurementItem

| Field           | Type                    | Required       | Description |
| --------------- | ----------------------- | -------------- | ----------- |
| `name`          | String                  | Yes            |             |
| `projectId`     | ObjectId → Project      | Yes            |             |
| `deliverableId` | ObjectId → Deliverable  | No             |             |
| `supplierId`    | ObjectId → Supplier     | No             |             |
| `status`        | Enum(ProcurementStatus) | Yes            |             |
| `quantity`      | Number                  | No             |             |
| `unit`          | String                  | No             |             |
| `estimatedCost` | Number                  | No             |             |
| `actualCost`    | Number                  | No             |             |
| `isLongLead`    | Boolean                 | Default: false |             |
| `requiredDate`  | Date                    | No             |             |
| `orderedDate`   | Date                    | No             |             |
| `deliveredDate` | Date                    | No             |             |
| `notes`         | String                  | No             |             |
| `deletedAt`     | Date                    | No             |             |

**Indexes:** `{ projectId: 1 }`, `{ status: 1 }`, `{ supplierId: 1 }`

---

## Supplier

| Field           | Type   | Required | Description      |
| --------------- | ------ | -------- | ---------------- |
| `name`          | String | Yes      |                  |
| `contactPerson` | String | No       |                  |
| `email`         | String | No       |                  |
| `phone`         | String | No       |                  |
| `address`       | String | No       |                  |
| `category`      | String | No       | Product category |
| `notes`         | String | No       |                  |
| `deletedAt`     | Date   | No       |                  |

**Indexes:** `{ name: 1 }`

---

## Dependency

| Field          | Type                 | Required | Description                                             |
| -------------- | -------------------- | -------- | ------------------------------------------------------- |
| `sourceTaskId` | ObjectId → Task      | Yes      | Upstream task                                           |
| `targetTaskId` | ObjectId → Task      | Yes      | Downstream task                                         |
| `type`         | Enum(DependencyType) | Yes      | `finish_to_start`, `start_to_start`, `finish_to_finish` |
| `projectId`    | ObjectId → Project   | Yes      |                                                         |
| `description`  | String               | No       |                                                         |

**Indexes:** `{ sourceTaskId: 1 }`, `{ targetTaskId: 1 }`, `{ projectId: 1 }`

---

## Blocker

| Field             | Type               | Required        | Description        |
| ----------------- | ------------------ | --------------- | ------------------ |
| `taskId`          | ObjectId → Task    | Yes             | Blocked task       |
| `projectId`       | ObjectId → Project | Yes             |                    |
| `description`     | String             | Yes             |                    |
| `raisedBy`        | ObjectId → User    | Yes             |                    |
| `assignedTo`      | ObjectId → User    | No              | Who should resolve |
| `severity`        | String             | No              |                    |
| `status`          | String             | Default: "open" | `open`, `resolved` |
| `resolvedAt`      | Date               | No              |                    |
| `resolutionNotes` | String             | No              |                    |

**Indexes:** `{ taskId: 1 }`, `{ status: 1 }`

---

## ProjectDocument

| Field         | Type               | Required | Description                                       |
| ------------- | ------------------ | -------- | ------------------------------------------------- |
| `title`       | String             | Yes      |                                                   |
| `projectId`   | ObjectId → Project | Yes      |                                                   |
| `type`        | String             | No       | drawing, specification, report, minutes, contract |
| `version`     | String             | No       | e.g., "A", "1.0"                                  |
| `url`         | String             | No       | File location                                     |
| `description` | String             | No       |                                                   |
| `uploadedBy`  | ObjectId → User    | Yes      |                                                   |

**Indexes:** `{ projectId: 1 }`

---

## DecisionLog

| Field          | Type               | Required | Description                                      |
| -------------- | ------------------ | -------- | ------------------------------------------------ |
| `title`        | String             | Yes      |                                                  |
| `projectId`    | ObjectId → Project | Yes      |                                                  |
| `description`  | String             | No       |                                                  |
| `decidedBy`    | ObjectId → User    | Yes      |                                                  |
| `decisionDate` | Date               | Yes      |                                                  |
| `impact`       | String             | No       |                                                  |
| `status`       | String             | Yes      | `proposed`, `approved`, `rejected`, `superseded` |

**Indexes:** `{ projectId: 1 }`, `{ status: 1 }`

---

## Comment

| Field        | Type            | Required | Description                          |
| ------------ | --------------- | -------- | ------------------------------------ |
| `entityType` | String          | Yes      | `task`, `document`, `decision`, etc. |
| `entityId`   | ObjectId        | Yes      | Referenced entity                    |
| `content`    | String          | Yes      |                                      |
| `userId`     | ObjectId → User | Yes      | Author                               |

**Indexes:** `{ entityType: 1, entityId: 1 }`

---

## Notification

| Field        | Type                   | Required       | Description                                                                                                                    |
| ------------ | ---------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `userId`     | ObjectId → User        | Yes            | Recipient                                                                                                                      |
| `type`       | Enum(NotificationType) | Yes            | `task_assigned`, `status_change`, `comment_added`, `blocker_raised`, `deadline_approaching`, `escalation`, `approval_required` |
| `title`      | String                 | Yes            |                                                                                                                                |
| `message`    | String                 | No             |                                                                                                                                |
| `entityType` | String                 | No             | Related entity type                                                                                                            |
| `entityId`   | ObjectId               | No             | Related entity                                                                                                                 |
| `isRead`     | Boolean                | Default: false |                                                                                                                                |
| `readAt`     | Date                   | No             |                                                                                                                                |

**Indexes:** `{ userId: 1, isRead: 1 }`, `{ createdAt: -1 }`

---

## Risk

| Field            | Type               | Required        | Description                   |
| ---------------- | ------------------ | --------------- | ----------------------------- |
| `projectId`      | ObjectId → Project | Yes             |                               |
| `title`          | String             | Yes             |                               |
| `description`    | String             | No              |                               |
| `likelihood`     | String             | No              | low, medium, high             |
| `impact`         | String             | No              | low, medium, high             |
| `status`         | String             | Default: "open" | `open`, `mitigated`, `closed` |
| `mitigationPlan` | String             | No              |                               |
| `ownerId`        | ObjectId → User    | No              |                               |

**Indexes:** `{ projectId: 1 }`, `{ status: 1 }`

---

## AuditLog

| Field            | Type               | Required | Description                                   |
| ---------------- | ------------------ | -------- | --------------------------------------------- |
| `action`         | String             | Yes      | `create`, `update`, `delete`, `status_change` |
| `entityType`     | String             | Yes      | e.g., "task", "project", "opportunity"        |
| `entityId`       | ObjectId           | Yes      |                                               |
| `projectId`      | ObjectId → Project | No       |                                               |
| `userId`         | ObjectId → User    | Yes      | Who performed the action                      |
| `previousValues` | Mixed              | No       | Snapshot before change                        |
| `newValues`      | Mixed              | No       | Snapshot after change                         |
| `description`    | String             | No       | Human-readable description                    |

**Indexes:** `{ entityType: 1, entityId: 1 }`, `{ projectId: 1 }`, `{ userId: 1 }`, `{ createdAt: -1 }`

---

## Enumerations

### Role

`admin` | `sales` | `project_manager` | `engineer` | `procurement` | `manager`

### TaskStatus

`not_started` | `in_progress` | `waiting_for_input` | `under_review` | `blocked` | `released` | `closed`

### OpportunityStatus

`new` | `under_review` | `feasibility_in_progress` | `approved` | `rejected` | `converted_to_project`

### ProjectStage

`inquiry` | `feasibility` | `concept_approved` | `engineering_in_progress` | `review_release` | `procurement_in_progress` | `build_assembly` | `fat_sat` | `completed` | `on_hold` | `cancelled`

### ProjectHealth

`on_track` | `at_risk` | `delayed` | `critical`

### ProcurementStatus

`not_needed` | `spec_ready` | `rfq_sent` | `po_issued` | `delivered`

### Priority

`critical` | `high` | `medium` | `low`

### TaskType

`design` | `review` | `approval` | `manufacturing` | `testing` | `documentation` | `other`

### DependencyType

`finish_to_start` | `start_to_start` | `finish_to_finish`

### ComponentLifecycleStage

`design` | `review` | `release` | `procurement_ready` | `ordered` | `received` | `assembly_ready` | `blocked`

### NotificationType

`task_assigned` | `status_change` | `comment_added` | `blocker_raised` | `deadline_approaching` | `escalation` | `approval_required`
