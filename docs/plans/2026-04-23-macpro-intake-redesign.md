# Macpro SPM Intake Form Redesign + Discussion Attachments

**Date:** 2026-04-23  
**Status:** Implemented & verified  
**Scope:** Opportunity intake form overhaul + discussion file attachments

---

## Summary

Replaced the 3-step tab wizard with a single-page scrollable 6-section intake form
optimised for Macpro Automation's SPM (Special Purpose Machine) inquiry workflow.
Also added file attachment support (photos, PDFs, docs) to discussion entries.

---

## Files Changed (7)

| File | Change |
|------|--------|
| `backend/src/schemas/opportunity.schema.ts` | +6 SPM-specific Mongoose fields |
| `backend/src/modules/opportunities/opportunities.dto.ts` | +6 optional DTO fields with class-validator decorators |
| `frontend/src/lib/opportunities.ts` | +6 fields to type, form helpers, budget key migration |
| `frontend/src/components/opportunities/opportunity-intake-fields.tsx` | Complete rewrite — 3-tab → 6-section scrollable (993 lines) |
| `frontend/src/components/discussion/discussion-entry-form.tsx` | File attachment UI (5 MB / 5 files limit) |
| `frontend/src/components/discussion/discussion-entry-card.tsx` | Attachment rendering (image thumbnails + file download chips) |

---

## New SPM Fields

Six fields added to both the Mongoose schema and the DTO:

| Field | Type | Values / Notes |
|-------|------|----------------|
| `machineVertical` | string (80) | `foundry` \| `machine_shop` \| `spm` \| `fabrication` |
| `quantity` | string (40) | `1` \| `2` \| `3_5` \| `5_plus` |
| `inquirySource` | string (80) | `rfq` \| `email` \| `site_visit` \| `phone` \| `reference` \| `repeat` |
| `criticalSpec` | string (500) | Free text — label is adaptive based on `machineVertical` |
| `siteVisitStatus` | string (40) | `yes` \| `no` \| `planned` |
| `customerDrawingStatus` | string (40) | `yes` \| `no` \| `pending` |

All fields are **optional** in both schema and DTO. Schema changes are additive — no migration needed.

---

## New 6-Section Form Structure

| # | Section | Key Fields |
|---|---------|------------|
| 1 | **Enquiry Basics** | Title, Customer, Contact name, Inquiry source pills, Priority pills, Internal owner |
| 2 | **Machine Required** | New / Existing cards (with inline existing-machine checklist), Vertical pills, Machine type dropdown (filtered by vertical), Build type, Quantity, Automation level, One-line purpose |
| 3 | **Component / Part** | Part name, Industry pills, Material pills, Size range, Weight range, Drawing status pills |
| 4 | **Process & Output** | Target output, Critical spec (label adapts to vertical), Process notes |
| 5 | **Site & Utilities** | Floor space, Power supply, Air/utilities, Environment pills *(collapsed by default)* |
| 6 | **Commercial & Next Steps** | Budget pills (INR Lakh scale), Delivery date, Site visit status |

### Removed
- 3-step tab navigator + step dots
- "Previous / Next step" footer buttons
- "Submit Request" → replaced by single **"Save Request"** button at bottom

### Kept
- All existing `Props` interface fields — zero breaking changes for `page.tsx` consumers
- `TemplateChecklistItem` export (backward compat)
- Existing-machine checklist (moved inline into Section 2)
- Template checklist rendering (still appears at bottom when `templateChecklist` prop provided)

---

## Budget Key Migration

Old keys (English scale) were replaced with INR Lakh scale. `normalizeBudgetRange()` in `lib/opportunities.ts` handles both old and new keys transparently:

| Old key | New key | Label |
|---------|---------|-------|
| `lt_50k` | `lt_5L` | < ₹5 L |
| `50k_100k` | `5_10L` | ₹5–10 L |
| `100k_250k` | `10_25L` | ₹10–25 L |
| `250k_plus` | `25_50L` | ₹25–50 L |
| *(new)* | `50L_plus` | ₹50 L+ |
| `unknown` | `open` | Open / TBD |

---

## Machine Dropdown Filtering

Section 2 exposes a `MACHINES_BY_VERTICAL` record. Selecting a vertical pill immediately
filters the machine-type dropdown to only relevant options and clears the current
`machineCategory` selection:

| Vertical | Available machine types |
|----------|------------------------|
| Foundry | Core shooter, Sand mixer, Knock-out, Shot blaster, Die casting |
| Machine shop | CNC turning, CNC milling, Gear hobbing, Surface grinder, Honing |
| SPM | Assembly SPM, Testing SPM, Welding fixture, Press / Riveting, Leak testing |
| Fabrication | Laser cutting, Press brake, Welding positioner, Plate rolling, Deburring |
| *(none selected)* | All categories (original list) |

---

## Discussion File Attachments

### How it works
Files are read as base64 data-URLs client-side and stored in the existing
`attachments: string[]` field — no new backend endpoint or multer config required.

### Limits
- Max **5 files** per discussion entry
- Max **5 MB** per file (enforced with user-visible error)
- Accepted types: `image/*`, `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.txt`

### Rendering (`discussion-entry-card.tsx`)
- **Images**: 64×64 thumbnail, opens full-size in new tab on click
- **Documents**: file chip with `FileText` icon + filename, opens data-URL in new tab

---

## E2E Test Results

Suite: 84 tests (2 workers, Playwright)

**Key opportunity tests — all pass:**
- ✓ `creates an opportunity through the form flow` (test 21)
- ✓ `filters opportunities and opens the detail page` (test 20)
- ✓ `surfaces create-opportunity backend validation errors` (test 23)

**Pre-existing failures (unrelated to this change):**
| Test | Area | Reason |
|------|------|--------|
| Dashboard metrics & bottlenecks | Dashboard | API data fixture mismatch |
| Notification toggles count | Settings | Toggle count/state fixture issue |
| Converts opportunity → project form | Project creation | Mock route `opp-1` not returning `Convert to Project` link |
| Persisted preferences | Settings | LocalStorage persistence fixture |
| Platform tab info rows | Settings | Stack info endpoint fixture |
| Env config advisory | Settings | Platform config fixture |
| Project workspace tab navigation | Projects | Tab timing issue |
| Advances through design/procurement | Projects | Stage transition fixture |

No regressions introduced by this change.

---

## Build Verification

```
frontend/ $ npx tsc --noEmit    →  clean (no output)
backend/  $ npm run build       →  clean (nest build succeeded)
```
