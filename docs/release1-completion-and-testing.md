# Release 1 completion and verification

The governing baseline is the original customer [Dashboard.docx](specs/Dashboard.docx) together with [MachineIQ ERP Product Specification v1.0](specs/MachineIQ_ERP_Product_Specification_v1.0.pdf). Their registered SHA-256 values were rechecked on 10 September 2026 and remain unchanged. Product Specification §6 controls the R1 boundary; the original document retains requirement provenance.

## Closed R1 dependency gaps

| Area | Completion evidence |
| --- | --- |
| Employee identity | Independent employee master with optional login, department and manager relationships; active control, validation, audit and administration UI |
| Warehouse master | Warehouse code/name, physical location and responsible manager; validation, audit and administration UI. Stock zones, bins and movements remain R5 |
| Currency and tax | Seeded ISO currencies, configurable precision, organization tax rates and effective dates |
| Reference statuses | Configurable module status labels/order/terminal state with common seeds; owning modules adopt these progressively |
| Roles and permissions | Referential role rows, configurable custom roles, protected system roles, role-id permission grants, active-role checks and authorization regression coverage |
| Item policy | Stored item defaults, server validation, HSN/SAC policy and prevention of items disabled for both sales and purchasing |
| Readiness dashboard | R1 setup cannot report complete until warehouse, employee, currency, tax and status masters exist |
| Deployment posture | Public PostgreSQL allow-list removed from the Render Blueprint; application services use the private database connection |

The schema change is additive and is applied by `202609100001-Release1Completion.ts`. It is included in normal startup/pre-deploy migrations and was applied successfully in the isolated PostgreSQL acceptance schema used by R2.

## Verification record — 10 September 2026

```text
Backend production build                 PASS
Backend regression                      PASS — 33 suites / 444 tests
Isolated PostgreSQL R2 acceptance        PASS — 9/9 scenarios
Frontend production build/type checking PASS — 33 routes
Migration/config regression              PASS
Source-document hashes                   PASS — unchanged from registered baseline
```

R1 and R2 are therefore technically ready to form the candidate on which R3 development is based. This does not replace customer UAT, production-equivalent backup/restore rehearsal, performance evidence, version/tag approval or an authorized deployment. Those are publication controls, not unfinished R3 application dependencies.
