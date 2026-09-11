# MachineIQ requirements and release baseline

Aligned on **07 September 2026** to these two source documents:

| Source | Authority | SHA-256 |
| --- | --- | --- |
| [Dashboard.docx](specs/Dashboard.docx) | Original customer-provided requirements. Retain its substantive requirements and customer provenance. | `3acddd37fca8a16622147664f8cfe52ee6a5a66c5877bc70c867b196577a8df2` |
| [MachineIQ ERP Product Specification v1.0](specs/MachineIQ_ERP_Product_Specification_v1.0.pdf) | Revised product scope, machine-project workflow, R1–R10 sequence, controls and acceptance boundaries. | `2b21f1ce379f43aa234fed79d3556d40e67e5014899692660dd7afec14b40c80` |

The customer document defines the original requirements; the new specification organizes and expands their delivery. The customer's suggested inventory-first development order is superseded by the new specification's sequence. Requirements are retained even when their delivery is split across releases. No older analysis, implementation shortcut or existing feature may silently remove a customer requirement.

If the two sources leave a business rule unresolved, preserve both requirements, record the issue below and resolve it in the affected story. Do not infer a scope waiver or claim client approval. The user's direction establishes these documents as the planning baseline; formal signatures and release UAT are separate evidence under the specification's governance.

## Active document set

| Document | Purpose |
| --- | --- |
| [Implementation roadmap](erp-implementation-roadmap.md) | Current R1–R10 scope, order, dependencies, reports and release acceptance |
| [Specification and release tracker](release-spec-tracker.md) | Original customer requirement IDs, revised-specification coverage, delivery targets and evidence status |
| [Release-plan PDF](specs/MachineIQ-ERP-Release-Plan.pdf) / [HTML](specs/MachineIQ-ERP-Release-Plan.html) | Client-readable release summary and customer requirement mapping |
| [R2 implementation plan](plans/2026-09-07-release2-sales-project-initiation.md) | Code-backed R2 gaps, engineering packages, migration and tests |
| [Shared release data](release-baseline.json) | Same release names, scope summaries, reports and acceptance text used by the roadmap and PDF generator; subordinate to the two source documents |
| [ADR-001](architecture-decisions/ADR-001-postgresql-system-of-record.md) | Accepted PostgreSQL implementation decision; consistent with the customer's database recommendation and the new relational-data requirements |

R1–R10 are product release identifiers. Current packages are `2.2.0-rc.2`; R2 is packaged as `2.2.0-rc.2` for verification. Software version numbers do not determine release scope. Later package versions and calendar dates have not been assigned by this alignment.

## Scope interpretations and open decisions

These entries distinguish source-preserving interpretation from a business decision that still needs an owner. They do not alter the source files.

| ID | Source / issue | Aligned treatment | State |
| --- | --- | --- | --- |
| AL-01 | Dashboard suggested development order versus specification §5 | Use R1–R10 in the new specification. Keep all customer scope in the tracker. | Aligned by user direction |
| AL-02 | Customer sales flow spans enquiry through receipt; spec §§7,13,14 | R2 enquiry/quotation/order/project and contractual milestones; R8 delivery/partial delivery; R9 invoices, receipts and partial payment allocation. Existing earlier invoice code is retained, not counted as full R9 acceptance. | Boundary established by sources |
| AL-03 | Customer purchase flow ends in supplier payment; spec §§11,14 | R6 RFQ/comparison/PO/GRN, invoice matching and payment-status/AP handoff; R9 payment transactions and allocation. | Boundary established by sources |
| AL-04 | Warehouse and employee appear in foundation and later modules; spec §§6,10,14 and appendix A | R1 warehouse master and employee identity; R5 warehouse transactions; R9 workforce depth. Missing foundation work remains visible. | Boundary established by sources |
| AL-05 | Original workflow/notification requirements; spec §§5,15–18 | Basic approvals, audit, access, module alerts and integration ship with each module. Advanced configurable workflow and provider-dependent channels are R10; WhatsApp is conditional as stated in the new spec. | Boundary established by sources |
| AL-06 | Appendix A says R18; financial text contains P &L; artefact; contents omit appendix B | Derived plans use **Section 18** and **P&L**; appendix B remains the approval/change record. Customer artefacts Plain Text / Show more lines are not business requirements; 3GL means GL. | Editorial interpretation; originals preserved |
| AL-07 | R2 approved order acceptance versus Confirmed status | Implemented separate approval history. Internal approval sets an order to Confirmed; project creation requires both conditions. | Implemented; customer UAT pending |
| AL-08 | R2 Partially Delivered/Completed status before R8 delivery | R2 pending orders mean confirmed/on-hold commercial demand. Future delivery states are reserved; fulfillment requires R8 delivery events. | Implemented source boundary |
| AL-09 | R2 correction/cancellation states and conversion cardinality unspecified | Return-for-correction restores a draft; cancellation preserves history and checks downstream use. The simple implementation defaults to one quotation family → one order → one project. This default is not an additional customer requirement. | Implemented default; customer UAT pending |
| AL-10 | R4 availability/reservation/on-order planning precedes R5 stock/R6 purchasing | R4 retains the complete planning requirement and interfaces. Live stock/reservation and purchasing-dependent acceptance is verified with R5/R6. Decide any prerequisite opening data/interface needed for standalone R4 acceptance; do not present absent stock as real availability. | Open — supply-chain/product owner |
| AL-11 | Roles, record scope, dates, tax/currency/rounding and legacy pre-sales projects | R1 is the foundation for new application development. R2 uses current permissions, own/organization access, active references, configured currencies/taxes, fixed-point calculations and controlled project conversion. No historical import or pre-order project exception is implemented. See the R2 testing record. | Implemented defaults; customer UAT pending |
| AL-12 | Finance, payroll, tax, CAD, providers, deployment and recovery (§20) | Retain the source's explicit conditional scope. Define book-of-record depth, countries, formats/providers, access and production targets before corresponding implementation/acceptance. | Open — relevant business/operations owners |

The [R2 clarification register](plans/2026-09-07-release2-sales-project-initiation.md) gives the implementation-level details. These open decisions do not authorize a different release sequence or removal of customer requirements.

## Historical material

The previous [roadmap](history/2026-09-07-superseded-erp-roadmap.md), [tracker](history/2026-09-07-superseded-release-tracker.md) and [v2.0 scope analysis](history/2026-08-27-erp-scope-analysis-v2.0.md) are archived, not active authorities. Their version labels, old release targets, percentages and test results remain historical facts. The earlier v2.0 analysis is not newer than the September Product Specification v1.0 despite its larger version label.

Dated engineering plans, existing-feature documentation and build reports describe implementation at their recorded dates. They cannot override this scope baseline. The current location of the unmodified customer document is `docs/specs/Dashboard.docx`.

## Maintenance and evidence rules

1. Verify both source hashes before changing release scope. Record source revisions and intentional requirement changes; preserve original customer provenance.
2. Retain customer IDs and add new IDs for expanded requirements. Every requirement has a source, target release, acceptance reference and evidence state.
3. Update shared release data, roadmap, tracker, PDF and affected detailed plans together. Regenerate the PDF with `node scripts/generate-erp-release-plan.cjs`; check pagination and source links.
4. Record unresolved interpretations centrally and in the affected stories. Do not present proposed business rules as approved requirements.
5. Mark implementation Done only with evidence against this baseline. Documentation alignment is not implementation completion, release certification or client signature.

Alignment verification is recorded in [the alignment report](plans/2026-09-07-document-alignment-report.md).
