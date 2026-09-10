# MachineIQ Specification and Release Tracker

**R1/R2 stabilization update — 10 September 2026:** The missing R1 employee, warehouse, currency, tax and configurable-status masters are implemented with audited APIs, administration UI, migration seeds and dashboard readiness checks. Configurable roles now retain referential permissions, and item preferences are enforced by the API. The R2 enquiry → controlled quotation → approved order → machine project flow and seven reports remain green. Backend regression passed **33 suites / 444 tests**, the isolated PostgreSQL R2 acceptance suite passed **9/9**, and both production builds passed. See the [R1 completion record](release1-completion-and-testing.md). Customer UAT and production certification remain separate gates.

**Active baseline: 07 September 2026.** Original customer requirements: [Dashboard.docx](specs/Dashboard.docx). Revised scope and release order: [Product Specification v1.0](specs/MachineIQ_ERP_Product_Specification_v1.0.pdf). Read the [baseline/source and decision register](specification-baseline.md) before changing scope.

## Control information

| Field                     | Value                                                                                                                               |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Original customer source  | `docs/specs/Dashboard.docx`                                                                                                         |
| Customer source SHA-256   | `3acddd37fca8a16622147664f8cfe52ee6a5a66c5877bc70c867b196577a8df2`                                                                  |
| Revised specification     | `docs/specs/MachineIQ_ERP_Product_Specification_v1.0.pdf` — 07 September 2026                                                       |
| Specification SHA-256     | `2b21f1ce379f43aa234fed79d3556d40e67e5014899692660dd7afec14b40c80`                                                                  |
| Current packages          | Root/frontend/backend `2.2.0-rc.1`                                                                                                  |
| Current implementation scope | R1 foundation completion and R2 Sales & Machine Project Initiation stabilization                                                    |
| Release certification     | Technical candidate checks passed 10 September 2026; customer UAT, backup/restore and authorized deployment remain open             |
| Delivery plan             | [R1–R10 roadmap](erp-implementation-roadmap.md) and [R2 implementation plan](plans/2026-09-07-release2-sales-project-initiation.md) |

## Status and evidence rules

| Status                | Meaning                                                                                                                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Revalidation required | Existing/historical capability or evidence; revised-spec acceptance has not been established.                                 |
| Partial               | Some capability exists; stated acceptance is incomplete.                                                                      |
| Not started           | Prior gap review found no conforming implementation; later releases need fresh code review before work.                       |
| Decision required     | Business/architecture policy must be resolved for the affected capability.                                                    |
| Planned / unverified  | New-spec scope is assigned; no completion claim is made.                                                                      |
| Implemented / UAT pending | Code and automated evidence are present; customer acceptance and deployment certification remain separate. |
| Done                  | Reserve for implementation plus test/UAT evidence against this baseline. No historical Done is automatically carried forward. |

Implementation observations below retain previous evidence unless explicitly dated 2026-09-07. They are not fresh tests of every module. Historical build results remain unchanged in the evidence section. The original 86 requirement IDs are retained; additional source coverage is identified separately.

## Original customer requirement traceability

### Master data

| ID    | Customer requirement      | Target  | Status                | Source / acceptance reference | Implementation observation or gap                                                                                                                 |
| ----- | ------------------------- | ------- | --------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| MD-01 | Company details           | R1      | Implemented / UAT pending | DOCX Phase 1; spec §6      | Company legal/statutory profile and organization API/UI; included in readiness dashboard.                                                        |
| MD-02 | Branches                  | R1      | Implemented / UAT pending | DOCX Phase 1; spec §6      | Audited branch CRUD API/UI and readiness checks.                                                                                                 |
| MD-03 | Locations                 | R1      | Implemented / UAT pending | DOCX Phase 1; spec §6      | Audited location CRUD API/UI and warehouse relationship.                                                                                        |
| MD-04 | Departments               | R1      | Implemented / UAT pending | DOCX Phase 1; spec §6      | PostgreSQL department entity; permission-protected, audited CRUD API/UI and regression coverage.                                                |
| MD-05 | Employee master           | R1 / R9 | Implemented / UAT pending | DOCX Phase 1; spec §6      | Separate employee identity, optional login/department/manager links, employment fields, active control and audited administration UI. R9 adds workforce operations. |
| MD-06 | Roles                     | R1      | Implemented / UAT pending | DOCX Phase 1; spec §6      | Configurable role rows and UI, protected system roles, active controls, user references and guarded custom-role authorization.                  |
| MD-07 | Permissions               | R1      | Implemented / UAT pending | DOCX Phase 1; spec §6      | Permission matrix, role-id grants, server guard, first-admin bootstrap and regression/integration coverage.                                     |
| MD-08 | Login credentials         | R1      | Implemented / UAT pending | DOCX Phase 1; spec §6      | JWT authentication, bcrypt password hashing, password policy, inactive-user rejection and controlled first-admin setup.                         |
| MD-09 | Customer code             | R1      | Implemented / UAT pending | DOCX Phase 1; spec §6      | Sequential/manual unique code validation and audited customer CRUD.                                                                              |
| MD-10 | Customer address          | R1      | Implemented / UAT pending | DOCX Phase 1; spec §6      | Billing/shipping address and customer-site support in API/UI.                                                                                    |
| MD-11 | Customer contact details  | R1      | Implemented / UAT pending | DOCX Phase 1; spec §6      | Primary/secondary contact, email, phone and designation fields with validation.                                                                  |
| MD-12 | Customer GST/VAT          | R1      | Implemented / UAT pending | DOCX Phase 1; spec §6      | Customer tax registration fields plus configurable organization tax-rate master.                                                               |
| MD-13 | Supplier/vendor code      | R1      | Implemented / UAT pending | DOCX Phase 1; spec §6      | Sequential/manual unique supplier code and audited CRUD.                                                                                         |
| MD-14 | Supplier payment terms    | R1      | Implemented / UAT pending | DOCX Phase 1; spec §6      | Supplier currency, tax, payment terms and lead-time commercial fields.                                                                           |
| MD-15 | Supplier contact details  | R1      | Implemented / UAT pending | DOCX Phase 1; spec §6      | Supplier address and primary/secondary contact API/UI with validation.                                                                           |
| MD-16 | Item code and description | R1      | Implemented / UAT pending | DOCX Phase 1; spec §6      | Item CRUD, generated/manual code and manufacturer, barcode, HSN/SAC, sales and purchasing descriptions.                                          |
| MD-17 | Item UOM                  | R1      | Implemented / UAT pending | DOCX Phase 1; spec §6      | UOM master, base-unit conversions and item reference.                                                                                            |
| MD-18 | Item category             | R1      | Implemented / UAT pending | DOCX Phase 1; spec §6      | Hierarchical category CRUD and item reference integrity.                                                                                         |
| MD-19 | Item cost                 | R1      | Implemented / UAT pending | DOCX Phase 1; spec §6      | Non-negative standard cost and base-UOM calculation.                                                                                             |
| MD-20 | Item selling price        | R1      | Implemented / UAT pending | DOCX Phase 1; spec §6      | Non-negative selling price, default tax/preferences and base-UOM calculation.                                                                    |

### Sales

| ID     | Customer requirement | Target | Status      | Source / acceptance reference      | Implementation observation or gap                                                                                                                                           |
| ------ | -------------------- | ------ | ----------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SAL-01 | Customer enquiry     | R2     | Implemented / UAT pending | DOCX Phase 2 Sales; spec §§7,13,14 | Exact quantity, active customer/site validation, seven requirement summaries, protected evidence and commercial enquiry lifecycle implemented and tested. See R2 testing record. |
| SAL-02 | Quotation            | R2     | Implemented / UAT pending | DOCX Phase 2 Sales; spec §§7,13,14 | Controlled technical-commercial quotations, revisions/comparison, internal approval and customer decisions implemented and tested. See R2 testing record. |
| SAL-03 | Sales Order          | R2     | Implemented / UAT pending | DOCX Phase 2 Sales; spec §§7,13,14 | Accepted quotation creates an order without re-entry; approved order creates a machine project with source baseline. Tested in PostgreSQL and browser. See R2 testing record. |
| SAL-04 | Delivery Note        | R8     | Not started | DOCX Phase 2 Sales; spec §§7,13,14 | No `DeliveryNote` entity or module                                                                                                                                          |
| SAL-05 | Sales Invoice        | R9     | Partial     | DOCX Phase 2 Sales; spec §§7,13,14 | Existing quote-derived invoice implementation requires R9 milestone, project, posting and allocation acceptance; earlier availability does not change the release boundary. |
| SAL-06 | Payment Receipt      | R9     | Partial     | DOCX Phase 2 Sales; spec §§7,13,14 | Invoice balance update exists; auditable `CustomerPayment` document, allocation, and reversal do not                                                                        |

### Purchase

| ID     | Customer requirement | Target  | Status      | Source / acceptance reference       | Implementation observation or gap                                                                                                                             |
| ------ | -------------------- | ------- | ----------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PUR-01 | Purchase Request     | R6      | Partial     | DOCX Phase 2 Purchase; spec §§11,14 | Procurement readiness signal exists, but it is not a transactional requisition                                                                                |
| PUR-02 | RFQ                  | R6      | Not started | DOCX Phase 2 Purchase; spec §§11,14 | No RFQ entity or workflow                                                                                                                                     |
| PUR-03 | Supplier Quotation   | R6      | Not started | DOCX Phase 2 Purchase; spec §§11,14 | No supplier quotation entity or comparison flow                                                                                                               |
| PUR-04 | Purchase Order       | R6      | Not started | DOCX Phase 2 Purchase; spec §§11,14 | An `ordered` readiness status is not a PO document                                                                                                            |
| PUR-05 | Goods Receipt        | R6      | Not started | DOCX Phase 2 Purchase; spec §§11,14 | A `received` readiness status is not a GRN or stock posting                                                                                                   |
| PUR-06 | Supplier Invoice     | R6 / R9 | Not started | DOCX Phase 2 Purchase; spec §§11,14 | R6 supplier invoice matching/payment status and AP handoff; R9 payable/invoice register and payment allocation. No complete flow evidenced in this alignment. |
| PUR-07 | Supplier Payment     | R9      | Not started | DOCX Phase 2 Purchase; spec §§11,14 | No AP payment document or allocation                                                                                                                          |

### Inventory

| ID     | Customer requirement   | Target  | Status      | Source / acceptance reference       | Implementation observation or gap                                                                                                    |
| ------ | ---------------------- | ------- | ----------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| INV-01 | Warehouse              | R1 / R5 | Implemented / UAT pending | DOCX Phase 2 Inventory; spec §§6,10 | R1 warehouse master includes code, location, manager, active state and audit. Zones/bins, stock movement and balances remain correctly assigned to R5. |
| INV-02 | Stock In and Stock Out | R5      | Not started | DOCX Phase 2 Inventory; spec §§6,10 | No stock ledger                                                                                                                      |
| INV-03 | Stock Transfer         | R5      | Not started | DOCX Phase 2 Inventory; spec §§6,10 | No warehouse movement transaction                                                                                                    |
| INV-04 | Stock Adjustment       | R5      | Not started | DOCX Phase 2 Inventory; spec §§6,10 | No adjustment document                                                                                                               |
| INV-05 | Cycle Count            | R5      | Not started | DOCX Phase 2 Inventory; spec §§6,10 | No count and reconciliation flow                                                                                                     |
| INV-06 | Stock balance          | R5      | Not started | DOCX Phase 2 Inventory; spec §§6,10 | No item/warehouse balance model                                                                                                      |

### Production

| ID     | Customer requirement             | Target  | Status      | Source / acceptance reference        | Implementation observation or gap                                                                                                         |
| ------ | -------------------------------- | ------- | ----------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| PRD-01 | Manufacturing BOM                | R4 / R7 | Partial     | DOCX Phase 2 Production; spec §§9,12 | Engineering hierarchy exists; controlled BOM/revision/material planning in R4 and as-built/production integration in R7 remain to verify. |
| PRD-02 | Production planning              | R7      | Partial     | DOCX Phase 2 Production; spec §§9,12 | Project tasks and milestones exist; capacity/material production planning does not                                                        |
| PRD-03 | Work Order                       | R7      | Not started | DOCX Phase 2 Production; spec §§9,12 | Engineering task is not a production work order                                                                                           |
| PRD-04 | Material Issue                   | R5 / R7 | Not started | DOCX Phase 2 Production; spec §§9,12 | Requires inventory ledger                                                                                                                 |
| PRD-05 | Assembly execution               | R7      | Partial     | DOCX Phase 2 Production; spec §§9,12 | Component assembly status exists; operations, operator, station, and time booking do not                                                  |
| PRD-06 | Production output/finished goods | R7      | Not started | DOCX Phase 2 Production; spec §§9,12 | No production receipt or finished-goods posting                                                                                           |

### Quality

| ID     | Customer requirement  | Target | Status      | Source / acceptance reference  | Implementation observation or gap |
| ------ | --------------------- | ------ | ----------- | ------------------------------ | --------------------------------- |
| QLT-01 | Incoming inspection   | R7     | Not started | DOCX Phase 2 Quality; spec §12 | No inspection transaction         |
| QLT-02 | In-process inspection | R7     | Not started | DOCX Phase 2 Quality; spec §12 | No inspection transaction         |
| QLT-03 | Final inspection      | R7     | Not started | DOCX Phase 2 Quality; spec §12 | No inspection transaction         |
| QLT-04 | NCR                   | R7     | Not started | DOCX Phase 2 Quality; spec §12 | No NCR entity or workflow         |
| QLT-05 | CAPA                  | R7     | Not started | DOCX Phase 2 Quality; spec §12 | No CAPA entity or workflow        |

### HR and payroll

| ID    | Customer requirement | Target  | Status            | Source / acceptance reference | Implementation observation or gap                                                                         |
| ----- | -------------------- | ------- | ----------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| HR-01 | Employee             | R1 / R9 | Implemented / UAT pending | DOCX Phase 2 HR; spec §§6,14  | R1 employee identity is implemented independently of login users; attendance, leave, overtime and payroll remain R9 scope. |
| HR-02 | Attendance           | R9      | Not started       | DOCX Phase 2 HR; spec §§6,14  | No attendance model                                                                                       |
| HR-03 | Leave                | R9      | Not started       | DOCX Phase 2 HR; spec §§6,14  | No leave model or approval                                                                                |
| HR-04 | Overtime             | R9      | Not started       | DOCX Phase 2 HR; spec §§6,14  | No overtime model                                                                                         |
| HR-05 | Payroll/salary       | R9      | Decision required | DOCX Phase 2 HR; spec §§6,14  | Jurisdiction and build-versus-integrate decision required                                                 |

### Finance

| ID     | Customer requirement     | Target | Status            | Source / acceptance reference  | Implementation observation or gap                                     |
| ------ | ------------------------ | ------ | ----------------- | ------------------------------ | --------------------------------------------------------------------- |
| FIN-01 | Accounts Receivable      | R9     | Partial           | DOCX Phase 2 Finance; spec §14 | Invoice balance and overdue status only; no customer ledger or ageing |
| FIN-02 | Accounts Payable         | R9     | Not started       | DOCX Phase 2 Finance; spec §14 | No supplier ledger                                                    |
| FIN-03 | General Ledger           | R9     | Decision required | DOCX Phase 2 Finance; spec §14 | No double-entry ledger; build-versus-integrate decision required      |
| FIN-04 | Cash book                | R9     | Not started       | DOCX Phase 2 Finance; spec §14 | No cash book                                                          |
| FIN-05 | Bank book/reconciliation | R9     | Not started       | DOCX Phase 2 Finance; spec §14 | No bank book or reconciliation                                        |
| FIN-06 | Fixed assets             | R9     | Not started       | DOCX Phase 2 Finance; spec §14 | No asset register or depreciation                                     |

### Database/reference architecture

| ID     | Customer requirement      | Target | Status                | Source / acceptance reference  | Implementation observation or gap                                                                                                                                                       |
| ------ | ------------------------- | ------ | --------------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ARC-01 | SQL database architecture | R1     | Revalidation required | DOCX Phase 3; spec §§4,6,15,17 | PostgreSQL accepted in ADR-001; current TypeORM/PostgreSQL runtime exists. Certification requires current migration/recovery and integrity evidence, not the historical cutover status. |
| ARC-02 | Status reference          | R1     | Implemented / UAT pending | DOCX Phase 3; spec §§4,6,15,17 | Configurable module/code/label/order/terminal status master, seeded common statuses and audited administration UI are implemented.                |
| ARC-03 | Approval levels           | R10    | Not started           | DOCX Phase 3; spec §§4,6,15,17 | Configurable enterprise approval levels/matrix in R10. Basic module authority is required at module launch.                                                                             |
| ARC-04 | Document type             | R1     | Revalidation required | DOCX Phase 3; spec §§4,6,15,17 | Existing DocumentType API/UI and numbering reported; revalidate organization/year uniqueness and no identifier reuse. Purchase use extends in R6.                                       |

### Workflow

| ID    | Customer requirement                | Target                   | Status      | Source / acceptance reference | Implementation observation or gap                                        |
| ----- | ----------------------------------- | ------------------------ | ----------- | ----------------------------- | ------------------------------------------------------------------------ |
| WF-01 | Workflow master                     | R10                      | Not started | DOCX Phase 4; spec §§5,15,16  | No configurable workflow definition                                      |
| WF-02 | Workflow steps and approval routing | R2–R9 basic / R10 engine | Partial     | DOCX Phase 4; spec §§5,15,16  | Hardcoded single-process approvals exist; no reusable conditional engine |
| WF-03 | Workflow history                    | R2–R9 basic / R10 engine | Partial     | DOCX Phase 4; spec §§5,15,16  | Audit history exists; no workflow-instance history                       |

### Notifications

| ID     | Customer requirement | Target            | Status                | Source / acceptance reference | Implementation observation or gap                                                                                               |
| ------ | -------------------- | ----------------- | --------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| NOT-01 | Email notification   | R10               | Not started           | DOCX Phase 5; spec §§15,18    | No SMTP transport/templates                                                                                                     |
| NOT-02 | Dashboard alert      | Each module / R10 | Revalidation required | DOCX Phase 5; spec §§15,18    | Existing in-app/Socket.IO channel; verify module events, authorization, deduplication and source links as each module launches. |
| NOT-03 | Mobile notification  | R10               | Not started           | DOCX Phase 5; spec §§15,18    | No mobile push channel                                                                                                          |
| NOT-04 | WhatsApp integration | R10               | Not started           | DOCX Phase 5; spec §§15,18    | Customer WhatsApp request retained in R10 with provider, consent and template-policy conditions from spec §§15,19,20.           |

### Reports

| ID     | Customer requirement | Target | Status      | Source / acceptance reference             | Implementation observation or gap            |
| ------ | -------------------- | ------ | ----------- | ----------------------------------------- | -------------------------------------------- |
| RPT-01 | Sales by customer    | R2     | Implemented / UAT pending | DOCX Phase 6; spec §18 and owning release | Orders by customer, with scoped supporting records, currency-separated totals and exports. See R2 testing record. |
| RPT-02 | Sales by month       | R2     | Implemented / UAT pending | DOCX Phase 6; spec §18 and owning release | Order intake by first-confirmation month in organization time; excludes cancellation and duplicate revisions. See R2 testing record. |
| RPT-03 | Pending orders       | R2     | Implemented / UAT pending | DOCX Phase 6; spec §18 and owning release | Confirmed/on-hold commercial orders. Delivery execution remains R8. See R2 testing record. |
| RPT-04 | Supplier performance | R6     | Not started | DOCX Phase 6; spec §18 and owning release | Requires PO/GRN history                      |
| RPT-05 | Open PO              | R6     | Not started | DOCX Phase 6; spec §18 and owning release | Requires Purchase Order                      |
| RPT-06 | Stock valuation      | R5     | Not started | DOCX Phase 6; spec §18 and owning release | Requires stock ledger and valuation decision |
| RPT-07 | ABC analysis         | R5     | Not started | DOCX Phase 6; spec §18 and owning release | Requires inventory transactions              |
| RPT-08 | Slow-moving items    | R5     | Not started | DOCX Phase 6; spec §18 and owning release | Requires inventory history                   |
| RPT-09 | Work order status    | R7     | Not started | DOCX Phase 6; spec §18 and owning release | Requires Work Order                          |
| RPT-10 | Material consumption | R7     | Not started | DOCX Phase 6; spec §18 and owning release | Requires production issue transactions       |
| RPT-11 | Productivity         | R7     | Not started | DOCX Phase 6; spec §18 and owning release | Requires production operations/time data     |
| RPT-12 | Trial balance        | R9     | Not started | DOCX Phase 6; spec §18 and owning release | Requires GL                                  |
| RPT-13 | Profit and loss      | R9     | Not started | DOCX Phase 6; spec §18 and owning release | Requires GL and accounting periods           |
| RPT-14 | Balance sheet        | R9     | Not started | DOCX Phase 6; spec §18 and owning release | Requires GL and closing rules                |

### Additional original-source details

| ID     | Customer source detail                                               | Target                                     | Status               | Source / acceptance                                                                                                         |
| ------ | -------------------------------------------------------------------- | ------------------------------------------ | -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| CUS-01 | Master/transaction/reference table structure and example table names | R1 foundation; owning transaction release  | Planned / unverified | DOCX Phase 3; spec §§4,6,17. Preserve business records/relationships; physical table naming follows validated architecture. |
| CUS-02 | PO approval pending notification                                     | R6 basic / R10 channels                    | Planned / unverified | DOCX Phase 5 example; spec §§11,18. Alert links to authorized approval record.                                              |
| CUS-03 | Stock below minimum notification                                     | R5 basic / R10 channels                    | Planned / unverified | DOCX Phase 5 example; spec §§10,18. Threshold based on controlled stock.                                                    |
| CUS-04 | Machine maintenance due notification                                 | R9 basic / R10 channels                    | Planned / unverified | DOCX Phase 5 example; spec §§14,18. Installed machine and maintenance schedule required.                                    |
| CUS-05 | Employee leave-request notification                                  | R9 basic / R10 channels                    | Planned / unverified | DOCX Phase 5 example; employee leave workflow retained under spec §§14,16,18.                                               |
| CUS-06 | Purchase request → manager → purchase manager → PO approval example  | R6 basic authority; R10 configurable route | Planned / unverified | DOCX Phase 4; spec §§5,11,15. Preserve example as a workflow acceptance scenario, not a universal mandatory route.          |

The DOCX suggested build order is replaced by the new-spec release order under AL-01; none of the underlying functional scope is removed. PostgreSQL/SQL Server/MySQL are alternatives in the customer source, not a requirement to operate three databases. The accepted PostgreSQL decision remains. Document artefacts and the GL typo are treated as recorded in AL-06.

## Revised-specification release coverage

These rows cover expanded scope as well as original requirements. IDs are tracker-assigned, not printed in the PDF. Each scope group below is verified against the full source section; summaries do not waive omitted field-level details. Unless a release section records newer evidence, status is **Planned / unverified** until implementation and acceptance evidence is retained.

### R1 — Foundation & Master Data

| ID         | Required scope                                                                                                         | Source / target   | Status |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------- | ------ |
| SPEC-R1-01 | Company profile, legal/tax details, branches, physical locations, departments, currency, timezone and fiscal settings. | Spec §6, p.8 / R1 | Implemented; technical verification passed 2026-09-10; UAT pending |
| SPEC-R1-02 | Users, employee identity, roles, permissions, credentials and access assignments; active/inactive controls.            | Spec §6, p.8 / R1 | Implemented; configurable-role and employee gaps closed 2026-09-10; UAT pending |
| SPEC-R1-03 | Customer and supplier codes, addresses/sites, contacts, tax data, currencies, payment terms and supplier lead times.   | Spec §6, p.8 / R1 | Implemented; regression verified 2026-09-10; UAT pending |
| SPEC-R1-04 | Items, categories, UOM, make/buy, cost, selling price, manufacturer/part number, stock flag and reorder level.         | Spec §6, p.8 / R1 | Implemented; item preferences are now API-enforced; UAT pending |
| SPEC-R1-05 | Warehouse master, configurable tax/VAT, currency, reference statuses, document types and numbering series.             | Spec §6, p.8 / R1 | Implemented; missing foundation masters/migration/UI closed 2026-09-10; UAT pending |

**Reports gate:** Master completeness, active users/roles, customer and supplier lists, item catalogue and change history.

**Acceptance gate:** Administrators configure hierarchy/access without code changes; duplicate codes and invalid mandatory data are rejected; privileged changes are audited; downstream modules select consistent masters.

**Dependency:** Foundation for every release. Workforce operations expand in R9; stock transactions start in R5.

- [x] Scope groups and release-specific automated acceptance pass with retained technical evidence (2026-09-10).
- [ ] Applicable cross-module controls and common release gates pass.

### R2 — Sales & Machine Project Initiation

| ID         | Required scope                                                                                                                                                                                             | Source / target   | Status                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------- |
| SPEC-R2-01 | Enquiry: machine/application, quantity, target delivery, customer site, source and attachments; requirements for use, capacity, interfaces, utilities, constraints, standards and customer-provided items. | Spec §7, p.9 / R2 | Implemented; automated acceptance passed 2026-09-07                     |
| SPEC-R2-02 | Technical-commercial quotation: scope, exclusions, price/tax, validity, delivery, warranty and payment milestones.                                                                                         | Spec §7, p.9 / R2 | Implemented; precision and lifecycle tests passed 2026-09-07            |
| SPEC-R2-03 | Quotation revisions/comparison, internal approval, customer acceptance/rejection and conversion history.                                                                                                   | Spec §7, p.9 / R2 | Implemented; revision, approval and exception tests passed 2026-09-07   |
| SPEC-R2-04 | Sales order: customer PO, ordered scope/value, delivery, payment milestones and special terms.                                                                                                             | Spec §7, p.9 / R2 | Implemented; idempotency, amendment and state tests passed 2026-09-07   |
| SPEC-R2-05 | Project creation from accepted order: project code/owner, machine category, site, dates, value and baseline; communications, comments, attachments, activity and status dashboard.                         | Spec §7, p.9 / R2 | Implemented; desktop/mobile workflow and access tests passed 2026-09-07 |

**Reports gate:** Sales pipeline, quotation conversion, quotations by customer, orders by month/customer, pending orders, payment milestone schedule and project intake.

**Acceptance gate:** Accepted quote creates an order without re-entry; approved order creates a project with source references; every revision remains visible and only the current approved version is operational; required references, dates and values are validated.

**Dependency:** Uses R1 masters. Basic approvals ship here. Delivery execution is R8; invoices and payment allocation are R9.

- [x] Scope groups, seven reports and release-specific automated acceptance pass with retained evidence.
- [ ] Applicable cross-module controls and common release gates pass.

**R2 technical evidence:** Isolated PostgreSQL acceptance/exception suite **9/9 passed**; desktop and Pixel 7 browser workflows passed through project creation, evidence, reports and CSV/XLSX export. See the [R2 technical completion update](plans/2026-09-07-release2-sales-project-initiation.md#11-technical-completion-update--2026-09-07). Final release acceptance remains blocked on the unchecked common gates below.

### R3 — Project Planning & Engineering

| ID         | Required scope                                                                                                                                                    | Source / target    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| SPEC-R3-01 | Project templates, phases, milestones, stage gates, planned dates and responsible departments.                                                                    | Spec §8, p.10 / R3 |
| SPEC-R3-02 | Mechanical, electrical, controls/software and other work packages; engineer/team allocation, task ownership, dependencies, effort, dates and completion evidence. | Spec §8, p.10 / R3 |
| SPEC-R3-03 | Requirement register with source, owner, priority, verification method, status and evidence links.                                                                | Spec §8, p.10 / R3 |
| SPEC-R3-04 | Document/drawing register, revision, review, approval, release and superseded history; design-review actions and decisions.                                       | Spec §8, p.10 / R3 |
| SPEC-R3-05 | Risk, issue and action registers; engineering changes with affected records, cost/schedule impact, approval and implementation tracking.                          | Spec §8, p.10 / R3 |

**Reports gate:** Timeline/project health, milestone performance, overdue tasks, workload, document status, requirement coverage, risk exposure and change impact.

**Acceptance gate:** Managers assign dependent work; released documents require new revisions for change; change history identifies affected records; progress derives from controlled work.

**Dependency:** Builds on the R2 project baseline; provides engineering ownership and release control for R4.

- [ ] Scope groups, reports and release-specific acceptance pass with retained evidence.
- [ ] Applicable cross-module controls and common release gates pass.

### R4 — BOM & Material Planning

| ID         | Required scope                                                                                                                                                          | Source / target    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| SPEC-R4-01 | Preliminary, engineering and manufacturing BOMs; multi-level assemblies, configurable sections and engineer/work-package ownership.                                     | Spec §9, p.11 / R4 |
| SPEC-R4-02 | Lines: item, quantity/UOM, make/buy, required date, preferred supplier, manufacturer part, cost and notes; validated new-item creation during authoring.                | Spec §9, p.11 / R4 |
| SPEC-R4-03 | Alternatives/substitutions, customer-supplied and non-stock items, scrap allowance and long-lead identification.                                                        | Spec §9, p.11 / R4 |
| SPEC-R4-04 | Revision comparison, line-change history, approval and partial section release before the full assembly BOM is complete.                                                | Spec §9, p.11 / R4 |
| SPEC-R4-05 | Availability, reservations, on-order quantities, shortages and required-by dates; estimated cost versus budget; CSV/Excel import/export and CAD/BOM import preparation. | Spec §9, p.11 / R4 |

**Reports gate:** BOM cost, revision variance, shortages, long-lead items, make/buy, unreleased sections and material readiness.

**Acceptance gate:** Designers contribute independently; only released quantities drive demand; revisions show added/removed/changed lines; demand retains project, machine, BOM revision and required date.

**Dependency:** Uses R1–R3. Availability/reservation and purchase views connect progressively as R5/R6 introduce live stock and purchasing.

- [ ] Scope groups, reports and release-specific acceptance pass with retained evidence.
- [ ] Applicable cross-module controls and common release gates pass.

### R5 — Inventory & Warehousing

| ID         | Required scope                                                                                                                          | Source / target     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| SPEC-R5-01 | Warehouse, zone/bin or configurable storage locations; opening balance, stock in/out, transfer, adjustment and cycle count.             | Spec §10, p.12 / R5 |
| SPEC-R5-02 | Stock ledger and balances by item/location, with batch/lot and serial tracking where enabled.                                           | Spec §10, p.12 / R5 |
| SPEC-R5-03 | Project reservation, allocation/deallocation, material issue and unused-material return.                                                | Spec §10, p.12 / R5 |
| SPEC-R5-04 | Available-to-promise separates on-hand, reserved, available, inspection and blocked stock; minimum stock, reorder proposals and alerts. | Spec §10, p.12 / R5 |
| SPEC-R5-05 | Negative-stock policy, controlled adjustment approval, organization valuation method and complete movement history.                     | Spec §10, p.12 / R5 |

**Reports gate:** Current stock, reservations, movements, valuation, ABC analysis, slow-moving items, shortages, cycle-count variance and reorder list.

**Acceptance gate:** Posting changes balances atomically; posted records cannot be edited; reversal creates linked counter-transactions; stock conditions remain distinct; issues cannot exceed permitted availability/reservation.

**Dependency:** Uses R1 masters and R4 released demand. Connects inventory to R6 receipts and R7 production.

- [ ] Scope groups, reports and release-specific acceptance pass with retained evidence.
- [ ] Applicable cross-module controls and common release gates pass.

### R6 — Purchase & Supplier Management

| ID         | Required scope                                                                                                                                          | Source / target     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| SPEC-R6-01 | Purchase requests from released BOM shortages or manual entry, with requester, project, need date and justification; module approval.                   | Spec §11, p.13 / R6 |
| SPEC-R6-02 | RFQs to suppliers; quotation capture for price, tax, lead time, validity, freight, terms, deviations and documents.                                     | Spec §11, p.13 / R6 |
| SPEC-R6-03 | Technical/commercial comparison and supplier selection with justification.                                                                              | Spec §11, p.13 / R6 |
| SPEC-R6-04 | PO with project/BOM references, delivery schedule, terms, approval and dispatch status; amendments/history and controlled outstanding-quantity closure. | Spec §11, p.13 / R6 |
| SPEC-R6-05 | Partial GRN, inspection/accepted/rejected quantities, purchase returns and pending balances; supplier invoice matching, payment status and AP handoff.  | Spec §11, p.13 / R6 |

**Reports gate:** Open POs, pending/delayed deliveries, purchase/price history, supplier performance, pending GRN/inspection and project purchase cost.

**Acceptance gate:** Released shortages create requests without re-entry; selection records its reason; partial receipts update pending quantity/inspection stock; PO amendments retain prior versions and reapproval.

**Dependency:** Uses R4/R5. Quality inspection integrates with R7; supplier payment processing and allocation are R9.

- [ ] Scope groups, reports and release-specific acceptance pass with retained evidence.
- [ ] Applicable cross-module controls and common release gates pass.

### R7 — Production, Assembly & Quality

| ID         | Required scope                                                                                                                                               | Source / target     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| SPEC-R7-01 | Production planning by project/machine and work centre/team; work orders for mechanical, electrical, controls/software and configurable operations.          | Spec §12, p.14 / R7 |
| SPEC-R7-02 | Material issue, actual consumption, returns, substitution and variance; operation ownership, planned/actual effort, blockers and completion evidence.        | Spec §12, p.14 / R7 |
| SPEC-R7-03 | Production output/finished-machine serial number and as-built BOM reference.                                                                                 | Spec §12, p.14 / R7 |
| SPEC-R7-04 | Reusable inspection plans, characteristics, tolerances, evidence and disposition; incoming, in-process and final inspection linked to GRN/work order/output. | Spec §12, p.14 / R7 |
| SPEC-R7-05 | NCR/CAPA: containment, root cause, corrective/preventive actions, verification and closure; rework and approved deviation/concession.                        | Spec §12, p.14 / R7 |

**Reports gate:** Work-order status, WIP, consumption/variance, productivity, readiness, inspection results, NCR ageing, rework and supplier quality.

**Acceptance gate:** Blocking NCRs/mandatory inspections prevent completion; consumption/output update inventory and cost sources; failed characteristics receive disposition; serialised output retains BOM and quality traceability.

**Dependency:** Uses released BOM, stock and purchasing from R4–R6; supplies readiness evidence for R8.

- [ ] Scope groups, reports and release-specific acceptance pass with retained evidence.
- [ ] Applicable cross-module controls and common release gates pass.

### R8 — FAT, Delivery & Commissioning

| ID         | Required scope                                                                                                                                                            | Source / target     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| SPEC-R8-01 | FAT plan, checklist/protocol, prerequisites, participants, dates and test evidence; deviations and customer observations.                                                 | Spec §13, p.15 / R8 |
| SPEC-R8-02 | Punch items with severity, owner/due date and closure; FAT approval/sign-off and dispatch controls.                                                                       | Spec §13, p.15 / R8 |
| SPEC-R8-03 | Packing list, delivery note, partial delivery, shipment/dispatch, carrier and delivery confirmation.                                                                      | Spec §13, p.15 / R8 |
| SPEC-R8-04 | Installation/site-readiness plan, engineers and site activities; SAT/commissioning checks, parameters, results, issues and customer acceptance.                           | Spec §13, p.15 / R8 |
| SPEC-R8-05 | Operator/maintenance training and attendance; handover manuals, drawings, certificates, backups, spares and signed records; warranty dates and project closure checklist. | Spec §13, p.15 / R8 |

**Reports gate:** Upcoming FAT/SAT, open punch items, dispatch readiness, site schedule, commissioning, handover completeness and delayed acceptance.

**Acceptance gate:** Dispatch reflects FAT/quality/document/commercial controls; sign-offs link to project/machine; blocking punch items prevent configured gate closure; closure requires approved handover and accountable warranty-item transfer.

**Dependency:** Uses R2 commercial commitments and R7 readiness. Handover supplies the installed-base/warranty inputs for R9.

- [ ] Scope groups, reports and release-specific acceptance pass with retained evidence.
- [ ] Applicable cross-module controls and common release gates pass.

### R9 — Finance, Workforce & After-Sales

| ID         | Required scope                                                                                                                                                                       | Source / target     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| SPEC-R9-01 | AR/AP registers, customer/supplier invoices, due dates, payment allocation and partial payments; milestone invoice requests and project payment visibility.                          | Spec §14, p.16 / R9 |
| SPEC-R9-02 | Cash, bank/reconciliation, account heads, journals, GL, assets and financial statements where full finance scope is approved.                                                        | Spec §14, p.16 / R9 |
| SPEC-R9-03 | Project material, purchase, labour, production, rework, travel and overhead costs; budget versus actual and margin.                                                                  | Spec §14, p.16 / R9 |
| SPEC-R9-04 | Employee, designation/manager, attendance, leave, overtime, timesheets and project allocation; payroll for approved localization or secure provider integration/export.              | Spec §14, p.16 / R9 |
| SPEC-R9-05 | Installed machines, serial/configuration/site, warranty; breakdown/service work, parts/time/travel and sign-off; preventive maintenance, due alerts, spares, retrofits and upgrades. | Spec §14, p.16 / R9 |

**Reports gate:** Cash/AR/AP and ageing, approved financial statements, project profitability, workforce utilization, attendance/leave/overtime, installed base, warranty, service SLA and maintenance due.

**Acceptance gate:** Milestones generate invoice requests; payment status feeds projects; costs reconcile to source transactions; finance/payroll data is restricted; delivered serialised machines have warranty/service timelines.

**Dependency:** Uses source transactions from prior releases. Finance depth and payroll countries/localization require explicit scope decisions.

- [ ] Scope groups, reports and release-specific acceptance pass with retained evidence.
- [ ] Applicable cross-module controls and common release gates pass.

### R10 — Enterprise Integration & Intelligence

| ID          | Required scope                                                                                                                                                      | Source / target      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| SPEC-R10-01 | Configurable workflow/approval matrix by role, user, department, amount, organization and document type; approve/reject/return, delegation, escalation and history. | Spec §15, p.17 / R10 |
| SPEC-R10-02 | Email, dashboard and mobile/web push; optional approved WhatsApp; cross-module dashboards, drill-down, saved filters, exports and scheduled distribution.           | Spec §15, p.17 / R10 |
| SPEC-R10-03 | APIs/webhooks, monitoring and controlled accounting, payroll, CAD/BOM and email integrations; approved customer/supplier portals.                                   | Spec §15, p.17 / R10 |
| SPEC-R10-04 | AI-assisted delay, shortage, cost and risk recommendations with source evidence and user confirmation.                                                              | Spec §15, p.17 / R10 |
| SPEC-R10-05 | Reconciliation, migration, recovery, performance, security and observability hardening; end-to-end, role, integration, recovery and production-cutover acceptance.  | Spec §15, p.17 / R10 |

**Reports gate:** Executive portfolio, project health, delivery, margin, procurement risk, quality, supplier performance, utilization, service and audit.

**Acceptance gate:** Configured approvals enforce authority/sequence; dashboard indicators drill to sources; failed integrations/notifications are visible and safely retryable; restore, performance, security and end-to-end acceptance pass.

**Dependency:** Extends earlier module integration and controls. Basic approvals, permissions, audit, validation and backup apply from each module’s launch.

- [ ] Scope groups, reports and release-specific acceptance pass with retained evidence.
- [ ] Applicable cross-module controls and common release gates pass.

## Cross-module and source-model coverage

| ID   | Requirement group                                                                                                                                                     | Applies / source                                      | Status               |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------- |
| X-01 | Machine-project anchor, configurable machine categories, source navigation and G1–G7 stage gates                                                                      | Progressive R1–R10; spec §§1,3                        | Planned / unverified |
| X-02 | Organization hierarchy, multi-role users, project membership, scoped action permissions, requester/approver separation and inactive-user controls                     | R1 and each module; spec §2                           | Planned / unverified |
| X-03 | Record IDs/numbers, organization, creator/time, owner/status, machine/project links, dates, currency/tax/net/gross, revision/superseder and standard status semantics | R1 and each transaction; spec §4                      | Planned / unverified |
| X-04 | Permission-aware global search, source navigation, version-aware attachments, comments/mentions/activity                                                              | Each applicable module; spec §16                      | Planned / unverified |
| X-05 | Unique configurable numbering, basic approvals, partial quantity/value balances, amendments, cancellation/reversal and impact checks                                  | Each transaction; spec §16                            | Planned / unverified |
| X-06 | Active references, precision/UOM/tax/rounding, terminal-state restrictions, source quantity/value limits and server-enforced transitions                              | Each applicable module; spec §16.1                    | Planned / unverified |
| X-07 | Permission-controlled PDF/CSV/XLSX/print, organization/number/revision/issue status, saved filters and responsive accessible UI                                       | Each applicable module; spec §§16–18                  | Planned / unverified |
| X-08 | Authentication, rate/session controls, least privilege, TLS/storage/secrets, sensitive data/privacy/retention and language-ready localization                         | R1 onward; spec §17                                   | Planned / unverified |
| X-09 | Append-only audit minimum fields, database constraints, transactions, concurrency/idempotency, structured correlated logs and visible failures                        | R1 onward; spec §§17,19                               | Planned / unverified |
| X-10 | Backup encryption/retention/access, restore tests, monitoring/restarts, agreed recovery/performance/load and operational owner/support                                | Every production release; spec §17                    | Decision required    |
| X-11 | All domain reports, role/filter/drill-down/metric definitions, source totals, export timestamp/user and explicit risk/overdue rules                                   | Owning R2–R9 release; enterprise R10; spec §18        | Planned / unverified |
| X-12 | Approval, schedule, supply, quality, commercial and service trigger families; deduplicated role-aware source links                                                    | Owning module; channels R10; spec §§16,18             | Planned / unverified |
| X-13 | Accounting/payroll/CAD-BOM/email/identity integration, optional messaging/portals, versioned authenticated APIs, external mapping/error queues/retries                | Approved scope, progressive handoff and R10; spec §19 | Decision required    |
| X-14 | Migration owners/templates/cleansing, masters before transactions, validation/rejections/reconciliation, preserved legacy IDs and signed acceptance                   | Every migration; spec §19.2                           | Planned / unverified |
| X-15 | Finance/payroll/tax/CAD/provider/deployment decisions and explicit exclusions; controlled scope changes and business sign-off                                         | Affected release; spec §20 and appendix B             | Decision required    |

## Common release gates

For each candidate, record owning release, requirement IDs, exact source commit, test environment, results and evidence path. Current implementation availability never changes the source release target.

- [ ] Source hashes and approved stories/clarifications match the two-source baseline.
- [ ] Happy paths, exceptions, partial processing, authorization and status transitions pass.
- [ ] Migration/import reconciliation, constraints, source totals, reports and audit pass.
- [ ] Backend/frontend builds, appropriate unit/integration tests and complete required desktop/mobile E2E pass.
- [ ] No unresolved critical defect; security findings resolved or formally accepted.
- [ ] Production-equivalent restore, monitoring, deployment and rollback validated as applicable.
- [ ] Business demonstration, evidence retention and authorized acceptance completed.
- [ ] Package versions agree; source commit and final release tag identify the accepted build.

## Historical build verification evidence

The following recorded results predate the revised specification and are retained verbatim. They are not certification of the present packages or R1–R10 scope. Original full tracker: [historical snapshot](history/2026-09-07-superseded-release-tracker.md).

| Date       | Candidate                            | Source revision | Backend build | Unit tests                                  | Frontend build                        | E2E                                                                                                                      | Spec/release decision                         | Evidence                                                        |
| ---------- | ------------------------------------ | --------------- | ------------- | ------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- | --------------------------------------------------------------- |
| 2026-08-28 | `v0.2.0-beta.1` / v2.1 working scope | No Git commit   | Pass          | 371/371 pass                                | Fail: invalid-URL diagnostic detected | Skipped; latest stored suite has 32 failures                                                                             | Not releasable                                | `logs/release-checks/20260828T094752Z-v0.2.0-beta.1/summary.md` |
| 2026-08-28 | `v2.1.0-rc.1`                        | No Git commit   | Pass          | 367/367 pass; PostgreSQL migration 2/2 pass | Pass                                  | Partial: auth, setup, current navigation/settings and critical inquiry flows verified; full desktop/mobile suite pending | PostgreSQL-testable RC; not release-certified | `logs/release-checks/20260828T211523Z-v2.1.0-rc.1/summary.md`   |

## Current review evidence and update procedure

- 2026-09-07: R2 source-code review at `fbd3bb51c25a311603bf8e8b2d282efe3516e625`; existing quote unit suite passed 5/5. This is limited evidence for old quote behavior, not R2 acceptance.
- 2026-09-07: documentation alignment retains all 86 original tracker IDs, maps the customer examples, adds 50 new-spec scope groups and 15 cross-module groups, and preserves the original source hashes. See [alignment report](plans/2026-09-07-document-alignment-report.md).
- 2026-09-07: current R2 worktree implementation passed the isolated PostgreSQL acceptance/exception suite **9/9** and the complete sales workflow on desktop and Pixel 7 mobile. Evidence covers enquiry, controlled quotation approval/customer decision, order approval, project baseline, exception transitions, authorization, evidence/activity, notifications, all seven reports, CSV/XLSX export and responsive overflow. Screenshots are retained in `test-results/release2/`; the detailed limits are recorded in the [R2 plan](plans/2026-09-07-release2-sales-project-initiation.md#11-technical-completion-update--2026-09-07). This is technical evidence against an uncommitted worktree, not final production acceptance.

1. Verify both source hashes and update changed/new requirement IDs with source and release references.
2. Resolve affected open decisions from the [baseline register](specification-baseline.md), without inventing sign-off.
3. Update observations/status only with implementation and acceptance evidence.
4. Run `npm run release:check -- <candidate>` and required PostgreSQL/E2E checks in the documented test environment.
5. Attach results, migration/recovery and manual UAT evidence to the exact commit and requirement IDs.
6. Mark the release accepted and create its final tag only when all gates pass or explicit allowed exceptions are recorded.
