# Release 2 implementation and verification

Release 2 adds Sales and Machine Project Initiation to the Release 1 foundation. The governing requirements remain [Dashboard.docx](specs/Dashboard.docx) and the [revised product specification](specs/MachineIQ_ERP_Product_Specification_v1.0.pdf). This is new application development: no historical commercial import or reconciliation subsystem is required.

## Delivered flow

Open **Sales → Enquiries**. Record the customer, its site, exact machine quantity, dates, source and seven requirement summaries. Save drafts as work progresses. Qualify the enquiry and create a quotation with scope, exclusions, warranty, priced lines, taxes, validity, delivery terms and payment milestones.

Submit the quotation for internal approval, mark it as sent, and record the customer's acceptance reference or rejection reason. An accepted quotation creates one sales order with its original lines and commercial information. The order requires a customer PO reference and internal approval before it becomes Confirmed. A confirmed order creates one machine project with a project manager, dates, site, category, source references and immutable commercial baseline.

Approved quotations use numbered revisions. A new draft does not displace the operational revision; approval supersedes the preceding version. Comparison shows changed fields and added, removed or changed lines. The source document remains attached to an existing order or project when a later quotation revision is approved.

Comments, customer communication notes, protected PDF/PNG/JPEG attachments, activity history, status actions and in-app alerts are included. Reports cover pipeline, quotation conversion, quotations by customer, orders by month/customer, pending orders, contractual payment milestones and project intake, with scoped source links and CSV/Excel/print output.

## Simple operating rules

- Release 1 supplies users, roles, permissions, organization, customers, items and units. One active organization initializes sales access. Sales users default to their own records; administrators, managers and leadership default to organization scope. API access assignment can narrow or widen an individual user's scope.
- A separate authorized approver is required by default. Administrators can configure that rule, currency precision, allowed tax rates and document prefixes in Sales settings.
- Quantities and unit prices retain up to six decimal places. Money is calculated with integer arithmetic and half-up rounding per line at the document currency precision. Milestone amounts must equal gross contract value. Item-linked lines use the item's master unit.
- One accepted quotation family creates one order family; one confirmed order creates one project. Requests are transactional and retry-safe. Stale versions and repeated conversions are rejected.
- Order lines preserve the accepted quotation. Order terms and schedules can be revised and reapproved before project initiation. Once a project baseline exists, order amendment is blocked rather than silently changing the project. Engineering change control belongs to R3.
- Cancellation retains history and requires downstream work to be resolved first. R2 does not simulate delivery, invoicing or receipts. Delivery is R8; finance transactions are R9.
- Conversion rate counts families ever accepted divided by first-issued families in the selected first-issue date cohort. Order intake uses first-confirmation month in organization time and current approved values; cancelled orders are excluded. Currency totals remain separate.

## Implementation locations

| Area | Location |
| --- | --- |
| Schema, constraints and permissions | `backend/src/database/migrations/202609070001-Release2Sales.ts` |
| API, validation, calculations and lifecycle | `backend/src/modules/sales/` |
| Sales workspace | `frontend/src/components/sales/sales-workspace.tsx`, `/sales`, `/sales/[id]` |
| Existing project handoff and bypass protection | `backend/src/modules/projects/`, quotation/enquiry conversion controllers |
| Guided feedback | `frontend/src/components/feedback/feedback-widget.tsx` |

The feedback form selects the current section, offers common issue descriptions and makes additional text optional after a choice. The description fills the available width. Existing screenshots, diagnostic context, user tracking and administrator responses remain available.

## Repeatable checks

Run from the repository root:

```powershell
npm.cmd --prefix backend run build
npm.cmd --prefix backend test -- --runInBand
node scripts/test-release2.cjs
npm.cmd --prefix frontend run build
```

The R2 database runner uses the configured `backend/.env` connection and creates a uniquely named `machineiq_r2_test_<digits>` schema. It does not reset or delete existing tables. It tests migration application and empty-schema reversal, master ownership, approvals, idempotency under concurrent requests, project creation, immutable history/content, revisions, reports, attachments, rejection/expiry, amendments, active accounts and revoked permissions. Retained fixture schemas can be removed separately after evidence review; never reset the public schema for these tests.

For real-browser acceptance, use the printed schema name. The following review server only changes the test fixture's credentials and starts the API against that schema. The optional port avoids replacing an existing local API:

```powershell
node scripts/review-release2-server.cjs machineiq_r2_test_<digits> 4053
```

With the frontend running on port 4050, run in another terminal:

```powershell
node scripts/test-release2-browser.cjs http://localhost:4053/api
```

The browser runner sends its API requests to the isolated review server. It uses test-only accounts, confirms the fixture organization before creating records, and exercises both desktop and Pixel 7 layouts. Screenshots are saved under `test-results/release2/`. Stop the review server when finished.

The focused feedback checks use mocked API fixtures and verify both submission styles, user/admin tracking, disabled collection and full-width layout:

```powershell
cd frontend
node node_modules/@playwright/test/cli.js test tests/feedback.spec.ts --workers=1
```

## Evidence and release status

On 10 September 2026, after closing the expanded R1 dependencies, the backend regression suite passed **33 suites / 444 tests**, the R2 isolated PostgreSQL suite passed **9/9 workflow scenarios**, and backend/frontend production build and type checking passed. The earlier 7 September browser evidence remains **6 feedback tests** plus the full sales workflow on **desktop and Pixel 7**, including tabbed forms, attachment refresh correction, separate approval, reports, exports and scoped project access. Browser UAT against the final published candidate remains a release gate.

This is implementation/test evidence, not customer UAT or production deployment approval. Customer acceptance, production backup/restore rehearsal, workload targets and a tagged deployment remain release activities. No production deployment or historical data import is claimed.
