# Plan: Macpro-Tailored Intake Form Redesign

Discovery + plan to make the opportunity intake form clean, focused, and
exactly matched to Macpro Automation Pvt Ltd (Chennai) — a Special Purpose
Machine builder serving Foundry / Machine Shop / SPM / Fabrication.

---

## Discovery — Macpro's actual business (from macproautomation.com)

**Company snapshot**
- Macpro Automation Private Limited — est. December 2013
- Chennai, Tamil Nadu (Mel Ayanambakkam, 600095)
- ~50 employees, 40+ clients, 500+ projects delivered
- Tagline: "We Build Your Dream"
- Manufacture, export, import of SPMs

**Their 4 product verticals (top-level filter on industries page)**
1. **Foundry Equipments**
2. **Machine Shop Equipments**
3. **SPM** (Special Purpose Machines)
4. **Fabrication**

**Actual machines they build** (from product gallery)
- Foundry: Core Shooting, Raiser/Riser Cutting, Decoring, Core Drilling,
  Gravity Die Cast, Jet Cooling (Closed/Open Loop), High-Pressure Cooling,
  Pump Cooling
- Machine Shop / SPM: Dry Leak Test, Washing, Trimming Press,
  Assembly Station, EOL Station, Ultrasonic with PnP
- Fabrication services

**Components they handle**: aluminium castings, cast iron components,
plastic / rubber parts (per about page), automotive parts.

**Engineering disciplines** (from job postings): Mechanical, Electrical,
Welding/Fabrication, Senior Design.

**Customer base**: 25+ logos shown — primarily automotive Tier 1/2 and
foundry OEMs in India.

---

## Problem with the current intake form

- 3 step-tabs (Machine / Performance / Constraints) feel arbitrary; user
  doesn't know which tab a field belongs in.
- Same data is split across tabs, breaking the sales engineer's flow.
- Categories are generic ("Handling / Processing / Inspection") — they
  don't match Macpro's 4 actual verticals.
- Many "Unknown" toggles add noise without value.
- Multiple fields ask for things sales doesn't know at intake stage
  (humanInteraction, complexityLevel, automationLevel, accessRequirement,
  operationMode, qualityCheckNeeded, repeatabilityNeeded — 7 fields that
  are essentially "what do you think").
- Object dimensions split into Size / Weight / Variability + Material —
  could be 2 fields.
- Process Definition section duplicates Machine Purpose section.
- No place for what sales actually needs: customer drawing attached,
  site visit done, RFQ source, repeat order flag.
- INR budget already added but the rest of the form still reads like a
  generic Western OEM template.

---

## Proposed structure: ONE scrollable page, 6 collapsible sections

No more step tabs. The discussion sidebar already lives on the right; the
intake form should be a clean vertical scroll of well-grouped sections.
Each section has a small icon + title + 1-line subtitle so scanning is fast.

### Section 1 — Inquiry Basics (always open)
What sales fills in within 30 seconds of receiving the enquiry.
- Request title
- Customer / Company (existing field, dropdown of customers)
- Customer contact person + phone/email (single line)
- Inquiry source: RFQ / Email / Site visit / Phone / Reference / Repeat customer
- Inquiry date (auto, editable)
- Priority: Low / Medium / High / Urgent
- Internal sales engineer (auto = current user, editable)

### Section 2 — Machine Required
The single most important decision — what kind of machine.
- **Machine vertical** (4 toggles): Foundry / Machine Shop / SPM / Fabrication
- **Machine type** (dropdown that narrows by vertical):
  - Foundry → Core Shooting | Raiser Cutting | Decoring | Core Drilling |
    Gravity Die Cast | Jet Cooling (Closed Loop) | Jet Cooling (Open Loop) |
    High-Pressure Cooling | Pump Cooling | Other Foundry
  - Machine Shop → Trimming Press | Washing | Assembly Station | EOL Station |
    Ultrasonic with PnP | Other Machine Shop
  - SPM → Dry Leak Test | Custom SPM | Hybrid Cell | Other SPM
  - Fabrication → Structural | Enclosure | Frame / Skid | Other
- **Build type**: New build / Retrofit / Upgrade / Clone of existing
- **Quantity**: 1 / 2 / 3-5 / 5+
- **One-line purpose** (free text, placeholder context-aware to machine type)

### Section 3 — Component / Part to Process
What the machine acts on. Concise.
- Component name (e.g. "Aluminium sump", "Brake drum casting")
- Material: Al Casting / Cast Iron / Steel / Plastic / Rubber / Composite / Other
- Approx. size (single field — `L × W × H mm`)
- Approx. weight (single field — `kg`)
- End-use industry: Automotive / Foundry / Plastic-Rubber / General Engg /
  Defence / Other
- Customer drawing/sample available? Yes / No / Pending (single toggle)

### Section 4 — Process & Output
Tech requirement — kept short.
- Target output (pph or cycle time)
- **Critical spec** (one labelled field whose label adapts to machine type):
  - Leak Test → "Target leak rate (cc/min @ bar)"
  - Cooling → "Cooling rate / temp window"
  - Die Cast → "Shot weight / cavities"
  - Trimming → "Trim force / tonnage"
  - Washing → "Cleanliness spec / millipore rating"
  - Assembly / EOL → "Operations per station / takt"
  - Default → "Critical performance spec"
- Automation level: Manual / Semi-auto / Fully-auto
- Quality / inspection notes (free text, optional)

### Section 5 — Site & Utilities
What's available at customer site.
- Floor space (`L × W mm`)
- Power available (e.g. "3-ph 415V 32A")
- Compressed air (e.g. "6 bar, 200 LPM")
- Other utilities (water / gas / vacuum / chiller — single line)
- Environment: Foundry / Machine shop / Clean assembly / Outdoor / Wet area

### Section 6 — Commercial & Next Step
What unblocks the kickoff.
- Budget range (₹ Lakhs): < 5L / 5-10 / 10-25 / 25-50 / 50L+ / Open
- Required delivery date
- Site visit done? Yes / No / Planned
- Open questions for engineering (free text)
- Attachments (drawings, photos, RFQ — file uploader)

**Total fields**: ~30 (currently ~50). Removed: humanInteraction, complexityLevel, accessRequirement, operationMode, qualityCheckNeeded, repeatabilityNeeded, dutyCycle, operatingHoursPerDay, processSummary (merged into purpose), estimatedModules, sizeRange/weightRange variability/Variability split, standardsCompliance (moved into open questions), preferredTechnology (moved into open questions).

---

## Recommended approach (TL;DR)

Replace the 3-tab stepped form with a **single-page form of 6 collapsible
sections** that mirrors the natural flow a Macpro sales engineer follows
when taking an enquiry. Replace generic categories with Macpro's 4
verticals + their actual machine catalogue. Drop ~15 low-value fields.
Keep budget in INR Lakhs. Keep the discussion sidebar.

---

## Steps (when user approves we move to implementation)

**Phase 1 — Schema & API alignment** *(parallelisable)*
1. Update `backend/src/schemas/opportunity.schema.ts`: add
   `machineVertical`, `machineType`, `quantity`, `inquirySource`,
   `componentName`, `componentSize`, `componentWeight`, `criticalSpec`,
   `attachments[]`, `siteVisitStatus`, `customerDrawingStatus`. Keep
   removed fields in schema (additive; just stop showing in form) so
   historical data isn't lost.
2. Update `backend/src/modules/opportunities/opportunities.dto.ts` to
   accept new optional fields (class-validator strings/enums).
3. Update `frontend/src/lib/opportunities.ts` — type, createEmpty,
   mapOpportunity, buildPayload for new fields.

**Phase 2 — UI rebuild** *(depends on Phase 1)*
4. Replace step-tab structure in
   `frontend/src/components/opportunities/opportunity-intake-fields.tsx`
   with vertical sections using a reusable `<CollapsibleSection>` wrapper.
   Section 1 always open; sections 2-6 open by default but collapsible
   for re-visit / mobile.
5. Implement context-aware machine-type dropdown that filters by selected
   vertical.
6. Implement adaptive label for "Critical spec" field (label changes
   based on machineType).
7. Add inquirySource pill row, customerDrawingStatus + siteVisitStatus
   toggles.
8. Add file uploader stub for attachments (wire to existing documents
   module if available, else placeholder).
9. Remove the 7 low-value fields from the form JSX (keep in schema).

**Phase 3 — Polish** *(depends on Phase 2)*
10. Update Macpro-specific placeholders one more pass for new fields.
11. Verify split-pane (form + discussion sidebar) still aligns; collapse
    sidebar below 1280px so form gets full width on tablets.
12. Run `tsc --noEmit` + restart dev server; manual smoke test.

---

## Relevant files

- `frontend/src/components/opportunities/opportunity-intake-fields.tsx` —
  full rebuild of the form body (constants block stays, structure changes
  from step-tabs to collapsible sections).
- `frontend/src/lib/opportunities.ts` — add new field types,
  createEmptyOpportunityIntakeForm, mapOpportunityToIntakeForm,
  buildOpportunityIntakePayload.
- `frontend/src/app/(app)/opportunities/[id]/page.tsx` — minor: remove
  step-tab navigation if it lives at the page level (verify location).
- `backend/src/schemas/opportunity.schema.ts` — add new optional fields.
- `backend/src/modules/opportunities/opportunities.dto.ts` — DTO additions.
- (optional) `frontend/src/components/ui/collapsible-section.tsx` — new
  small wrapper component (header + chevron + animated body).

---

## Verification

1. `cd frontend && npx tsc --noEmit` — clean.
2. `cd backend && npm run build` — clean.
3. Create a new opportunity → all 6 sections render in correct order on
   desktop split-pane; sidebar visible.
4. Select "Foundry" vertical → Machine Type dropdown shows only foundry
   machines.
5. Select "Dry Leak Test" → Critical Spec label reads
   "Target leak rate (cc/min @ bar)".
6. Save → reload → all field values persist correctly.
7. Mobile (< 768px): sections stack, sidebar drops below form, no
   horizontal scroll.
8. Existing opportunities load without errors (removed fields ignored).

---

## Decisions / scope

**In scope**
- Form structure rebuild (tabs → sections)
- Macpro-specific vertical/machine catalogue
- Context-aware critical-spec label
- Schema additions (additive only)

**Out of scope (this phase)**
- File upload backend (we'll stub the UI; wire later if attachments
  module isn't ready)
- Customer drawing OCR / AI extraction
- Quote generation
- Per-vertical custom fields beyond the critical-spec label

---

## Further considerations (decide before build)

1. **Should the 7 dropped fields be hard-deleted from schema or kept**
   for legacy data? *Recommend keep in schema, drop only from UI* —
   safest, no migration risk.
2. **File attachments now or later?** *Recommend stub the UI now, point
   to existing `/documents` module if it accepts opportunityId, else
   leave as a "coming soon" inline note.*
3. **Collapsible sections — open or closed by default?**
   *Recommend all open on first render, user can collapse; remember
   collapsed state in localStorage per user.*
