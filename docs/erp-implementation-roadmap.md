# MachineIQ ERP Implementation Roadmap

Aligned on **07 September 2026** to the original customer [Dashboard.docx](specs/Dashboard.docx) and the revised [Product Specification v1.0](specs/MachineIQ_ERP_Product_Specification_v1.0.pdf). The customer requirements are retained; the new specification supplies the machine-project workflow and release sequence. See [baseline and interpretation rules](specification-baseline.md).

## Release sequence

| Release | Scope                                 | Source         |
| ------- | ------------------------------------- | -------------- |
| R1      | Foundation & Master Data              | Spec §6, p.8   |
| R2      | Sales & Machine Project Initiation    | Spec §7, p.9   |
| R3      | Project Planning & Engineering        | Spec §8, p.10  |
| R4      | BOM & Material Planning               | Spec §9, p.11  |
| R5      | Inventory & Warehousing               | Spec §10, p.12 |
| R6      | Purchase & Supplier Management        | Spec §11, p.13 |
| R7      | Production, Assembly & Quality        | Spec §12, p.14 |
| R8      | FAT, Delivery & Commissioning         | Spec §13, p.15 |
| R9      | Finance, Workforce & After-Sales      | Spec §14, p.16 |
| R10     | Enterprise Integration & Intelligence | Spec §15, p.17 |

The Machine Project is the central record. Follow Enquiry → Quotation → Sales Order → Machine Project → Engineering → BOM → Availability → Purchase → Assembly → Quality → FAT → Delivery → SAT/Commissioning → Invoice → Warranty → Service. Integrate each new module with the records already delivered.

## Delivery boundaries

- Original customer requirement IDs and new-spec coverage are maintained in the [active tracker](release-spec-tracker.md). No release is certified by this roadmap.
- R1 includes employee identity, warehouse master, tax/currency/reference statuses and access. Reconcile these against existing R1 functionality before using them as downstream dependencies.
- R2 includes basic sales approvals and agreed payment milestones. Delivery/partial delivery is R8; payment transactions and allocation are R9.
- R4 retains availability and shortage planning. Live R5 stock/reservations and R6 on-order inputs integrate progressively; prerequisite data and acceptance staging remain explicit under AL-10.
- Basic approval, permission, audit, validation, backup/recovery and module integration are continuous requirements. R10 extends them with enterprise workflows and provider-dependent channels.
- PostgreSQL remains the accepted system of record under [ADR-001](architecture-decisions/ADR-001-postgresql-system-of-record.md). Deployment topology and operational targets follow the source decisions.
- R1–R10 identify product scope. Current packages are `2.2.0-rc.2`; the proposed R2 version is `2.2.0`. Later package versions and delivery dates require separate scheduling.

## R1 — Foundation & Master Data

**Outcome:** Trusted organization, identity and reusable business masters.

**Source:** Product Specification §6, p.8.

### Scope

- Company profile, legal/tax details, branches, physical locations, departments, currency, timezone and fiscal settings.
- Users, employee identity, roles, permissions, credentials and access assignments; active/inactive controls.
- Customer and supplier codes, addresses/sites, contacts, tax data, currencies, payment terms and supplier lead times.
- Items, categories, UOM, make/buy, cost, selling price, manufacturer/part number, stock flag and reorder level.
- Warehouse master, configurable tax/VAT, currency, reference statuses, document types and numbering series.

**Reports:** Master completeness, active users/roles, customer and supplier lists, item catalogue and change history.

**Acceptance:** Administrators configure hierarchy/access without code changes; duplicate codes and invalid mandatory data are rejected; privileged changes are audited; downstream modules select consistent masters.

**Dependencies and boundary:** Foundation for every release. Workforce operations expand in R9; stock transactions start in R5.

## R2 — Sales & Machine Project Initiation

**Outcome:** Accepted demand becomes an approved order and a traceable machine project.

**Source:** Product Specification §7, p.9.

### Scope

- Enquiry: machine/application, quantity, target delivery, customer site, source and attachments; requirements for use, capacity, interfaces, utilities, constraints, standards and customer-provided items.
- Technical-commercial quotation: scope, exclusions, price/tax, validity, delivery, warranty and payment milestones.
- Quotation revisions/comparison, internal approval, customer acceptance/rejection and conversion history.
- Sales order: customer PO, ordered scope/value, delivery, payment milestones and special terms.
- Project creation from accepted order: project code/owner, machine category, site, dates, value and baseline; communications, comments, attachments, activity and status dashboard.

**Reports:** Sales pipeline, quotation conversion, quotations by customer, orders by month/customer, pending orders, payment milestone schedule and project intake.

**Acceptance:** Accepted quote creates an order without re-entry; approved order creates a project with source references; every revision remains visible and only the current approved version is operational; required references, dates and values are validated.

**Dependencies and boundary:** Uses R1 masters. Basic approvals ship here. Delivery execution is R8; invoices and payment allocation are R9.

**Implementation status (2026-09-07):** The application slice is implemented and its isolated PostgreSQL acceptance/exception suite passes **9/9**. Desktop and Pixel 7 browser workflows pass through enquiry, controlled quotation approval and customer acceptance, sales order approval, project creation, evidence, reports and CSV/XLSX export. See the [R2 implementation plan and technical completion record](plans/2026-09-07-release2-sales-project-initiation.md#11-technical-completion-update--2026-09-07). Final release certification still requires a committed candidate, package/version alignment, full regression and release checks, production-equivalent migration/restore and performance evidence, resolved or accepted business clarifications, and authorized UAT/sign-off.

## R3 — Project Planning & Engineering

**Outcome:** Engineering responsibilities, dates, documents and changes are controlled.

**Source:** Product Specification §8, p.10.

### Scope

- Project templates, phases, milestones, stage gates, planned dates and responsible departments.
- Mechanical, electrical, controls/software and other work packages; engineer/team allocation, task ownership, dependencies, effort, dates and completion evidence.
- Requirement register with source, owner, priority, verification method, status and evidence links.
- Document/drawing register, revision, review, approval, release and superseded history; design-review actions and decisions.
- Risk, issue and action registers; engineering changes with affected records, cost/schedule impact, approval and implementation tracking.

**Reports:** Timeline/project health, milestone performance, overdue tasks, workload, document status, requirement coverage, risk exposure and change impact.

**Acceptance:** Managers assign dependent work; released documents require new revisions for change; change history identifies affected records; progress derives from controlled work.

**Dependencies and boundary:** Builds on the R2 project baseline; provides engineering ownership and release control for R4.

## R4 — BOM & Material Planning

**Outcome:** Progressive engineering BOM becomes controlled material demand.

**Source:** Product Specification §9, p.11.

### Scope

- Preliminary, engineering and manufacturing BOMs; multi-level assemblies, configurable sections and engineer/work-package ownership.
- Lines: item, quantity/UOM, make/buy, required date, preferred supplier, manufacturer part, cost and notes; validated new-item creation during authoring.
- Alternatives/substitutions, customer-supplied and non-stock items, scrap allowance and long-lead identification.
- Revision comparison, line-change history, approval and partial section release before the full assembly BOM is complete.
- Availability, reservations, on-order quantities, shortages and required-by dates; estimated cost versus budget; CSV/Excel import/export and CAD/BOM import preparation.

**Reports:** BOM cost, revision variance, shortages, long-lead items, make/buy, unreleased sections and material readiness.

**Acceptance:** Designers contribute independently; only released quantities drive demand; revisions show added/removed/changed lines; demand retains project, machine, BOM revision and required date.

**Dependencies and boundary:** Uses R1–R3. Availability/reservation and purchase views connect progressively as R5/R6 introduce live stock and purchasing.

## R5 — Inventory & Warehousing

**Outcome:** Available, reserved and moving stock is visible by project.

**Source:** Product Specification §10, p.12.

### Scope

- Warehouse, zone/bin or configurable storage locations; opening balance, stock in/out, transfer, adjustment and cycle count.
- Stock ledger and balances by item/location, with batch/lot and serial tracking where enabled.
- Project reservation, allocation/deallocation, material issue and unused-material return.
- Available-to-promise separates on-hand, reserved, available, inspection and blocked stock; minimum stock, reorder proposals and alerts.
- Negative-stock policy, controlled adjustment approval, organization valuation method and complete movement history.

**Reports:** Current stock, reservations, movements, valuation, ABC analysis, slow-moving items, shortages, cycle-count variance and reorder list.

**Acceptance:** Posting changes balances atomically; posted records cannot be edited; reversal creates linked counter-transactions; stock conditions remain distinct; issues cannot exceed permitted availability/reservation.

**Dependencies and boundary:** Uses R1 masters and R4 released demand. Connects inventory to R6 receipts and R7 production.

## R6 — Purchase & Supplier Management

**Outcome:** Project shortages are procured and supplier commitments are controlled.

**Source:** Product Specification §11, p.13.

### Scope

- Purchase requests from released BOM shortages or manual entry, with requester, project, need date and justification; module approval.
- RFQs to suppliers; quotation capture for price, tax, lead time, validity, freight, terms, deviations and documents.
- Technical/commercial comparison and supplier selection with justification.
- PO with project/BOM references, delivery schedule, terms, approval and dispatch status; amendments/history and controlled outstanding-quantity closure.
- Partial GRN, inspection/accepted/rejected quantities, purchase returns and pending balances; supplier invoice matching, payment status and AP handoff.

**Reports:** Open POs, pending/delayed deliveries, purchase/price history, supplier performance, pending GRN/inspection and project purchase cost.

**Acceptance:** Released shortages create requests without re-entry; selection records its reason; partial receipts update pending quantity/inspection stock; PO amendments retain prior versions and reapproval.

**Dependencies and boundary:** Uses R4/R5. Quality inspection integrates with R7; supplier payment processing and allocation are R9.

## R7 — Production, Assembly & Quality

**Outcome:** Machines are built with controlled material, inspection and rework records.

**Source:** Product Specification §12, p.14.

### Scope

- Production planning by project/machine and work centre/team; work orders for mechanical, electrical, controls/software and configurable operations.
- Material issue, actual consumption, returns, substitution and variance; operation ownership, planned/actual effort, blockers and completion evidence.
- Production output/finished-machine serial number and as-built BOM reference.
- Reusable inspection plans, characteristics, tolerances, evidence and disposition; incoming, in-process and final inspection linked to GRN/work order/output.
- NCR/CAPA: containment, root cause, corrective/preventive actions, verification and closure; rework and approved deviation/concession.

**Reports:** Work-order status, WIP, consumption/variance, productivity, readiness, inspection results, NCR ageing, rework and supplier quality.

**Acceptance:** Blocking NCRs/mandatory inspections prevent completion; consumption/output update inventory and cost sources; failed characteristics receive disposition; serialised output retains BOM and quality traceability.

**Dependencies and boundary:** Uses released BOM, stock and purchasing from R4–R6; supplies readiness evidence for R8.

## R8 — FAT, Delivery & Commissioning

**Outcome:** Machines are accepted, delivered, installed and formally handed over.

**Source:** Product Specification §13, p.15.

### Scope

- FAT plan, checklist/protocol, prerequisites, participants, dates and test evidence; deviations and customer observations.
- Punch items with severity, owner/due date and closure; FAT approval/sign-off and dispatch controls.
- Packing list, delivery note, partial delivery, shipment/dispatch, carrier and delivery confirmation.
- Installation/site-readiness plan, engineers and site activities; SAT/commissioning checks, parameters, results, issues and customer acceptance.
- Operator/maintenance training and attendance; handover manuals, drawings, certificates, backups, spares and signed records; warranty dates and project closure checklist.

**Reports:** Upcoming FAT/SAT, open punch items, dispatch readiness, site schedule, commissioning, handover completeness and delayed acceptance.

**Acceptance:** Dispatch reflects FAT/quality/document/commercial controls; sign-offs link to project/machine; blocking punch items prevent configured gate closure; closure requires approved handover and accountable warranty-item transfer.

**Dependencies and boundary:** Uses R2 commercial commitments and R7 readiness. Handover supplies the installed-base/warranty inputs for R9.

## R9 — Finance, Workforce & After-Sales

**Outcome:** Project cost, cash, people and installed-machine service history are connected.

**Source:** Product Specification §14, p.16.

### Scope

- AR/AP registers, customer/supplier invoices, due dates, payment allocation and partial payments; milestone invoice requests and project payment visibility.
- Cash, bank/reconciliation, account heads, journals, GL, assets and financial statements where full finance scope is approved.
- Project material, purchase, labour, production, rework, travel and overhead costs; budget versus actual and margin.
- Employee, designation/manager, attendance, leave, overtime, timesheets and project allocation; payroll for approved localization or secure provider integration/export.
- Installed machines, serial/configuration/site, warranty; breakdown/service work, parts/time/travel and sign-off; preventive maintenance, due alerts, spares, retrofits and upgrades.

**Reports:** Cash/AR/AP and ageing, approved financial statements, project profitability, workforce utilization, attendance/leave/overtime, installed base, warranty, service SLA and maintenance due.

**Acceptance:** Milestones generate invoice requests; payment status feeds projects; costs reconcile to source transactions; finance/payroll data is restricted; delivered serialised machines have warranty/service timelines.

**Dependencies and boundary:** Uses source transactions from prior releases. Finance depth and payroll countries/localization require explicit scope decisions.

## R10 — Enterprise Integration & Intelligence

**Outcome:** The platform gains enterprise workflows, integration and cross-module intelligence.

**Source:** Product Specification §15, p.17.

### Scope

- Configurable workflow/approval matrix by role, user, department, amount, organization and document type; approve/reject/return, delegation, escalation and history.
- Email, dashboard and mobile/web push; optional approved WhatsApp; cross-module dashboards, drill-down, saved filters, exports and scheduled distribution.
- APIs/webhooks, monitoring and controlled accounting, payroll, CAD/BOM and email integrations; approved customer/supplier portals.
- AI-assisted delay, shortage, cost and risk recommendations with source evidence and user confirmation.
- Reconciliation, migration, recovery, performance, security and observability hardening; end-to-end, role, integration, recovery and production-cutover acceptance.

**Reports:** Executive portfolio, project health, delivery, margin, procurement risk, quality, supplier performance, utilization, service and audit.

**Acceptance:** Configured approvals enforce authority/sequence; dashboard indicators drill to sources; failed integrations/notifications are visible and safely retryable; restore, performance, security and end-to-end acceptance pass.

**Dependencies and boundary:** Extends earlier module integration and controls. Basic approvals, permissions, audit, validation and backup apply from each module’s launch.

## Definition of done for every release

- Approved stories match both-source traceability and the revised release boundary.
- Happy paths, exceptions, partial processing, permissions and transitions pass.
- Data validation, constraints, migration reconciliation, audit and reports agree.
- Automated checks and manual regression pass; no unresolved critical defect remains.
- Authorization/sensitive-data checks pass and findings are resolved or formally accepted.
- Deployment, monitoring, error handling, migration/recovery and backup/restore are documented and tested as applicable.
- Business demo, retained evidence and authorized UAT sign-off complete acceptance.

Use the [baseline decision register](specification-baseline.md) for remaining business choices and the [tracker](release-spec-tracker.md) for evidence. The [client release-plan PDF](specs/MachineIQ-ERP-Release-Plan.pdf) summarizes the same sequence. The [previous roadmap](history/2026-09-07-superseded-erp-roadmap.md) is historical only.
