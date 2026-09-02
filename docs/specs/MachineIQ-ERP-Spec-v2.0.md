# MachineIQ — ERP Scope Expansion Specification

**Spec version:** v2.0
**Supersedes:** `productspec.md` (v1.0 — OEM Machine Execution Platform) — *extends, does not replace*
**Date:** 2026-08-27
**Status:** Draft — awaiting client sign-off on §7 (Architectural Decisions) and §10 (Open Questions)
**Source document:** `Dashboard.docx` — 8 pages, 458 words, authored by Shankar Saravanan, created 2026-08-25 17:32 UTC, last modified 2026-08-25 18:02 UTC, revision 4
**Classification:** 🔒 **CLIENT CONFIDENTIAL** — internal distribution only. Do not publish, share externally, or upload to third-party services.
**Current product build:** `0.2.0-beta.1` (backend + frontend)

---

## 1. Executive Summary

### 1.1 The headline finding

The client document describes a **full-scope manufacturing ERP** — Sales, Purchase, Inventory,
Production, Quality, HR & Payroll, and Finance, sitting on a workflow engine, a notification
layer, and a reporting layer.

MachineIQ today is a **narrow, deep engineering-execution platform**: it takes a machine inquiry
through quotation, project kickoff, ISA-88 machine breakdown, engineering task execution,
design-release, and procurement *readiness*, with dashboards on top.

These are different products with a partial overlap. MachineIQ is not a subset of the requested
ERP that simply needs more modules bolted on — it is *deeper than the ERP spec* in the engineering
middle (machine breakdown, component lifecycle, dependency/blocker propagation) and *entirely absent*
at both commercial ends (inventory, financial accounting, HR, purchasing execution).

### 1.2 Coverage at a glance

| Client Phase | Scope | Status | Coverage |
|---|---|---|---|
| Phase 1 — Master Data | Company, User, Customer, Supplier, Item | 🟡 Partial | ~45% |
| Phase 2 — Sales Module | Enquiry → … → Payment Receipt | 🟡 Partial | ~50% |
| Phase 2 — Purchase Module | PR → RFQ → PO → GRN → Payment | 🔴 Missing | ~10% |
| Phase 2 — Inventory Module | Stock in/out, transfer, adjustment, count | 🔴 Missing | 0% |
| Phase 2 — Production Module | BOM → Work Order → Issue → Assembly → QC | 🟡 Partial | ~30% |
| Phase 2 — Quality Module | Inspections, NCR, CAPA | 🔴 Missing | ~5% |
| Phase 2 — HR & Payroll | Employee, attendance, leave, payroll | 🔴 Missing | ~5% |
| Phase 2 — Finance Module | AR, AP, GL, cash, bank, assets | 🔴 Missing | ~8% |
| Phase 3 — Database Architecture | PostgreSQL recommended | ⚠️ Conflict | n/a |
| Phase 4 — Workflow Engine | Configurable approval chains | 🔴 Missing | ~10% |
| Phase 5 — Notification System | Email, dashboard, mobile, WhatsApp | 🟡 Partial | ~25% |
| Phase 6 — Reporting System | 14 named reports across 5 domains | 🟡 Partial | ~20% |

**Weighted overall coverage of the client document: ≈ 22%.**

### 1.3 What MachineIQ has that the client document does not ask for

This is material to the commercial conversation — it is delivered value that the source document
does not credit:

- **ISA-88 machine breakdown structure** — `Project → Machine → Unit → EquipmentModule → ControlModule → Component`
- **Three-axis component lifecycle** — independent design / procurement / assembly status per component,
  with an 8-stage rolled-up lifecycle stage
- **Dependency & blocker propagation** — components and tasks block downstream work automatically
- **Design-release gating into procurement** — nothing becomes procurable until design is released
- **Machine templates** — reusable machine structures for repeat builds
- **Role-scoped dashboards** — five distinct dashboard views (executive, PM, engineer, procurement, sales)
- **Discussion board / decision log** — meeting, call, email, note, question, decision entries against a project
- **Full audit trail** — every mutation logged with before/after values
- **Real-time notification delivery** — Socket.IO push to the browser

---

## 2. Purpose and Scope of This Specification

### 2.1 Purpose

1. Record the client's Phase 1–6 requirements verbatim and losslessly (§3).
2. State, per requirement, what is built, what is partially built, and what is absent — with code evidence (§4–§6).
3. Surface the architectural decisions that must be settled before any build starts (§7).
4. Propose a sequenced, releasable roadmap (§9).
5. List the questions that block estimation (§10).

### 2.2 Scope

In scope: gap analysis and forward specification for the requirements in `Dashboard.docx`.

Out of scope for this document: effort estimates in man-days, pricing, and detailed screen design.
Those follow client sign-off on §7 and §10.

### 2.3 Reading conventions

- ✅ **Built** — implemented, tested, in the running product.
- 🟡 **Partial** — a related capability exists but does not satisfy the requirement as written.
- 🔴 **Missing** — no implementation.
- ⚠️ **Conflict** — the requirement contradicts an existing architectural decision.

---

## 3. Source Document — Faithful Restatement

The client document is structured as six phases plus a recommended development sequence. It is
restated below in full so that this specification is self-contained and no requirement is lost in
translation.

> **Note on document fidelity:** the source contains the artefact string `Show more lines` in the
> Phase 3 "Reference Tables" list, and lists `Plain Text` as the first table under the Quality
> module. Both read as paste artefacts from a source tool rather than requirements. §10 Q1 asks
> the client to confirm. This spec treats them as artefacts, not requirements.

### 3.1 Phase 1 — Master Data
*"This becomes the backbone of everything."*

| Master | Required attributes |
|---|---|
| Company Master | Company details, Branches, Locations, Departments |
| User Master | Employee, Role, Permission, Login credentials |
| Customer Master | Customer code, Address, Contact details, GST/VAT information |
| Supplier Master | Vendor code, Payment terms, Contact information |
| Item Master | Item code, Description, UOM, Category, Cost, Selling price |

### 3.2 Phase 2 — Core Modules

**Sales Module** — flow: Customer Enquiry → Quotation → Sales Order → Delivery Note → Invoice → Payment Receipt.
Tables: `sales_quotation`, `sales_order`, `delivery_note`, `sales_invoice`, `customer_payment`.

**Purchase Module** — flow: Purchase Request → RFQ → Supplier Quotation → Purchase Order → Goods Receipt → Supplier Invoice → Payment.
Tables: `purchase_request`, `purchase_order`, `goods_receipt`, `purchase_invoice`, `supplier_payment`.

**Inventory Module** — *"Tracks stock movement."* Transactions: Stock In, Stock Out, Transfer, Adjustment, Cycle Count.
Tables: `warehouse`, `stock_transaction`, `stock_balance`, `inventory_adjustment`.

**Production Module (Manufacturing)** — *"Very important for gearbox and assembly industries."*
Flow: BOM → Production Planning → Work Order → Material Issue → Assembly → Quality Check → Finished Goods.
Tables: `bom_header`, `bom_details`, `work_order`, `production_issue`, `production_output`.

**Quality Module** — Incoming Inspection, In-Process Inspection, Final Inspection, NCR, CAPA.
Tables: `quality_check`, `inspection_report`, `ncr`, `capa`.

**HR & Payroll** — Employee, Attendance, Leave, Overtime, Payroll.
Tables: `employee`, `attendance`, `leave`, `salary`.

**Finance Module** — AR, AP, GL, Cash, Bank, Assets.
Tables: `account_head`, `journal_entry`, `ledger`, `cash_book`, `bank_book`.

### 3.3 Phase 3 — Database Architecture

- **Master tables:** `users`, `customers`, `suppliers`, `items`, `warehouses`, `employees`
- **Transaction tables:** `sales_order`, `purchase_order`, `work_order`, `stock_transaction`, `journal_entry`
- **Reference tables:** `status`, `approval_levels`, `document_type`
- **Database options:** PostgreSQL (client's recommendation), SQL Server, MySQL

### 3.4 Phase 4 — Workflow Engine

*"Every ERP needs approvals."* Example chain: Purchase Request → Manager Approval → Purchase Manager Approval → PO Creation.
Tables: `workflow_master`, `workflow_step`, `workflow_history`.

### 3.5 Phase 5 — Notification System

Channels: Email, Dashboard Alert, Mobile Notification, WhatsApp Integration.
Example triggers: PO approval pending, stock below minimum, machine maintenance due, employee leave request.

### 3.6 Phase 6 — Reporting System

| Domain | Reports |
|---|---|
| Sales | Sales by customer, Sales by month, Pending orders |
| Purchase | Supplier performance, Open PO |
| Inventory | Stock valuation, ABC analysis, Slow moving items |
| Production | Work order status, Material consumption, Productivity |
| Finance | Trial balance, P&L, Balance sheet |

### 3.7 Client's suggested development sequence

`1. Login & User Management → 2. Master Data → 3. Inventory → 4. Purchase → 5. Sales → 6. Finance → 7. Production → 8. Quality → 9. HR → 10. Dashboards & Reports`

---

## 4. Gap Analysis — Phase 1: Master Data

### 4.1 Company Master — 🟡 Partial (~40%)

| Requirement | Status | Evidence / Gap |
|---|---|---|
| Company details | 🟡 Partial | Stored as a **settings JSON blob**, not an entity: `commercial_preferences.{organizationName, organizationEmail, organizationPhone, taxRegistrationNumber, billingAddress, bankDetails}` in `backend/src/modules/settings/settings.service.ts`. Captured at first-run via `frontend/src/app/setup/page.tsx`. |
| Branches | 🔴 Missing | No `Branch` entity. No branch scoping on any transaction. |
| Locations | 🔴 Missing | No `Location` entity. Blocks the Inventory module entirely (see §5.3). |
| Departments | ✅ Built | `backend/src/schemas/department.schema.ts` — `name`, `code`, `description`, `isActive`, soft-delete. |

**Gap:** the company profile is a key/value settings record, not a first-class entity. It cannot be
extended to multiple branches or locations without promotion to a collection. Nothing in the system
is branch-scoped or location-scoped.

### 4.2 User Master — 🟡 Partial (~65%)

| Requirement | Status | Evidence / Gap |
|---|---|---|
| Employee | 🟡 Partial | `User` (`backend/src/schemas/user.schema.ts`) carries `firstName`, `lastName`, `email`, `role`, `departmentId`, `title`, `phone`, `isActive`. It is a **login identity, not an HR employee record** — no employee code, join date, grade, reporting manager, cost rate, or employment status. |
| Role | ✅ Built | `Role` enum — `admin`, `manager`, `sales`, `designer`, `leadership` (`backend/src/common/enums.ts`). |
| Permission | 🟡 Partial | RBAC is **role-based only** — `@Roles()` + `RolesGuard`, enforced server-side on every endpoint. There is **no permission master**: permissions cannot be granted, revoked, or composed per user. An ERP with approval chains needs this. |
| Login credentials | ✅ Built | JWT + `passport-jwt`; bcrypt @ 12 rounds; password policy min 10 chars with upper/lower/number; rate-limited login (5/min) and register (3/min). |

**Gap:** (a) no separation of *identity* (`User`) from *employee* (`Employee`) — required before HR & Payroll;
(b) no granular permission model — required before a configurable workflow engine.

### 4.3 Customer Master — 🟡 Partial (~85%)

| Requirement | Status | Evidence / Gap |
|---|---|---|
| Customer code | 🔴 Missing | `backend/src/schemas/customer.schema.ts` has **no `code` field**. Customers are keyed by MongoDB `_id`. An ERP needs a human-readable, sequential, unique customer code. |
| Address | ✅ Built | Full billing + shipping address blocks (`address`, `city`, `stateProvince`, `postalCode`, `country` × 2). |
| Contact details | ✅ Built | Primary and secondary contacts — name, email, phone, mobile, designation, department. |
| GST/VAT information | ✅ Built | `vatNumber`, `taxTreatment`, `placeOfSupply`, `registrationNumber`. |

**Beyond requirement (already built):** `accountType`, `customerType`, `companySize`, `industry`,
`website`, `paymentTerms`, `currencyCode`, `creditLimit`, `priceList`, `deliveryTerms`, plus
CSV/XLSX bulk import (`backend/src/modules/customers/customers.service.ts:175`).

**Gap:** customer code only. This is the **smallest gap in the entire document** — closeable in hours.

### 4.4 Supplier Master — 🟡 Partial (~40%)

| Requirement | Status | Evidence / Gap |
|---|---|---|
| Vendor code | 🔴 Missing | No `code` field on `Supplier` (`backend/src/schemas/procurement.schema.ts`). |
| Payment terms | 🔴 Missing | No field. |
| Contact information | ✅ Built | `name`, `contactPerson`, `email`, `phone`, `address`, `category`. |

**Gap:** `Supplier` is a thin contact card built to serve procurement *readiness tracking*, not
purchasing execution. To support the Purchase module it needs: vendor code, payment terms, tax
registration, currency, bank details, lead-time defaults, approval/qualification status, and a
performance history link.

### 4.5 Item Master — 🔴 Missing as an entity (~20%)

| Requirement | Status | Evidence / Gap |
|---|---|---|
| Item code | 🟡 Partial | `sku` exists **only on quote/invoice line items** (`backend/src/schemas/quote.schema.ts`), and as an untyped array inside `commercial_preferences.items` in the settings JSON. Not a collection, not indexed, not referentially enforced. |
| Description | 🟡 Partial | Same — line-item level only. |
| UOM | 🟡 Partial | A flat string array `['Nos','Set','Lot','Hour','Day']` in settings. Not a UOM master; no conversion factors. |
| Category | 🔴 Missing | `ModuleComponentCategory` (`Mechanical`/`Electrical`/`COTS`/`Custom`) exists on **components**, but this is an engineering discipline tag, not an item category hierarchy. |
| Cost | 🟡 Partial | `costPrice` on quote/invoice line items only. No standard cost, no moving-average cost, no valuation basis. |
| Selling price | 🟡 Partial | `unitPrice` on line items; a default `rate` in the settings `items` array. No price list entity, despite `Customer.priceList` referencing one by name. |

**Gap — this is the single most structurally important gap in Phase 1.** There is no `Item`
collection. Item-like data lives in three disconnected places: the settings JSON, embedded quote
line items, and the `Component` tree. Every downstream module the client asks for — Inventory,
Purchase, Production BOM, Quality inspection, stock valuation, ABC analysis — is **hard-blocked**
on a real Item master.

---

## 5. Gap Analysis — Phase 2: Core Modules

### 5.1 Sales Module — 🟡 Partial (~50%)

| Client step | MachineIQ equivalent | Status |
|---|---|---|
| 1. Customer Enquiry | `Opportunity` — "Machine Inquiries" in the UI. Structured intake, feasibility, approval workflow, template or blank intake modes. | ✅ Built (exceeds requirement) |
| 2. Quotation | `Quote` — numbered (`quoteNo`), customer snapshot, line items with per-line discount/tax/margin, subtotal/discount/tax/shipping/adjustment/grand total, validity, terms, print view. | ✅ Built (exceeds requirement) |
| 3. Sales Order | **No `SalesOrder` entity.** Quote acceptance records `customerPoNumber` and links `convertedProjectId` — a `Project` is used as the de-facto order. | 🔴 Missing |
| 4. Delivery Note | No entity, no endpoint, no dispatch or packing concept. | 🔴 Missing |
| 5. Invoice | `Invoice` — created from an accepted quote (`POST /invoices/from-quote/:quoteId`), carries line items, totals, `amountPaid`, `balanceDue`, status lifecycle `draft → sent → unpaid → partially_paid → paid → overdue → void`. | ✅ Built |
| 6. Payment Receipt | `POST /invoices/:id/payments` increments `amountPaid` and recomputes `balanceDue` and status (`backend/src/modules/invoices/invoices.service.ts:164`). **There is no payment document** — no receipt number, payment date, payment mode, bank/cash account, reference number, or reversal. The only trace is an audit-log entry. | 🟡 Partial |

**Table mapping**

| Client table | MachineIQ | Status |
|---|---|---|
| `sales_quotation` | `Quote` | ✅ |
| `sales_order` | — | 🔴 |
| `delivery_note` | — | 🔴 |
| `sales_invoice` | `Invoice` | ✅ |
| `customer_payment` | denormalised counters on `Invoice` | 🟡 |

**Structural gap:** the Quote → Project jump skips the order layer. Without a `SalesOrder` there is
no order backlog, no order-versus-delivery position, no partial-delivery tracking, and the client's
"Pending orders" report (§3.6) cannot be produced. A `CustomerPayment` document is also a hard
prerequisite for AR and for the Finance module.

### 5.2 Purchase Module — 🔴 Missing (~10%)

| Client step | Status | Evidence / Gap |
|---|---|---|
| 1. Purchase Request | 🟡 Weakly related | `ProcurementItem` (`backend/src/schemas/procurement.schema.ts`) tracks a project-linked item through `pending_design_release → ready_for_procurement → ordered → partially_received → received`. It is a **readiness signal, not a requisition** — no requester, no approval, no quantity, no value, no budget code. |
| 2. RFQ | 🔴 Missing | No entity. |
| 3. Supplier Quotation | 🔴 Missing | No entity. No comparison/award logic. |
| 4. Purchase Order | 🔴 Missing | No entity. `ProcurementItem.status = 'ordered'` plus `orderDate` is a flag, not a PO: no PO number, no supplier commitment, no line items, no rates, no tax, no PO value, no amendment history. |
| 5. Goods Receipt | 🔴 Missing | `status = 'received'` is a flag. No GRN, no received quantity, no partial receipt lines, no inspection linkage, no stock posting. |
| 6. Supplier Invoice | 🔴 Missing | No entity. No three-way match (PO ↔ GRN ↔ Invoice). |
| 7. Payment | 🔴 Missing | No entity. No AP ageing. |

**Assessment:** MachineIQ's procurement module answers *"is this design released and therefore safe
to buy?"* The client's Purchase module answers *"what did we order, from whom, at what price, did it
arrive, and have we paid?"* These are complementary, not overlapping. **The entire purchasing
execution chain must be built.**

### 5.3 Inventory Module — 🔴 Missing (0%)

Nothing in the codebase addresses stock. There is no `Warehouse`, `StockTransaction`, `StockBalance`,
or `InventoryAdjustment` schema, no stock service, and no stock UI. None of Stock In, Stock Out,
Transfer, Adjustment, or Cycle Count exists.

**Hard prerequisites before this module can start:**
1. `Item` master (§4.5) — nothing can be stocked without a stocked item.
2. `Location`/`Warehouse` master (§4.1) — nothing can be stocked without somewhere to stock it.
3. UOM master with conversion factors — purchase UOM ≠ stock UOM ≠ issue UOM in machine building.
4. A costing/valuation decision (FIFO / weighted average / standard) — determines the transaction model.

**Warning — data integrity:** stock is the one module where an inconsistent write is unrecoverable
by hand. Every stock movement must be transactional across the transaction ledger and the balance
record. See §7.1 — this is the strongest single argument in favour of the client's PostgreSQL
recommendation.

### 5.4 Production Module — 🟡 Partial (~30%)

| Client step | MachineIQ equivalent | Status |
|---|---|---|
| BOM | ISA-88 tree: `Project → Machine → Unit → EquipmentModule → ControlModule → Component` (`backend/src/schemas/machine.schema.ts`, `component.schema.ts`). Reusable `MachineTemplate`. Components carry `partName`, `quantity`, `category`, `supplier`, `leadTimeWeeks`. | 🟡 Partial — this is an **engineering/design BOM**, not a manufacturing BOM. It has no item-master reference, no scrap allowance, no BOM version/revision, no effective dates, no alternates/substitutes, no phantom levels, and no routing. |
| Production Planning | — | 🔴 Missing |
| Work Order | — | 🔴 Missing. `Task` (design/review/approval/release/procurement_handover/follow_up) is engineering work, not shop-floor work. No `work_order`. |
| Material Issue | — | 🔴 Missing. Depends on Inventory. |
| Assembly | `Component.assemblyStatus` (`NotReady`/`Ready`/`Installed`) + `assemblyBlocked` + `assemblyReadyAt`. | 🟡 Partial — tracks assembly *readiness per component*, but there is no assembly operation, no operator, no time booking, no station/work centre. |
| Quality Check | — | 🔴 Missing (see §5.5) |
| Finished Goods | — | 🔴 Missing. No FG receipt, no serial/batch, no `production_output`. |

**Table mapping:** `bom_header` 🟡 (approximated by `Machine`), `bom_details` 🟡 (approximated by
`Component`), `work_order` 🔴, `production_issue` 🔴, `production_output` 🔴.

**Note on the client's emphasis:** the document flags this module as *"very important for gearbox and
assembly industries."* MachineIQ's component-level design-release-to-assembly chain is genuinely
strong here and is worth preserving; what is missing is everything downstream of *"the design is
ready"* — the actual manufacturing execution.

### 5.5 Quality Module — 🔴 Missing (~5%)

| Requirement | Status | Evidence / Gap |
|---|---|---|
| Incoming Inspection | 🔴 Missing | No entity. Would attach to Goods Receipt, which also does not exist. |
| In-Process Inspection | 🔴 Missing | No entity. Would attach to Work Order. |
| Final Inspection | 🟡 Very weakly related | `ProjectStage.FAT_SAT` exists as a stage label only — no inspection record, checklist, or result behind it. |
| NCR | 🔴 Missing | No non-conformance entity. |
| CAPA | 🔴 Missing | No corrective/preventive action entity. |

The nearest existing capability is the review/approval gate on components (`reviewerId`,
`reviewApprovedBy`, `reviewApprovedAt`, `ComponentDesignStatus.UNDER_REVIEW`) — that is **design
review, not quality inspection**. No measurement, no specification/tolerance, no pass/fail, no
inspection plan, no defect classification.

### 5.6 HR & Payroll — 🔴 Missing (~5%)

| Requirement | Status |
|---|---|
| Employee | 🟡 Partial — only the `User` login identity (§4.2). No employee master. |
| Attendance | 🔴 Missing |
| Leave | 🔴 Missing |
| Overtime | 🔴 Missing |
| Payroll | 🔴 Missing |

**Assessment:** this module has **zero overlap** with the current product and shares no data with it
beyond the person's name. It is separable and should be sequenced last (as the client's own
suggested sequence does, at position 9). It also carries the heaviest compliance burden — statutory
payroll, tax withholding, and personal-data protection obligations that no other module in this
document raises. See §10 Q7.

### 5.7 Finance Module — 🔴 Missing (~8%)

| Requirement | Status | Evidence / Gap |
|---|---|---|
| AR | 🟡 Partial | Invoice-level `amountPaid`/`balanceDue`/`overdue` status only. No customer ledger, no ageing buckets, no credit notes, no write-offs. |
| AP | 🔴 Missing | No supplier invoice, therefore nothing to pay. |
| GL | 🔴 Missing | No chart of accounts, no `account_head`. |
| Cash | 🔴 Missing | No cash book. |
| Bank | 🔴 Missing | No bank account entity, no bank book, no reconciliation. |
| Assets | 🔴 Missing | No fixed-asset register, no depreciation. |

**Table mapping:** `account_head` 🔴, `journal_entry` 🔴, `ledger` 🔴, `cash_book` 🔴, `bank_book` 🔴.

**Assessment:** there is no double-entry accounting anywhere in the product. Everything financial is
single-entry and denormalised onto the `Invoice` document. This is the module with the highest ratio
of *correctness risk to feature count* — a financial ledger that is wrong is worse than one that is
absent, and it must be transactional and immutable. See §7.1 and §10 Q6 (build vs. integrate).

---

## 6. Gap Analysis — Phases 3 to 6

### 6.1 Phase 3 — Database Architecture — ⚠️ Conflict

| Client requirement | Current state |
|---|---|
| PostgreSQL (recommended), SQL Server, or MySQL | **MongoDB** with Mongoose ODM, across 19 schemas |
| Master tables: `users`, `customers`, `suppliers`, `items`, `warehouses`, `employees` | `users` ✅, `customers` ✅, `suppliers` ✅ (thin), `items` 🔴, `warehouses` 🔴, `employees` 🔴 |
| Transaction tables: `sales_order`, `purchase_order`, `work_order`, `stock_transaction`, `journal_entry` | **All five missing.** The transaction backbone of the requested ERP does not exist. |
| Reference tables: `status`, `approval_levels`, `document_type` | `status` 🟡 (hardcoded TypeScript enums, not a table — not runtime-configurable); `approval_levels` 🔴; `document_type` 🔴 |

This is escalated to §7.1 as a decision requiring client sign-off.

### 6.2 Phase 4 — Workflow Engine — 🔴 Missing (~10%)

No `workflow_master`, `workflow_step`, or `workflow_history`. Approvals today are **hardcoded, per
module**:

- Opportunity: `under_review → feasibility_in_progress → approved/rejected` — fixed transitions in code
- Quote: `acceptedBy` / `acceptedAt` — single-step, no chain
- Component: `reviewerId` → `reviewApprovedBy` → released — single-step, no chain

Not one of them is configurable. There is no multi-level approval, no delegation, no escalation on
timeout, no conditional routing (e.g. by value threshold), and no approval-matrix administration.
The client's own worked example — *PR → Manager Approval → Purchase Manager Approval → PO Creation* —
is **not expressible** in the current system.

The nearest existing capability is `AuditLog`, which records every state change with actor, before
values, and after values. It is a good foundation for `workflow_history` but is a passive record, not
an engine.

**Dependency:** a configurable workflow engine needs the granular permission model from §4.2 to
define who sits at each approval level.

### 6.3 Phase 5 — Notification System — 🟡 Partial (~25%)

| Channel | Status | Evidence / Gap |
|---|---|---|
| Email Notification | 🔴 Missing | No mail transport in the dependency tree — no `nodemailer`, no `@sendgrid/mail`, no SMTP configuration anywhere in `backend/`. |
| Dashboard Alert | ✅ Built | `Notification` schema, `GET /notifications`, `GET /notifications/unread-count`, mark-read/mark-all-read, plus **real-time Socket.IO push** (`frontend/src/lib/socket.ts`). Per-type user preferences in settings. |
| Mobile Notification | 🔴 Missing | No FCM/APNs. No mobile app. The web UI is responsive (card views on mobile) but there is no push channel. |
| WhatsApp Integration | 🔴 Missing | No Twilio/WhatsApp Business API integration. |

**Trigger coverage:**

| Client example trigger | Status |
|---|---|
| PO approval pending | 🔴 No PO, no approval engine |
| Stock below minimum | 🔴 No stock, no reorder level |
| Machine maintenance due | 🔴 No maintenance/asset module — note this implies a **maintenance module the document never lists**; see §10 Q4 |
| Employee leave request | 🔴 No HR module |

**Built triggers not in the client list:** task/component assignment, task status change, due-date
reminder, overdue escalation, blocker raised, milestone at risk — driven by a background reminder
worker (`POST /components/projects/:projectId/process-reminders`).

**Assessment:** the *infrastructure* is sound (persistence, preferences, real-time delivery, a
working reminder worker). What is missing is (a) three of four delivery channels and (b) all four of
the client's example triggers, each of which depends on a module that does not exist. Adding email
is a small, self-contained change; the triggers are not.

### 6.4 Phase 6 — Reporting System — 🟡 Partial (~20%)

**Built:** six aggregation endpoints (`backend/src/modules/dashboard/dashboard.service.ts`) —
executive, project, department, procurement, machines, project-components — surfaced as five
role-scoped dashboard views (`frontend/src/app/(app)/dashboard/_views/`).

| Domain | Report | Status | Blocker |
|---|---|---|---|
| Sales | Sales by customer | 🟡 Partial | Invoice data exists; no aggregation endpoint, no report UI |
| Sales | Sales by month | 🟡 Partial | Same |
| Sales | Pending orders | 🔴 Missing | No `SalesOrder` entity (§5.1) |
| Purchase | Supplier performance | 🔴 Missing | No PO/GRN history to measure against |
| Purchase | Open PO | 🔴 Missing | No PO entity |
| Inventory | Stock valuation | 🔴 Missing | No stock, no item cost |
| Inventory | ABC analysis | 🔴 Missing | Same |
| Inventory | Slow moving items | 🔴 Missing | Same |
| Production | Work order status | 🔴 Missing | No work order |
| Production | Material consumption | 🔴 Missing | No material issue |
| Production | Productivity | 🔴 Missing | No time booking |
| Finance | Trial balance | 🔴 Missing | No GL |
| Finance | P&L | 🔴 Missing | No GL |
| Finance | Balance sheet | 🔴 Missing | No GL |

**2 of 14 client reports are partially achievable today. 12 are blocked on absent modules.**

Also absent regardless of module: a report scheduler, PDF/Excel export of reports (XLSX is currently
used only for *importing* customers and machines), saved report definitions, and report-level access
control.

---

## 7. Architectural Decisions Requiring Client Sign-Off

These three decisions gate everything else. No estimate, plan, or build should start before they are
settled.

### 7.1 ⚠️ DECISION 1 — Database platform: MongoDB (current) vs PostgreSQL (client recommendation)

> **Decision recorded 2026-08-28:** PostgreSQL is accepted as the single MachineIQ ERP system of
> record beginning with Release 1/v2.1. The existing MongoDB application and data will be migrated
> before release certification; a dual-write production architecture is explicitly excluded. See
> `docs/architecture-decisions/ADR-001-postgresql-system-of-record.md`.

**The conflict:** the client document recommends PostgreSQL. MachineIQ runs MongoDB across 19
schemas, with `populate()`-based relational traversal.

**Why the client's recommendation has real merit for the requested scope:**
- Financial ledgers and stock transactions require **multi-document ACID transactions** as the norm,
  not the exception.
- Double-entry accounting is inherently relational; a trial balance is a join and a sum.
- Referential integrity between `stock_transaction` → `item` → `warehouse` must be enforced by the
  database, not by application code.

**Why MongoDB is the right fit for what already exists:**
- The ISA-88 machine breakdown is a deep, ragged, variable-depth tree — a natural document fit.
- Quote/invoice **snapshots** (customer and organisation state frozen at issue time) are natural
  documents and would be awkward as normalised tables.
- Opportunity intake carries a wide, sparse, evolving field set.

**Options:**

| Option | Description | Consequence |
|---|---|---|
| **A. Stay on MongoDB** | Use multi-document transactions (requires a replica set — MongoDB Atlas already provides this) for stock and finance. | Lowest disruption. Requires disciplined transaction handling in every financial/stock write path. Accepts weaker referential integrity. |
| **B. Full migration to PostgreSQL** | Rewrite all 19 schemas, all services, all queries. | 3–4 months of rebuild with **zero new client-visible features**. Highest risk. Not recommended. |
| **C. Polyglot (recommended)** | Keep engineering execution on MongoDB. Put Finance, Inventory, and Purchase transaction tables on PostgreSQL. | Correct tool per domain; matches the client's intent where it matters most. Cost: two datastores to operate, plus a defined sync/reference contract at the boundary. |
| **D. Defer** | Build Master Data and Sales gaps on MongoDB now; decide before Inventory/Finance start. | Preserves momentum, keeps the decision open until the modules that actually force it. |

**Recommendation: D now, C at the Inventory/Finance boundary.** Nothing in Phases 1–2 Sales forces a
platform change; Inventory and Finance do.

### 7.2 ⚠️ DECISION 2 — Product identity: ERP vs. engineering execution platform

MachineIQ is currently positioned (per `productspec.md` v1.0) as an OEM machine execution platform.
The client document describes a general manufacturing ERP.

| Option | Description |
|---|---|
| **A. Full ERP** | Build all seven modules. Largest scope; MachineIQ competes with Odoo/SAP B1/Tally on their ground. |
| **B. Execution platform + ERP integration** | Build only the master-data and sales gaps; **integrate** with the client's existing ERP for Finance, HR, Inventory, and Purchase. Smallest scope, fastest value. |
| **C. Vertical ERP for machine builders (recommended)** | Build the modules where MachineIQ's engineering depth is a differentiator — Purchase, Inventory, Production, Quality — and **integrate or defer** the commodity modules (Finance, HR & Payroll). |

**Recommendation: C.** The engineering middle is where MachineIQ is already ahead of a generic ERP.
Finance and Payroll are commodity, compliance-heavy, and better bought than built. This must be
confirmed with the client — see §10 Q6 and Q7.

### 7.3 ⚠️ DECISION 3 — Single-tenant vs multi-tenant

Recorded, unchanged, from `docs/specs/2026-08-25-oem-setup-registration-design.md`: **MachineIQ is
single-tenant.** No `Organization`/`Tenant` entity exists, and no collection is tenant-scoped.

The client's Company Master (with Branches and Locations) is an *intra-company* structure, not
multi-tenancy — so it does **not** by itself force a change. But if MachineIQ is to be sold as SaaS
to multiple OEMs from one deployment, tenant-scoping every collection is a foundational change that
gets exponentially more expensive with each module added. **If multi-tenancy is ever wanted, decide
before the ERP build starts, not after.** See §10 Q5.

---

## 8. Proposed Data Model Additions

Entity names follow the client's table naming where given, mapped to MachineIQ's `camelCase`
convention. All new entities inherit the existing platform conventions: soft-delete via `deletedAt`,
`AuditLog` entry on every mutation, `class-validator` DTOs at the API boundary, and
`@Roles()` + `RolesGuard` on every endpoint.

### 8.1 Master data

| Entity | Key fields | Priority |
|---|---|---|
| `Item` | `code` (unique), `name`, `description`, `categoryId`, `uomId`, `itemType` (raw/component/assembly/service), `standardCost`, `sellingPrice`, `hsnSac`, `taxPercent`, `isStockItem`, `reorderLevel`, `defaultSupplierId`, `leadTimeDays` | **P0 — blocks 4 modules** |
| `ItemCategory` | `code`, `name`, `parentId` (hierarchy) | P0 |
| `Uom` | `code`, `name`, `baseUomId`, `conversionFactor` | P0 |
| `Warehouse` | `code`, `name`, `branchId`, `locationId`, `type`, `isActive` | P0 (Inventory) |
| `Location` | `code`, `name`, `branchId`, `address` | P1 |
| `Branch` | `code`, `name`, `address`, `taxRegistrationNumber` | P1 |
| `Employee` | `employeeCode`, `userId` (nullable link), `joinDate`, `designation`, `departmentId`, `reportingManagerId`, `grade`, `costRate`, `employmentStatus` | P2 (HR) |
| `Permission` | `code`, `module`, `action`, `description` | P1 (workflow prerequisite) |
| `RolePermission` | `roleId`, `permissionId` | P1 |

**Extensions to existing entities:**

| Entity | Add |
|---|---|
| `Customer` | `code` (unique, sequential) |
| `Supplier` | `code` (unique), `paymentTerms`, `taxRegistrationNumber`, `currencyCode`, `bankDetails`, `qualificationStatus`, `defaultLeadTimeDays` |
| `Component` | `itemId` — links the engineering BOM to the item master (**the keystone link of the whole expansion**) |

### 8.2 Sales

| Entity | Notes | Priority |
|---|---|---|
| `SalesOrder` | From accepted `Quote`. Order no., customer, lines (itemId, qty, rate, tax), delivery schedule, `orderStatus`, links to `projectId`. | P0 |
| `DeliveryNote` | From `SalesOrder`. Dispatch date, delivered lines with quantities, carrier, LR/AWB. Supports partial delivery. | P1 |
| `CustomerPayment` | Receipt no., date, customer, mode (cash/bank/cheque/UPI/other), reference, amount, allocation across one or more invoices, reversal support. | P0 |

### 8.3 Purchase

| Entity | Notes | Priority |
|---|---|---|
| `PurchaseRequest` | Requester, department, project, lines, justification, workflow state. Bridges from `ProcurementItem`. | P0 |
| `Rfq` | From PR. Supplier list, response due date. | P1 |
| `SupplierQuotation` | Against RFQ. Lines, rates, lead time, validity, comparison + award. | P1 |
| `PurchaseOrder` | PO no., supplier, lines, rates/tax/totals, delivery schedule, terms, amendment history, workflow state. | P0 |
| `GoodsReceipt` | Against PO. Received quantities per line, inspection link, posts to stock. | P0 |
| `PurchaseInvoice` | Three-way match: PO ↔ GRN ↔ Invoice. | P1 |
| `SupplierPayment` | Mirrors `CustomerPayment`, on the AP side. | P1 |

### 8.4 Inventory

| Entity | Notes | Priority |
|---|---|---|
| `StockTransaction` | Immutable ledger: `itemId`, `warehouseId`, `type` (in/out/transfer/adjustment), `qty`, `rate`, `value`, `refType`, `refId`, `transactionDate`. Append-only. | P0 |
| `StockBalance` | Derived running balance per `(itemId, warehouseId)`: `qtyOnHand`, `qtyReserved`, `qtyAvailable`, `valuationRate`. **Must be written in the same transaction as `StockTransaction`.** | P0 |
| `InventoryAdjustment` | Reason-coded adjustment header with lines; generates stock transactions. | P1 |
| `CycleCount` | Count sheet, counted vs system qty, variance, approval, generates adjustments. | P2 |

### 8.5 Production

| Entity | Notes | Priority |
|---|---|---|
| `BomHeader` | `itemId`, `version`, `effectiveFrom/To`, `status`, `quantity`. Derivable from `Machine` + `MachineTemplate`. | P1 |
| `BomDetail` | `bomHeaderId`, `itemId`, `qty`, `uomId`, `scrapPercent`, `alternateItemIds`, `operationSeq`. Derivable from `Component` once `Component.itemId` exists. | P1 |
| `WorkOrder` | `itemId`, `bomHeaderId`, `qty`, `plannedStart/End`, `status`, `projectId`, `machineId`. | P1 |
| `ProductionIssue` | Material issued to a work order; generates stock-out transactions. | P1 |
| `ProductionOutput` | FG receipt against a work order; generates stock-in transactions. Optional serial/batch. | P1 |

### 8.6 Quality

| Entity | Notes | Priority |
|---|---|---|
| `InspectionPlan` | Per item: characteristics, specifications, tolerances, sampling plan. | P2 |
| `QualityCheck` | Type (incoming/in-process/final), reference (GRN / work order / project), result, inspector, date. | P2 |
| `InspectionReport` | Measured values against the plan; pass/fail per characteristic. | P2 |
| `Ncr` | Non-conformance: source, defect classification, disposition (use-as-is/rework/reject/return), cost. | P2 |
| `Capa` | Root cause, corrective action, preventive action, owner, due date, effectiveness verification. | P2 |

### 8.7 Finance

| Entity | Notes | Priority |
|---|---|---|
| `AccountHead` | Chart of accounts: `code`, `name`, `type` (asset/liability/income/expense/equity), `parentId`, `isGroup`. | P2 |
| `JournalEntry` + `JournalLine` | Double-entry. Debits must equal credits — enforced atomically. Immutable once posted; corrections by reversal only. | P2 |
| `Ledger` | Derived per-account running balance. | P2 |
| `CashBook` / `BankBook` | Views over journal entries filtered by account type; bank reconciliation state. | P2 |
| `FixedAsset` | Asset register, acquisition, depreciation schedule, disposal. | P3 |

### 8.8 Workflow & reference

| Entity | Notes | Priority |
|---|---|---|
| `WorkflowMaster` | `documentType`, `name`, `isActive`, trigger conditions (e.g. value thresholds). | P1 |
| `WorkflowStep` | `workflowId`, `sequence`, `approverRole`/`approverUserId`, `condition`, `slaHours`, `escalateTo`. | P1 |
| `WorkflowHistory` | `documentType`, `documentId`, `stepId`, `action`, `actor`, `comment`, `timestamp`. Extends the existing `AuditLog` pattern. | P1 |
| `DocumentType` | Numbering series per document: prefix, padding, reset frequency, next number. Generalises the existing `quotePrefix`/`quoteNumberPadding` settings. | P1 |
| `ApprovalLevel` | Named approval tiers referenced by `WorkflowStep`. | P1 |
| `StatusMaster` | Runtime-configurable statuses. ⚠️ **Assess carefully** — MachineIQ's status enums drive typed business logic (dependency propagation, release gating). Making them data-driven weakens type safety. Recommend keeping engineering statuses as enums and making only the new ERP document statuses configurable. | P2 |

---

## 9. Proposed Delivery Roadmap

The client's suggested sequence (§3.7) is a **greenfield** sequence — correct for building an ERP
from nothing. MachineIQ is not greenfield: Login/User Management and much of Sales already exist,
and the engineering core is the most valuable thing in the product.

The sequence below preserves the client's dependency logic (masters before transactions, inventory
before purchase/production) while starting from what is already built and delivering a usable
increment at every release.

> **Guiding principle, carried forward from `docs/specs/2026-04-19-gap-analysis-and-roadmap.md`:**
> build each phase to be fully usable on its own before starting the next.

### v2.1 — Master Data Foundation
*Unblocks everything. Nothing downstream can start without it.*

- `Item`, `ItemCategory`, `Uom` masters — migrate the settings-JSON `items`/`units` arrays into real collections
- `Customer.code` and `Supplier.code` — sequential, unique, human-readable
- `Supplier` extension: payment terms, tax registration, currency, bank details, lead-time defaults
- `Branch` and `Location` masters; promote the company profile from settings JSON to a `Company` entity
- `Permission` / `RolePermission` — granular permission model layered over the existing `Role` enum
- `DocumentType` numbering series — generalised from the existing quote numbering
- **`Component.itemId`** — link the engineering BOM to the item master *(the keystone of the entire expansion)*

**Release value:** master data is complete and governed. Existing features keep working unchanged.

### v2.2 — Sales Completion
*Closes the biggest gap in the module that is already furthest along.*

- `SalesOrder` — created on quote acceptance, sits between `Quote` and `Project`
- `CustomerPayment` — proper receipt document with mode, reference, date, and multi-invoice allocation
- `DeliveryNote` — dispatch against a sales order, with partial-delivery support
- Reports: Sales by customer, Sales by month, Pending orders
- Email notification channel (`nodemailer` + SMTP config) — small, self-contained, unblocks every future trigger

**Release value:** a complete, auditable order-to-cash cycle. Three of the client's fourteen reports delivered.

### v2.3 — Workflow Engine
*Must land before Purchase — the client's own worked example is a purchase approval chain.*

- `WorkflowMaster`, `WorkflowStep`, `WorkflowHistory`, `ApprovalLevel`
- Configurable multi-level approvals with conditional routing (value thresholds, department)
- SLA timers, escalation on timeout, delegation
- Approval-matrix admin UI
- Retrofit the existing hardcoded approvals (opportunity, quote, component release) onto the engine

**Release value:** approvals become configurable by the client without code changes.

### v2.4 — Inventory Foundation
*⚠️ Gate: §7.1 database decision must be settled before this release starts.*

- `Warehouse`, `StockTransaction` (immutable ledger), `StockBalance` (derived)
- Stock In / Out / Transfer / Adjustment
- `InventoryAdjustment` with reason codes; `CycleCount`
- Valuation (basis per §10 Q3), reorder levels, low-stock notification trigger
- Reports: Stock valuation, ABC analysis, Slow moving items

**Release value:** real stock control. Three more client reports delivered.

### v2.5 — Purchase Execution
*Builds on Inventory (GRN posts stock) and Workflow (PR/PO approvals).*

- `PurchaseRequest` — evolved from today's `ProcurementItem`, preserving the design-release gate
- `Rfq`, `SupplierQuotation` with comparison and award
- `PurchaseOrder` with amendment history
- `GoodsReceipt` — posts to stock, links to incoming inspection
- `PurchaseInvoice` with three-way match; `SupplierPayment`
- Reports: Open PO, Supplier performance

**Release value:** complete procure-to-pay. MachineIQ's design-release gate now controls a real PO.

### v3.0 — Production & Quality
*Where MachineIQ's engineering depth becomes a genuine differentiator.*

- `BomHeader`/`BomDetail` — versioned manufacturing BOM generated from the ISA-88 tree
- `WorkOrder`, `ProductionIssue`, `ProductionOutput`
- Production planning and scheduling
- `InspectionPlan`, `QualityCheck`, `InspectionReport`, `Ncr`, `Capa`
- Reports: Work order status, Material consumption, Productivity

**Release value:** design-to-manufacture in one system — the strongest competitive position in this plan.

### v3.1 — Finance
*⚠️ Gate: §10 Q6 — build vs. integrate must be answered first.*

- `AccountHead` (chart of accounts), `JournalEntry`/`JournalLine` (double-entry, immutable)
- Auto-posting from invoices, payments, GRNs, and stock movements
- `Ledger`, `CashBook`, `BankBook`, bank reconciliation
- AR/AP ageing; `FixedAsset` register with depreciation
- Reports: Trial balance, P&L, Balance sheet

### v3.2 — HR & Payroll
*⚠️ Gate: §10 Q7 — statutory jurisdiction and build-vs-integrate must be answered first.*

- `Employee` master, separated from the `User` login identity
- Attendance, leave, overtime
- Payroll processing with statutory compliance for the confirmed jurisdiction

### Cross-cutting, delivered continuously

- Mobile push and WhatsApp notification channels (after email lands in v2.2)
- Report export (PDF/Excel), scheduling, and saved report definitions
- Multi-branch scoping on transactions (once `Branch` exists in v2.1)

### Sequencing rationale vs. the client's suggested order

| Client's step | This roadmap | Why |
|---|---|---|
| 1. Login & User Management | Already built | Delivered in v0.x — only the granular permission layer is added, in v2.1 |
| 2. Master Data | v2.1 | Agreed — it is the true blocker |
| 3. Inventory | v2.4 | Moved later: it is gated on the §7.1 database decision, whereas Sales completion is not gated at all and delivers value sooner |
| 4. Purchase | v2.5 | Agreed — after Inventory, as the client sequenced it |
| 5. Sales | v2.2 | Moved earlier: ~50% already built, so it is the cheapest complete module and delivers reports fastest |
| 6. Finance | v3.1 | Moved later: highest correctness risk, and a strong integrate-rather-than-build candidate |
| 7. Production | v3.0 | Moved earlier than Finance: this is MachineIQ's differentiator |
| 8. Quality | v3.0 | Paired with Production — they share the work-order reference |
| 9. HR | v3.2 | Agreed — zero overlap with the existing product, fully separable |
| 10. Dashboards & Reports | Continuous | Not a final phase: each release ships its own reports, so value is never deferred to the end |

---

## 10. Open Questions for the Client

These block estimation. None should be answered by assumption.

| # | Question | Blocks |
|---|---|---|
| **Q1** | The source document contains `Show more lines` (Phase 3, Reference Tables) and `Plain Text` (Quality module, first table). Both appear to be paste artefacts. Please confirm no requirement is hidden behind them — particularly whether the Reference Tables list was truncated. | Scope completeness |
| **Q2** | Is this a **replacement** for an existing ERP, or a greenfield system? If an ERP is already in place, which system, and what must be migrated or integrated? | §7.2, migration scope |
| **Q3** | **Inventory valuation method** — FIFO, weighted average, or standard cost? This determines the entire `StockTransaction` model and cannot be changed cheaply later. | v2.4 |
| **Q4** | The Phase 5 notification examples include *"machine maintenance due"*, which implies a **maintenance/asset management module that no phase in the document defines**. Is maintenance in scope? | Scope, v3.x |
| **Q5** | Will MachineIQ serve **one company** or be sold as SaaS to **many OEMs from one deployment**? Multi-tenancy is foundational and must be decided before the ERP build starts. | §7.3, everything |
| **Q6** | **Finance: build or integrate?** A full double-entry GL with statutory reporting is 3–4 months of high-risk work that a mature accounting package already solves. Would integration with an existing accounting system (Tally, Zoho Books, QuickBooks, SAP B1) be acceptable? | §7.2, v3.1 |
| **Q7** | **HR & Payroll: build or integrate?** Payroll is jurisdiction-specific and compliance-heavy. Which country's statutory rules apply (PF/ESI/TDS for India, or another jurisdiction)? | §7.2, v3.2 |
| **Q8** | **Database platform** — see §7.1. Is the PostgreSQL recommendation a firm requirement, or a technical suggestion open to the polyglot option? | §7.1, v2.4 onward |
| **Q9** | **Branch/location model** — how many branches and locations, and must transactions (stock, sales, purchase) be branch-scoped with inter-branch transfers? | v2.1, v2.4 |
| **Q10** | **Mobile scope** — does "Mobile Notification" mean a responsive web app with browser push, or a native iOS/Android application? | v2.2+, effort |
| **Q11** | **Serial/batch tracking** — for gearbox and assembly work, do finished goods and critical components need serial-number or batch traceability? This materially affects the Inventory and Production models. | v2.4, v3.0 |
| **Q12** | Does the **ISA-88 machine breakdown structure** — MachineIQ's deepest existing capability, not mentioned anywhere in the client document — remain a requirement? Confirming this protects delivered value from being dropped as out-of-scope. | Product direction |

---

## 11. Risk Register

| # | Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|---|
| R1 | **Scope**: the document describes ~4× the current product's scope. Attempting all of it at once produces a half-built ERP. | High | High | Phased roadmap (§9); every release independently usable. |
| R2 | **Data integrity**: stock and financial writes that are not atomic corrupt balances irrecoverably. | Critical | Medium | Settle §7.1 before v2.4. Multi-document transactions mandatory on every stock/finance write path. |
| R3 | **Item master retrofit**: `Component.itemId` links a live engineering tree to a new master. Existing project data must be back-filled. | High | High | Migration script with a dry-run mode; back-fill before any dependent module ships. |
| R4 | **Regression**: seven new modules touching shared masters can break the working engineering core. | High | Medium | Extend the existing Jest + Playwright suites per release. Clear the 4 known-failing `workflows.spec.ts` tests before v2.1 so the baseline is green. |
| R5 | **Compliance**: payroll and statutory financial reporting carry legal obligations. | High | Medium | Prefer integration over build (Q6, Q7). If built, budget for external compliance review. |
| R6 | **Identity dilution**: becoming a generic ERP forfeits MachineIQ's engineering-depth differentiator. | Medium | Medium | Decision §7.2 option C — vertical ERP for machine builders. |
| R7 | **Performance**: MongoDB `populate()` chains across a growing entity count degrade under ERP-scale data volumes. | Medium | Medium | Index review each release; move reporting to aggregation pipelines or a read model. |
| R8 | **Client document ambiguity**: 458 words specifying seven ERP modules leaves most business rules undefined. | High | High | §10 must be answered before estimation. Each module needs its own detailed spec before build. |

---

## 12. Appendix A — Current-State Inventory (as of 2026-08-27)

**Backend** — NestJS, 20 modules, 19 schemas:

`audit-log`, `auth`, `components`, `customers`, `dashboard`, `deliverables`, `departments`,
`discussion`, `documents`, `invoices`, `machines`, `machine-templates`, `notifications`,
`opportunities`, `procurement`, `projects`, `quotes`, `settings`, `tasks`, `users`

Schemas: `audit-log`, `component`, `customer`, `deliverable`, `department`, `dependency`,
`discussion`, `document`, `invoice`, `machine`, `machine-template`, `notification`, `opportunity`,
`procurement` (incl. `Supplier`), `project`, `quote`, `settings`, `task`, `user`

**Frontend** — Next.js 14 App Router, 30 pages. Navigation: Dashboard, Machine Inquiries, Customers,
Quotes, Projects, Tasks, Procurement, Invoices, plus admin (Users, Settings) and help sections.

**Stack:** Next.js 14 + Tailwind · NestJS · MongoDB/Mongoose · Socket.IO · JWT + RBAC

**Security posture (already production-grade):** helmet, throttling (120/min global, 5/min login,
3/min register), JWT with startup secret validation, server-side RBAC on every endpoint,
`ValidationPipe` with `whitelist` + `forbidNonWhitelisted`, NoSQL-injection guards on all enum and
ObjectId inputs, `AllExceptionsFilter` preventing stack-trace leakage, CORS origin whitelist, bcrypt
@ 12 rounds, soft-delete throughout, mass-assignment protection on all PATCH DTOs.

**Known accepted risks (carried forward from `CLAUDE.md`):** JWT in `localStorage` (XSS exposure);
8-hour token expiry without a refresh flow.

**Test baseline:** Backend Jest unit tests. Frontend Playwright E2E. 4 known pre-existing failures in
`workflows.spec.ts` (8 runs across desktop + mobile) for page sections not yet fully implemented.

---

## 13. Appendix B — Document Handling

**This specification and its source (`Dashboard.docx`) are client-confidential.**

- `Dashboard.docx` is stored at `docs/customer-references/Dashboard.docx`. The repository currently
  has no commits, so release traceability and client-document handling must be established before
  the first release commit.
- Do not upload either document to external services, LLM tools, or file-sharing platforms without
  explicit client authorisation.
- Distribution is internal only.

---

## 14. Version History

| Version | Date | Author | Change |
|---|---|---|---|
| v1.0 | 2026-04-19 | Internal | `productspec.md` — OEM Machine Execution Platform specification |
| v1.1 | 2026-04-19 | Internal | `docs/specs/2026-04-19-gap-analysis-and-roadmap.md` |
| v1.2 | 2026-05-29 | Internal | `docs/specs/2026-05-29-production-flow-implementation-spec.md` |
| v1.3 | 2026-08-25 | Internal | `docs/specs/2026-08-25-oem-setup-registration-design.md` |
| **v2.0** | **2026-08-27** | **Internal** | **This document — ERP scope expansion analysed against client `Dashboard.docx`. Extends v1.0; does not replace it.** |

---

*End of specification.*
