# Document alignment report — 07 September 2026

## Basis and outcome

The active documentation is aligned to **both** the original customer [Dashboard.docx](../specs/Dashboard.docx) and the revised [Product Specification v1.0](../specs/MachineIQ_ERP_Product_Specification_v1.0.pdf). The customer requirements retain their provenance and coverage; the new specification defines their revised R1–R10 release sequence, machine-project workflow and acceptance boundaries.

This report concerns documentation consistency. It does not certify implementation, production readiness, client signatures or resolution of all detailed business rules.

## Changes made

| Document | Alignment applied |
| --- | --- |
| [Baseline and decisions](../specification-baseline.md) | Explicit two-source authority, source hashes, active-document index, release/version distinction and shared interpretation/decision register |
| [Roadmap](../erp-implementation-roadmap.md) | Replaced obsolete active sequence with R1–R10; each release includes source section/page, scope, reports, acceptance and dependencies |
| [Tracker](../release-spec-tracker.md) | Preserved all 86 original requirement IDs and corrected targets; added customer notification/architecture examples, 50 revised-spec scope groups and 15 cross-module groups |
| [Release-plan PDF](../specs/MachineIQ-ERP-Release-Plan.pdf) / [HTML](../specs/MachineIQ-ERP-Release-Plan.html) | Same R1–R10 scope summaries and customer mapping; links to shared baseline and outstanding decisions |
| [R2 plan](2026-09-07-release2-sales-project-initiation.md) | Added original customer source/hash, aligned references and current release boundaries; preserved code findings and labelled proposed business choices |
| [Earlier analysis entry](../specs/MachineIQ-ERP-Spec-v2.0.md) | Replaced active-looking obsolete analysis with a redirect to the current baseline and preserved historical analysis |
| [README](../../README.md) and [ADR-001](../architecture-decisions/ADR-001-postgresql-system-of-record.md) | Added active baseline links; corrected customer source location without changing the accepted database decision |
| [Shared release data](../release-baseline.json) and [PDF generator](../../scripts/generate-erp-release-plan.cjs) | Central release summary data; generation checks original source hashes before rebuilding |

The earlier roadmap, tracker and scope analysis are preserved in `docs/history/`, explicitly marked historical. Their old assignments, observations, percentages and recorded build evidence are not current scope authority. The original DOCX and new specification PDF remain unchanged.

## Verification

- Original customer source hash remains `3acddd37fca8a16622147664f8cfe52ee6a5a66c5877bc70c867b196577a8df2`.
- Revised specification hash remains `2b21f1ce379f43aa234fed79d3556d40e67e5014899692660dd7afec14b40c80`.
- All 86 original tracker IDs are retained once, with revised product-release targets; the original requirement names and historical build rows are preserved.
- All ten release names, scope summaries, report summaries and acceptance summaries agree between the shared release data, roadmap and client HTML/PDF generation source.
- New-spec expansion has 50 uniquely identified scope groups, plus 15 cross-module groups and six original-source detail groups. These are coverage groups, not a claim that the specification contains only 71 requirements.
- Active scope documents no longer prescribe the superseded v2.3 workflow, v2.4 inventory or v2.5 purchase sequence. References to these earlier targets remain only in historical material.
- Current source links resolve to `docs/specs/Dashboard.docx`; active baseline and plan links are checked for existing local targets.
- Release-plan PDF regenerated as eight pages; automated page-bound checks and visual review of the changed governance page confirm no content/footer overlap.
- Documentation diff whitespace and PDF generator syntax checks pass. Application tests were not rerun for this documentation-only alignment; the earlier R2 review's 5/5 quote-test result remains dated and limited to its recorded scope.

## Remaining decisions, without hidden scope changes

The [baseline register](../specification-baseline.md) retains unresolved order approval/status naming, delivery-state timing, conversion cardinality, correction/cancellation behavior, R4 stock/purchase prerequisites, scoped access and numeric/date policies. The source's finance, payroll, integration/provider and deployment decisions also remain explicit.

Editorial interpretations of Section 18, P&L and customer document artefacts are documented in derived plans; no source document was silently rewritten. Proposed defaults in the R2 plan require their stated business decisions before dependent implementation.

**Disposition:** Active planning documents use a consistent two-source baseline and release sequence. Open source interpretations are visible and linked; implementation and business acceptance remain separate work.
