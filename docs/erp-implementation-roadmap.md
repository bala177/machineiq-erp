# MachineIQ ERP Implementation Roadmap

## 1. Objective

This is the first-pass execution plan derived from the ERP expansion specification in [MachineIQ-ERP-Spec-v2.0.md](../MachineIQ-ERP-Spec-v2.0.md). It focuses on delivering an incremental, releasable ERP path without breaking the existing engineering platform.

## 2. Working assumptions

- Current product remains the engineering execution platform.
- ERP scope is expanded, not replaced.
- The company should remain single-tenant unless a SaaS decision is explicitly made.
- PostgreSQL is the single system of record from Release 1. MongoDB is migrated and removed from the released runtime; no dual-write production phase is permitted.
- Finance and HR/Payroll are strong integration candidates unless the client explicitly requires a build.

## 3. Critical decisions to resolve before sprint planning

### Decision A — Database platform — resolved 2026-08-28
- PostgreSQL is approved for the complete MachineIQ ERP system of record from Release 1.
- The existing MongoDB data and execution-platform modules must be migrated before Release 1 certification.
- See `docs/architecture-decisions/ADR-001-postgresql-system-of-record.md`.

### Decision B — Product identity
- Recommended: vertical ERP for machine builders
- Keep MachineIQ differentiated by engineering depth, purchase, inventory, and production capability

### Decision C — Finance and HR build vs integrate
- Recommended: integrate existing accounting and payroll systems unless the client explicitly requires full in-house ownership

### Decision D — Multi-tenancy
- Must be decided before ERP scale-up if SaaS is a requirement

## 4. Delivery sequence

## Release v2.1 — PostgreSQL and Master Data Foundation

Priority: P0

### Goal
Create the PostgreSQL system of record and shared master-data layer that every downstream ERP module depends on.

### Epic 0: PostgreSQL cutover
- Add versioned PostgreSQL migrations with schema synchronization disabled
- Migrate every existing MongoDB-backed domain and preserve API contracts
- Convert ObjectId relationships to UUID foreign keys with legacy-ID reconciliation
- Provide dry-run, apply, validation, backup, restore, and rollback procedures
- Remove MongoDB from the released runtime after cutover validation

### Epic 1: Item master foundation
- Create `Item` collection
- Create `ItemCategory` collection
- Create `Uom` collection
- Migrate settings-based items and units into real collections
- Add item code and unique validation
- Add cost, price, reorder level, and supplier defaults

### Epic 2: Company and location structure
- Promote company profile from settings JSON into a real `Company` entity
- Add `Branch` entity
- Add `Location` entity
- Add location and branch references to the master data model

### Epic 3: Supplier and customer completeness
- Add `Customer.code` with sequence/unique rules
- Add `Supplier.code` with sequence/unique rules
- Add payment terms, tax registration, currency, bank details, and lead-time defaults

### Epic 4: permission model
- Create `Permission` entity
- Create `RolePermission` entity
- Add permission checks alongside the existing role model
- Replace hardcoded approval assumptions with permission-aware flow metadata

### Epic 5: document numbering
- Generalize quote numbering into `DocumentType`
- Support configurable prefixes and sequence resets
- Tie numbering to document types used across sales and purchase

### Epic 6: engineering BOM linkage
- Add `Component.itemId`
- Backfill existing components with item linkage where possible
- Validate that every production-relevant component has the correct item master association

### Definition of done
- All master data entities exist and support CRUD
- Data migration is tested and reversible
- Existing product flows remain stable
- Reports and downstream modules can build on the data model without brittle JSON lookup logic
- PostgreSQL is the only released runtime database and all migrated data reconciles
- No runtime Mongoose imports, models, ObjectId validation, or MongoDB deployment configuration remain

---

## Release v2.2 — Sales Completion

Priority: P0

### Goal
Close the order-to-cash gap and deliver a working commercial flow.

### Epic 1: Sales order lifecycle
- Add `SalesOrder` entity
- Map accepted quote into a sales order
- Add order number, statuses, lines, totals, and delivery schedule
- Link orders to project data where applicable

### Epic 2: Customer payment
- Add `CustomerPayment` document
- Support payment mode, reference number, allocation across invoices, and reversal support
- Recompute invoice balances and status correctly

### Epic 3: Delivery note
- Add `DeliveryNote`
- Support dispatch quantities and partial delivery
- Attach delivery data to a sales order and invoice flow

### Epic 4: business reporting
- Sales by customer
- Sales by month
- Pending orders

### Epic 5: email notification channel
- Add SMTP mail transport
- Add notification templates for sales and approval events
- Support email notifications for pending approvals and customer actions

### Definition of done
- Sales order is a true first-class document
- Order-to-cash flow is auditable
- Payment and delivery records are separate, not denormalized counters
- Three client-facing sales reports are available

---

## Release v2.3 — Workflow Engine

Priority: P1

### Goal
Add configurable approval chains before purchase execution becomes real.

### Epic 1: workflow metadata
- Create `WorkflowMaster`
- Create `WorkflowStep`
- Create `WorkflowHistory`
- Create `ApprovalLevel`
- Add `DocumentType` reference for workflow triggers

### Epic 2: workflow execution engine
- Support multi-step approval routes
- Support conditional routing by value threshold or department
- Add timeout and escalation logic
- Add delegation support

### Epic 3: process retrofit
- Move current approval logic for opportunities, quotes, and component release into the workflow engine
- Preserve the existing engineering audit trail through workflow history entries

### Epic 4: admin workflow management
- Create admin UI for workflow configuration
- Add status and approval-matrix management

### Definition of done
- Approval chains are configurable without code changes
- Workflow actions are visible in audit history
- Workflow engine supports at least one multi-step purchase flow

---

## Release v2.4 — Inventory Foundation

Priority: P0

### Goal
Add the stock ledger and movement model needed for real goods movement.

### Gate before start
- Database decision must be resolved
- Inventory valuation method must be confirmed

### Epic 1: warehouse and location system
- Create `Warehouse` collection
- Support branch and location scope
- Support warehouse types and statuses

### Epic 2: stock ledger
- Create `StockTransaction`
- Immutable append-only structure
- Capture item, warehouse, type, quantity, rate, value, and references

### Epic 3: running balances
- Create `StockBalance`
- Maintain balances per item and warehouse
- Write stock transaction + balance update in the same transaction

### Epic 4: stock movement features
- Stock in
- Stock out
- Transfer
- Adjustment
- Cycle count

### Epic 5: inventory reporting
- Stock valuation
- ABC analysis
- Slow moving items

### Definition of done
- Every stock movement is transactional
- Balance integrity is preserved
- Reorder level triggers can be generated
- Stock reports are accurate enough for operational decisions

---

## Release v2.5 — Purchase Execution

Priority: P0

### Goal
Implement the procure-to-pay flow on top of the inventory and workflow foundations.

### Epic 1: requisition and RFQ
- Create `PurchaseRequest`
- Evolve current procurement readiness data into a requisition model
- Add `Rfq` and supplier outreach flow

### Epic 2: supplier quote and award
- Create `SupplierQuotation`
- Add comparison and award logic
- Support line-level price, lead time, and validity checks

### Epic 3: purchase order
- Create `PurchaseOrder`
- Add PO number, supplier, line items, tax, totals, and amendment history
- Link PO to workflow approvals

### Epic 4: goods receipt and stock posting
- Create `GoodsReceipt`
- Support partial receipts
- Post stock in on receipt
- Support inspection linkage

### Epic 5: supplier invoice and payment
- Create `PurchaseInvoice`
- Add three-way match against PO and GRN
- Create `SupplierPayment` with AP allocation

### Epic 6: reporting
- Open PO report
- Supplier performance report

### Definition of done
- Request-to-pay flow is complete
- Acquisition risk is reduced by workflow approval and three-way matching
- Purchase execution integrates with inventory posting

---

## Release v3.0 — Production and Quality

Priority: P1

### Goal
Leverage existing engineering depth to create a machine-builder production system.

### Epic 1: manufacturing BOM
- Create `BomHeader`
- Create `BomDetail`
- Derive from the existing ISA-88 machine structure and component tree
- Add versioning and effective dates

### Epic 2: work order planning
- Create `WorkOrder`
- Add item, BOM, quantity, schedule, project, and machine reference

### Epic 3: production issue and output
- Create `ProductionIssue`
- Create `ProductionOutput`
- Link material movement to inventory transactions

### Epic 4: quality control
- Create `InspectionPlan`
- Create `QualityCheck`
- Create `InspectionReport`
- Create `Ncr`
- Create `Capa`

### Epic 5: production analytics
- Work order status
- Material consumption
- Productivity

### Definition of done
- MachineIQ can track design-to-manufacture rather than only design-to-procurement
- Quality and production share one source of truth with downstream inventory and purchasing

---

## Release v3.1 — Finance

Priority: P2

### Goal
Add accounting ledger capability, but only after the business decision on build vs integrate is made.

### Recommended default
Integrate with an external accounting system unless the client requires a full in-house ledger.

### Epic 1: chart of accounts
- Create `AccountHead`
- Support account groups and hierarchy

### Epic 2: double-entry ledger
- Create `JournalEntry` and `JournalLine`
- Enforce debit/credit balancing and immutability

### Epic 3: reporting
- Trial balance
- P&L
- Balance sheet

### Epic 4: AR/AP and reconciliation
- Ageing buckets
- Cash and bank book views
- Fixed asset register

### Definition of done
- Account postings are mathematically consistent
- Reporting is audit-grade and externally explainable

---

## Release v3.2 — HR and Payroll

Priority: P3

### Goal
Provide employee, attendance, leave, and payroll functionality only when requirements and compliance are fully defined.

### Epic 1: employee master
- Separate `Employee` from `User`
- Add employee code, designation, reporting structure, and employment status

### Epic 2: attendance and leave
- Attendance tracking
- Leave management
- Overtime capture

### Epic 3: payroll
- Salary calculation
- Statutory withholdings
- Jurisdiction-specific compliance rules

### Definition of done
- HR and payroll are legally compliant for the chosen jurisdiction
- User identities remain separate from employee records

---

## 5. First sprint backlog

### Sprint 1 — Master data foundation
- Item master CRUD
- ItemCategory CRUD
- UOM CRUD
- Customer code generation
- Supplier code generation
- Migrate settings arrays to real collections
- Branch and Location models
- Permission model baseline

### Sprint 2 — Master data completion
- DocumentType numbering
- Component.itemId linking
- Supplier data enrichment
- Company profile migration
- Migration testing and data validation

### Sprint 3 — Sales completion
- SalesOrder entity and CRUD
- CustomerPayment doc
- DeliveryNote doc
- Sales report endpoints
- Email notification channel

### Sprint 4 — Workflow engine
- WorkflowMaster CRUD
- WorkflowStep CRUD
- WorkflowHistory logging
- Approval routing and escalation
- Retrofit current approval logic

### Sprint 5 — Inventory foundation
- Warehouse model
- StockTransaction
- StockBalance
- Stock movement API
- Inventory reporting

### Sprint 6 — Purchase execution
- PurchaseRequest
- RFQ
- SupplierQuotation
- PurchaseOrder
- GoodsReceipt
- PurchaseInvoice
- SupplierPayment

## 6. Success criteria

The ERP expansion is successful when:

- Each release delivers a usable and independent business flow
- Existing engineering features continue to function without regression
- Sales, inventory, and purchase data are explicit and queryable
- Every financial or stock write follows transactional integrity rules
- The product remains differentiated by engineering depth rather than becoming a generic ERP without a clear differentiator

## 7. Recommended next action

The immediate next step is to lock the blocker questions before any build begins:

- Q3: inventory valuation method
- Q5: single-tenant vs multi-tenant
- Q6: finance build vs integrate
- Q7: payroll build vs integrate and jurisdiction
- Q8: PostgreSQL recommendation vs polyglot option
- Q12: preserve ISA-88 requirement as part of the product identity

These answers determine the architecture and the real cost of the ERP program.
