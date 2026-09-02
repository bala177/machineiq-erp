# MachineIQ Specification and Release Tracker

This is the operational source of truth for delivery against the client specification. It maps every requirement in `docs/customer-references/Dashboard.docx` to a target release, implementation status, and evidence.

## Control information

| Field                   | Value                                                              |
| ----------------------- | ------------------------------------------------------------------ |
| Client source           | `docs/customer-references/Dashboard.docx`                          |
| Source author           | Shankar Saravanan                                                  |
| Source revision         | 4                                                                  |
| Source modified         | 2026-08-25 18:02 UTC                                               |
| Source SHA-256          | `3acddd37fca8a16622147664f8cfe52ee6a5a66c5877bc70c867b196577a8df2` |
| Analysis                | `MachineIQ-ERP-Spec-v2.0.md`                                       |
| Delivery plan           | `docs/erp-implementation-roadmap.md`                               |
| Tracker baseline        | 2026-08-28                                                         |
| Current package version | `2.1.0-rc.1` for frontend and backend                              |
| Current release target  | v2.1 — PostgreSQL and Master Data Foundation                       |

If the DOCX hash changes, review the document and update this tracker before accepting another release candidate.

## Status and release rules

| Status            | Meaning                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------------- |
| Done              | Implemented, tested, and supported by evidence                                           |
| Partial           | Some capability exists, but the stated requirement or acceptance criteria are incomplete |
| Not started       | No conforming implementation exists                                                      |
| Decision required | Delivery is blocked by an unresolved product or architecture decision                    |
| In progress       | Accepted and actively being implemented, but not release-complete                        |

A release is **Released** only when:

- Every mandatory requirement assigned to it is Done, or an approved exception is recorded.
- Backend build, backend unit tests, and frontend production build pass without hidden fatal diagnostics.
- Required E2E flows pass on desktop and mobile.
- Data migrations have dry-run, apply, validation, and rollback/recovery instructions.
- Security and regression review is complete.
- Frontend and backend package versions match the release number.
- A Git commit and release tag identify the exact source used for the build.
- The build result is entered in the Build verification history below.

## Client requirement traceability

### Phase 1 — Master Data

| ID    | Client requirement        |   Target | Status      | Current evidence or gap                                                                                                        |
| ----- | ------------------------- | -------: | ----------- | ------------------------------------------------------------------------------------------------------------------------------ |
| MD-01 | Company details           |     v2.1 | Done        | `Company` schema and organization API/UI                                                                                       |
| MD-02 | Branches                  |     v2.1 | Done        | `Branch` schema and CRUD API/UI                                                                                                |
| MD-03 | Locations                 |     v2.1 | Done        | `Location` schema and CRUD API/UI                                                                                              |
| MD-04 | Departments               | Existing | Done        | PostgreSQL department entity; permission-protected, audited CRUD API; Organization master-data create/edit/delete UI; desktop/mobile E2E coverage |
| MD-05 | Employee master           |     v3.2 | Not started | User login identity exists; separate employee record does not                                                                  |
| MD-06 | Roles                     | Existing | Done        | Central `Role` enum and role guards                                                                                            |
| MD-07 | Permissions               |     v2.1 | Done        | Permission entities, matrix API/UI, server guard, first-admin bootstrap, and desktop/mobile E2E coverage                       |
| MD-08 | Login credentials         | Existing | Done        | JWT authentication and password hashing                                                                                        |
| MD-09 | Customer code             |     v2.1 | Done        | Sequential code generation and validation                                                                                      |
| MD-10 | Customer address          | Existing | Done        | Customer schema and UI                                                                                                         |
| MD-11 | Customer contact details  | Existing | Done        | Customer contacts, email, and phone fields                                                                                     |
| MD-12 | Customer GST/VAT          | Existing | Done        | VAT/tax fields and validation                                                                                                  |
| MD-13 | Supplier/vendor code      |     v2.1 | Done        | Sequential supplier code generation                                                                                            |
| MD-14 | Supplier payment terms    |     v2.1 | Done        | Supplier commercial fields                                                                                                     |
| MD-15 | Supplier contact details  |     v2.1 | Done        | Supplier schema, API, and UI                                                                                                   |
| MD-16 | Item code and description |     v2.1 | Done        | Item master CRUD                                                                                                               |
| MD-17 | Item UOM                  |     v2.1 | Done        | UOM master CRUD and item reference                                                                                             |
| MD-18 | Item category             |     v2.1 | Done        | Item category CRUD and item reference                                                                                          |
| MD-19 | Item cost                 |     v2.1 | Done        | Standard cost field                                                                                                            |
| MD-20 | Item selling price        |     v2.1 | Done        | Selling price field                                                                                                            |

### Phase 2 — Sales

| ID     | Client requirement |   Target | Status      | Current evidence or gap                                                                              |
| ------ | ------------------ | -------: | ----------- | ---------------------------------------------------------------------------------------------------- |
| SAL-01 | Customer enquiry   | Existing | Done        | Opportunity/Machine Inquiry flow                                                                     |
| SAL-02 | Quotation          | Existing | Done        | Quote module, numbering, approval, print view                                                        |
| SAL-03 | Sales Order        |     v2.2 | Not started | No `SalesOrder` entity or module                                                                     |
| SAL-04 | Delivery Note      |     v2.2 | Not started | No `DeliveryNote` entity or module                                                                   |
| SAL-05 | Sales Invoice      | Existing | Done        | Invoice module generated from accepted quote                                                         |
| SAL-06 | Payment Receipt    |     v2.2 | Partial     | Invoice balance update exists; auditable `CustomerPayment` document, allocation, and reversal do not |

### Phase 2 — Purchase

| ID     | Client requirement | Target | Status      | Current evidence or gap                                                        |
| ------ | ------------------ | -----: | ----------- | ------------------------------------------------------------------------------ |
| PUR-01 | Purchase Request   |   v2.5 | Partial     | Procurement readiness signal exists, but it is not a transactional requisition |
| PUR-02 | RFQ                |   v2.5 | Not started | No RFQ entity or workflow                                                      |
| PUR-03 | Supplier Quotation |   v2.5 | Not started | No supplier quotation entity or comparison flow                                |
| PUR-04 | Purchase Order     |   v2.5 | Not started | An `ordered` readiness status is not a PO document                             |
| PUR-05 | Goods Receipt      |   v2.5 | Not started | A `received` readiness status is not a GRN or stock posting                    |
| PUR-06 | Supplier Invoice   |   v2.5 | Not started | No supplier invoice or three-way match                                         |
| PUR-07 | Supplier Payment   |   v2.5 | Not started | No AP payment document or allocation                                           |

### Phase 2 — Inventory

| ID     | Client requirement     | Target | Status      | Current evidence or gap           |
| ------ | ---------------------- | -----: | ----------- | --------------------------------- |
| INV-01 | Warehouse              |   v2.4 | Not started | No warehouse entity               |
| INV-02 | Stock In and Stock Out |   v2.4 | Not started | No stock ledger                   |
| INV-03 | Stock Transfer         |   v2.4 | Not started | No warehouse movement transaction |
| INV-04 | Stock Adjustment       |   v2.4 | Not started | No adjustment document            |
| INV-05 | Cycle Count            |   v2.4 | Not started | No count and reconciliation flow  |
| INV-06 | Stock balance          |   v2.4 | Not started | No item/warehouse balance model   |

### Phase 2 — Production and Quality

| ID     | Client requirement               | Target | Status      | Current evidence or gap                                                                  |
| ------ | -------------------------------- | -----: | ----------- | ---------------------------------------------------------------------------------------- |
| PRD-01 | Manufacturing BOM                |   v3.0 | Partial     | Engineering ISA-88/component tree exists; versioned manufacturing BOM does not           |
| PRD-02 | Production planning              |   v3.0 | Partial     | Project tasks and milestones exist; capacity/material production planning does not       |
| PRD-03 | Work Order                       |   v3.0 | Not started | Engineering task is not a production work order                                          |
| PRD-04 | Material Issue                   |   v3.0 | Not started | Requires inventory ledger                                                                |
| PRD-05 | Assembly execution               |   v3.0 | Partial     | Component assembly status exists; operations, operator, station, and time booking do not |
| PRD-06 | Production output/finished goods |   v3.0 | Not started | No production receipt or finished-goods posting                                          |
| QLT-01 | Incoming inspection              |   v3.0 | Not started | No inspection transaction                                                                |
| QLT-02 | In-process inspection            |   v3.0 | Not started | No inspection transaction                                                                |
| QLT-03 | Final inspection                 |   v3.0 | Not started | No inspection transaction                                                                |
| QLT-04 | NCR                              |   v3.0 | Not started | No NCR entity or workflow                                                                |
| QLT-05 | CAPA                             |   v3.0 | Not started | No CAPA entity or workflow                                                               |

### Phase 2 — HR, Payroll, and Finance

| ID     | Client requirement       | Target | Status            | Current evidence or gap                                               |
| ------ | ------------------------ | -----: | ----------------- | --------------------------------------------------------------------- |
| HR-01  | Employee                 |   v3.2 | Not started       | Separate employee master missing                                      |
| HR-02  | Attendance               |   v3.2 | Not started       | No attendance model                                                   |
| HR-03  | Leave                    |   v3.2 | Not started       | No leave model or approval                                            |
| HR-04  | Overtime                 |   v3.2 | Not started       | No overtime model                                                     |
| HR-05  | Payroll/salary           |   v3.2 | Decision required | Jurisdiction and build-versus-integrate decision required             |
| FIN-01 | Accounts Receivable      |   v3.1 | Partial           | Invoice balance and overdue status only; no customer ledger or ageing |
| FIN-02 | Accounts Payable         |   v3.1 | Not started       | No supplier ledger                                                    |
| FIN-03 | General Ledger           |   v3.1 | Decision required | No double-entry ledger; build-versus-integrate decision required      |
| FIN-04 | Cash book                |   v3.1 | Not started       | No cash book                                                          |
| FIN-05 | Bank book/reconciliation |   v3.1 | Not started       | No bank book or reconciliation                                        |
| FIN-06 | Fixed assets             |   v3.1 | Not started       | No asset register or depreciation                                     |

### Phases 3–5 — Architecture, Workflow, and Notifications

| ID     | Client requirement                  |     Target | Status      | Current evidence or gap                                                                                                    |
| ------ | ----------------------------------- | ---------: | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| ARC-01 | SQL database architecture           |       v2.1 | In progress | PostgreSQL accepted on 2026-08-28; full runtime and data cutover is now a Release 1 gate                                   |
| ARC-02 | Status reference                    |       v2.3 | Partial     | Engineering statuses are TypeScript enums, not runtime reference data                                                      |
| ARC-03 | Approval levels                     |       v2.3 | Not started | No configurable approval-level entity                                                                                      |
| ARC-04 | Document type                       |       v2.1 | Done        | Entity/API, administration UI, numbering service, and desktop/mobile E2E coverage; purchase usage remains assigned to v2.5 |
| WF-01  | Workflow master                     |       v2.3 | Not started | No configurable workflow definition                                                                                        |
| WF-02  | Workflow steps and approval routing |       v2.3 | Partial     | Hardcoded single-process approvals exist; no reusable conditional engine                                                   |
| WF-03  | Workflow history                    |       v2.3 | Partial     | Audit history exists; no workflow-instance history                                                                         |
| NOT-01 | Email notification                  |       v2.2 | Not started | No SMTP transport/templates                                                                                                |
| NOT-02 | Dashboard alert                     |   Existing | Done        | In-app notifications and Socket.IO browser delivery                                                                        |
| NOT-03 | Mobile notification                 | Continuous | Not started | No mobile push channel                                                                                                     |
| NOT-04 | WhatsApp integration                | Continuous | Not started | No WhatsApp channel                                                                                                        |

### Phase 6 — Reports

| ID     | Client report        | Target | Status      | Current evidence or gap                      |
| ------ | -------------------- | -----: | ----------- | -------------------------------------------- |
| RPT-01 | Sales by customer    |   v2.2 | Not started | No named report                              |
| RPT-02 | Sales by month       |   v2.2 | Not started | No named report                              |
| RPT-03 | Pending orders       |   v2.2 | Not started | Requires Sales Order                         |
| RPT-04 | Supplier performance |   v2.5 | Not started | Requires PO/GRN history                      |
| RPT-05 | Open PO              |   v2.5 | Not started | Requires Purchase Order                      |
| RPT-06 | Stock valuation      |   v2.4 | Not started | Requires stock ledger and valuation decision |
| RPT-07 | ABC analysis         |   v2.4 | Not started | Requires inventory transactions              |
| RPT-08 | Slow-moving items    |   v2.4 | Not started | Requires inventory history                   |
| RPT-09 | Work order status    |   v3.0 | Not started | Requires Work Order                          |
| RPT-10 | Material consumption |   v3.0 | Not started | Requires production issue transactions       |
| RPT-11 | Productivity         |   v3.0 | Not started | Requires production operations/time data     |
| RPT-12 | Trial balance        |   v3.1 | Not started | Requires GL                                  |
| RPT-13 | Profit and loss      |   v3.1 | Not started | Requires GL and accounting periods           |
| RPT-14 | Balance sheet        |   v3.1 | Not started | Requires GL and closing rules                |

## Release target checklist

### v2.1 — PostgreSQL and Master Data Foundation

- [x] PostgreSQL selected as the single system of record; ADR accepted
- [x] No-dual-write and clean-development-data policy recorded
- [x] Local PostgreSQL 16 setup script and Render managed-database definition added
- [x] TypeORM/PostgreSQL runtime foundation with `synchronize: false`
- [x] Versioned baseline migration for all existing and v2.1 entities
- [x] All backend domains migrated from Mongoose repositories
- [x] Deterministic PostgreSQL client-demo seed
- [x] Relationship, total, unique-value, and orphan validation
- [x] Clean reset, migration, seed, backup, and restore rehearsal
- [x] MongoDB removed from released runtime and deployment configuration
- [x] Item, Item Category, and UOM schemas and CRUD APIs
- [x] Item administration UI
- [x] Company, Branch, and Location schemas and CRUD APIs
- [x] Organization administration UI
- [x] Customer and supplier sequential codes
- [x] Supplier commercial fields
- [x] Permission and RolePermission entities
- [x] Server-side permission checks on protected v2.1 actions
- [x] DocumentType entity and numbering service
- [x] Component-to-Item linkage
- [x] Migration dry-run and apply modes
- [x] Migration automated tests
- [x] Migration rollback or documented recovery procedure
- [x] Complete permission-matrix administration UI and E2E coverage
- [x] Complete document-type administration UI and E2E coverage
- [ ] Existing critical E2E flows green on desktop and mobile
- [x] Frontend production build free of fatal-looking diagnostics
- [x] Frontend/backend versions changed to `2.1.0` or an approved `2.1.0-rc.*`
- [ ] Git commit and release tag created

Current disposition: **`v2.1.0-rc.1` is PostgreSQL-testable; final release certification still requires complete critical-workflow desktop/mobile E2E coverage and a Git release commit/tag.**

### v2.2 — Sales Completion

- [ ] Sales Order lifecycle
- [ ] Customer Payment document, allocation, and reversal
- [ ] Delivery Note and partial delivery
- [ ] Sales by customer report
- [ ] Sales by month report
- [ ] Pending orders report
- [ ] SMTP/email notification channel
- [ ] Migration, unit, integration, and E2E evidence

### v2.3 — Workflow Engine

- [ ] WorkflowMaster, WorkflowStep, WorkflowHistory, and ApprovalLevel
- [ ] Conditional multi-level approvals
- [ ] SLA escalation and delegation
- [ ] Existing approvals migrated to the engine
- [ ] Workflow administration UI
- [ ] Migration, unit, integration, and E2E evidence

### v2.4 — Inventory Foundation

- [ ] Database and inventory valuation decisions approved
- [ ] Warehouse, StockTransaction, and StockBalance
- [ ] Stock In, Out, Transfer, Adjustment, and Cycle Count
- [ ] Stock valuation, ABC, and slow-moving reports
- [ ] Transaction-integrity, concurrency, migration, and E2E evidence

### v2.5 — Purchase Execution

- [ ] Purchase Request, RFQ, and Supplier Quotation
- [ ] Purchase Order and amendment history
- [ ] Goods Receipt and inventory posting
- [ ] Purchase Invoice and three-way match
- [ ] Supplier Payment
- [ ] Open PO and supplier-performance reports
- [ ] Migration, unit, integration, and E2E evidence

### v3.0 — Production and Quality

- [ ] Manufacturing BOM and versioning
- [ ] Production planning and Work Order
- [ ] Material Issue and Production Output
- [ ] Incoming, in-process, and final inspection
- [ ] NCR and CAPA
- [ ] Production reports
- [ ] Migration, unit, integration, and E2E evidence

### v3.1 — Finance

- [ ] Build-versus-integrate decision approved
- [ ] Double-entry accounting design independently reviewed
- [ ] AR, AP, GL, Cash, Bank, and Assets
- [ ] Trial balance, P&L, and balance sheet
- [ ] Migration, reconciliation, audit, and E2E evidence

### v3.2 — HR and Payroll

- [ ] Jurisdiction and build-versus-integrate decision approved
- [ ] Employee, attendance, leave, and overtime
- [ ] Payroll and statutory compliance
- [ ] Migration, security, audit, and E2E evidence

## Build verification history

Run `npm run release:check -- <candidate>` for the standard build checks, using the exact package version such as `v2.1.0-rc.1`. Use `RUN_E2E=1 npm run release:check -- <candidate>` when the test environment and services are available. Attach the generated report path from `logs/release-checks/` to the entry.

| Date       | Candidate                            | Source revision | Backend build | Unit tests                                  | Frontend build                        | E2E                                                                                                                      | Spec/release decision                         | Evidence                                                        |
| ---------- | ------------------------------------ | --------------- | ------------- | ------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- | --------------------------------------------------------------- |
| 2026-08-28 | `v0.2.0-beta.1` / v2.1 working scope | No Git commit   | Pass          | 371/371 pass                                | Fail: invalid-URL diagnostic detected | Skipped; latest stored suite has 32 failures                                                                             | Not releasable                                | `logs/release-checks/20260828T094752Z-v0.2.0-beta.1/summary.md` |
| 2026-08-28 | `v2.1.0-rc.1`                        | No Git commit   | Pass          | 367/367 pass; PostgreSQL migration 2/2 pass | Pass                                  | Partial: auth, setup, current navigation/settings and critical inquiry flows verified; full desktop/mobile suite pending | PostgreSQL-testable RC; not release-certified | `logs/release-checks/20260828T211523Z-v2.1.0-rc.1/summary.md`   |

## Update procedure for every candidate build

1. Confirm `Dashboard.docx` still has the recorded SHA-256. If it changed, assign IDs to new or changed requirements first.
2. Update requirement statuses only when implementation and evidence both exist.
3. Run `npm run release:check -- <candidate>`.
4. Run E2E with `RUN_E2E=1` in an environment with PostgreSQL and both applications available.
5. Review every unchecked item in the target release checklist and record approved exceptions explicitly.
6. Add one Build verification history row with the source commit, results, generated evidence path, and release decision.
7. For an approved release, align package versions and create the Git tag only after all gates pass.
