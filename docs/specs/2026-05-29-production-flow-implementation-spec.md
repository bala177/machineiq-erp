# MachineIQ — Production Flow Implementation Spec
**Date:** 2026-05-29  
**Status:** Implementation spec  
**Scope:** Customer → Machine Inquiry → Discussion → Quote → Project Kickoff/Planner → Invoice

---

## Purpose

MachineIQ has the right end-to-end business spine, but several handoffs are still too thin for a professional production app.

This spec defines the clean target architecture and a phased implementation plan. Each phase should be usable on its own before the next phase starts.

---

## Core Decision

An accepted quotation is the commercial baseline.

It should unlock two separate downstream flows:

- **Delivery flow:** accepted quote → project kickoff → planning → execution
- **Billing flow:** accepted quote → invoice → payment tracking

Project and invoice records must stay separate. They answer different business questions:

- **Project:** how will we deliver the machine?
- **Invoice:** how will we bill and collect money?
- **Quote:** what commercial offer did the customer accept?
- **Opportunity:** what customer requirement are we pursuing?

---

## Target Flow

```text
Customer
  └─ Machine Inquiry / Opportunity
       ├─ Discussion, files, open questions, decisions
       ├─ Quote 1: declined / expired / superseded
       ├─ Quote 2: declined / expired / superseded
       └─ Quote N: accepted
              ├─ Project kickoff and planner
              └─ Draft invoice
```

---

## Current State Summary

### Exists

- Customer master and customer commercial fields
- Machine inquiry intake, review, approval, conversion
- Opportunity discussion board
- Quote lifecycle: `draft`, `sent`, `accepted`, `declined`, `expired`
- Accepted quote can create a project
- Accepted quote can create a draft invoice
- Project workspace with machine architecture, tasks, components, procurement, documents, decisions
- Minimal invoice status and payment recording

### Not Yet Production-Level

- No quote revision/supersede model
- No enforced single accepted quote per opportunity
- No formal acceptance evidence or customer PO artifact
- Project kickoff is display-heavy, not an operational workspace
- Project planner lacks editable timeline/dependency/resource planning
- Invoice lacks PDF, send, payment history, overdue automation, credit notes
- Files are partly stored as base64/data URLs
- Audit trail is inconsistent across modules
- Number generation is not concurrency-safe

---

## Phase 1 — Commercial Baseline Hardening
**Priority:** Critical  
**Goal:** Make quote acceptance clean, auditable, and safe.

### Build

- Add quote status `superseded`.
- Add quote revision fields:
  - `revisionNo`
  - `parentQuoteId`
  - `supersededByQuoteId`
- Enforce at most one active accepted quote per opportunity unless an admin explicitly supersedes the old accepted quote.
- Add acceptance metadata:
  - `acceptedAt`
  - `acceptedBy`
  - `customerPoNumber`
  - `acceptedByCustomerName`
  - `acceptanceNotes`
  - `acceptanceDocumentIds`
- Add a clear “Record Acceptance” modal instead of a bare accept button.

### Backend Rules

- Only `sent` quotes can be accepted.
- Accepting a quote checks for an existing accepted quote on the same opportunity.
- Superseding an accepted quote requires manager/admin role.
- Accepted quote line items and totals become immutable.
- Draft quotes can be edited; sent quotes require revision/duplicate flow.

### UI

- Quote detail shows:
  - current status
  - revision number
  - source inquiry/customer
  - acceptance metadata
  - downstream project/invoice links
- Opportunity quote panel highlights the accepted baseline quote.

### Acceptance Criteria

- A user cannot accidentally accept two quotes for the same inquiry.
- A user can see why a quote was accepted and what evidence supports it.
- A new quote revision does not overwrite historical quote data.

---

## Phase 2 — Customer 360
**Priority:** High  
**Goal:** Make customer the commercial source of truth.

### Build

- Add customer timeline combining:
  - machine inquiries
  - discussion activity
  - quotes
  - projects
  - invoices
  - payments
- Add multi-contact model:
  - buying contact
  - technical contact
  - accounts payable contact
  - site/plant contact
- Add site/plant addresses separate from billing/shipping.
- Add account owner / sales owner.
- Add customer-level commercial constraints:
  - default currency
  - payment terms
  - credit limit
  - tax treatment
  - default billing contact

### Backend Rules

- Quotes and invoices use customer snapshots, not live mutable customer fields.
- Customer delete should be blocked or restricted when active quotes, projects, or invoices exist.

### Acceptance Criteria

- A sales user can open a customer and understand all active commercial/project exposure.
- A quote/invoice remains historically correct after customer details change.

---

## Phase 3 — Inquiry Discussion and Decision Governance
**Priority:** High  
**Goal:** Turn discussion into an auditable requirements record.

### Build

- Add mentions with notifications.
- Add open-question owner and due date.
- Add question resolution workflow:
  - open
  - answered
  - accepted
  - closed
- Add formal decision entries with:
  - decision
  - rationale
  - impact
  - decided by
  - affected quote/project fields
- Add discussion attachments using real file storage.
- Extend discussion support to projects and quotes, not only opportunities.

### Backend Rules

- Only author/admin can edit a note.
- Decisions should be append-only after a configurable lock window.
- Open questions must be resolved before opportunity approval if marked blocking.

### Acceptance Criteria

- A PM can see unresolved customer questions before approving an inquiry.
- Decisions survive as a traceable commercial/technical record.

---

## Phase 4 — Project Kickoff Workspace
**Priority:** Critical  
**Goal:** Convert accepted commercial scope into delivery readiness.

### Build

- Dedicated kickoff edit workspace with:
  - kickoff date
  - attendees
  - agenda
  - scope summary
  - exclusions
  - risks
  - action items
  - decisions
  - initial milestones
  - project team
- Import from accepted quote:
  - line items
  - commercial scope
  - terms
  - customer delivery target
- Import from inquiry:
  - machine requirements
  - references/files
  - open decisions
  - constraints
- Add “Kickoff Complete” gate.

### Backend Rules

- Project created from quote starts in `feasibility` or `kickoff` state.
- Project cannot move to `engineering_in_progress` until kickoff is complete.
- Kickoff completion requires:
  - project manager
  - team assigned
  - at least one milestone
  - scope summary
  - risk review

### Acceptance Criteria

- PM can start from an accepted quote and produce a complete kickoff record.
- Engineering cannot start without explicit kickoff completion.

---

## Phase 5 — Project Planner
**Priority:** Critical  
**Goal:** Make projects plannable, not only trackable.

### Build

- Editable milestone planner.
- Task templates by machine/category/module.
- Dependency editor.
- Gantt/timeline view.
- Planned vs actual dates.
- Resource assignment and workload view.
- Stage gate rules:
  - kickoff complete → engineering
  - design release complete → procurement
  - procurement critical items received → build
  - FAT/SAT complete → completed

### Backend Rules

- Stage transitions must be validated by backend, not only UI.
- Task dependencies cannot create cycles.
- Completing a stage records who moved it and why.
- Baselines are immutable snapshots; replans create new baseline revisions.

### Acceptance Criteria

- A PM can create a credible project plan from the accepted quote.
- Delays and blockers are visible against the baseline.
- Stage progression is explainable and auditable.

---

## Phase 6 — Professional Invoice and Payments
**Priority:** High  
**Goal:** Make invoices usable by finance.

### Build

- Invoice PDF/print view.
- Send invoice action.
- Invoice email tracking:
  - sentAt
  - sentBy
  - recipient
- Payment history records:
  - amount
  - paymentDate
  - method
  - referenceNo
  - notes
- Milestone billing:
  - advance invoice
  - progress invoice
  - final invoice
  - retention if needed
- Overdue processing.
- Credit note / void reason.
- Tax summary.

### Backend Rules

- Draft invoices can be edited.
- Sent invoices require revision/credit note flow for financial corrections.
- Payment cannot exceed invoice balance.
- Paid invoices cannot be voided without credit note/admin process.
- Overdue status should be computed or scheduled, not manually guessed.

### Acceptance Criteria

- Finance can issue, track, and close invoices from accepted quotes.
- Invoice history is clear enough for audit.
- Partial payments and overdue invoices are visible.

---

## Phase 7 — File Storage and Document Control
**Priority:** High  
**Goal:** Replace fragile base64 attachments with production document handling.

### Build

- File storage abstraction:
  - local storage for dev
  - S3/Azure Blob compatible production storage
- Document metadata:
  - entityType
  - entityId
  - fileName
  - mimeType
  - size
  - storageKey
  - uploadedBy
  - uploadedAt
  - version
- Document categories:
  - RFQ
  - drawing
  - quote
  - PO
  - invoice
  - MOM
  - FAT/SAT
- Versioning and replacement flow.
- Download permission checks.

### Backend Rules

- File records should be soft-deleted.
- Storage cleanup should be handled separately from metadata deletion.
- Large files must not be stored inside MongoDB documents.

### Acceptance Criteria

- Users can upload/download files without bloating database records.
- Each customer/inquiry/quote/project/invoice can show its related documents.

---

## Phase 8 — Audit, Permissions, and Production Hardening
**Priority:** Critical  
**Goal:** Make the system reliable under real usage.

### Build

- Consistent audit logging for all state-changing endpoints.
- Atomic number generation for:
  - request numbers
  - quote numbers
  - project numbers
  - invoice numbers
- Database migrations/versioned schema changes.
- Stronger RBAC:
  - sales
  - manager
  - project manager
  - designer/engineer
  - procurement
  - finance
  - admin
  - leadership
- Replace JWT localStorage storage with safer auth handling.
- End-to-end tests for:
  - customer → inquiry
  - inquiry → quote
  - quote accepted → project
  - quote accepted → invoice
  - invoice payment
- Observability:
  - request logs
  - error reporting
  - health checks
  - background job monitoring

### Backend Rules

- No critical state transition should happen without an audit record.
- Number generation must be safe under concurrent requests.
- Authorization must be enforced server-side for every protected action.

### Acceptance Criteria

- Two users cannot create duplicate document numbers under load.
- A production incident can be investigated from logs and audit history.
- Critical flows are protected by automated tests.

---

## Recommended Implementation Order

1. **Phase 1:** Commercial baseline hardening
2. **Phase 4:** Project kickoff workspace
3. **Phase 5:** Project planner
4. **Phase 6:** Professional invoice and payments
5. **Phase 7:** File storage and document control
6. **Phase 2:** Customer 360
7. **Phase 3:** Discussion and decision governance
8. **Phase 8:** Production hardening, done continuously and finalized before release

Phase 8 should not wait until the end for basics like audit coverage and tests. It is listed last because it becomes the final release gate.

---

## Release Gate Definition

MachineIQ is production-ready for this workflow when:

- Accepted quote is a controlled commercial baseline.
- Project kickoff cannot be skipped accidentally.
- Planner can represent real dates, dependencies, and ownership.
- Invoice can be issued, paid, partially paid, and audited.
- Files are stored outside MongoDB documents.
- All critical state changes are audited.
- Full customer-to-cash flow has automated tests.

