# MachineIQ — Gap Analysis & Improvement Roadmap
**Date:** 2026-04-19  
**Status:** Living document — updated each planning cycle

---

## Guiding Principle

> Build each phase to be **fully usable on its own** before starting the next.  
> A half-built feature that ships is worse than a gap that is clearly acknowledged.

---

## Current State Snapshot

### What is solid

| Area | Confidence |
|------|-----------|
| Auth, RBAC, security | ✅ Production-grade |
| ISA-88 data model | ✅ Correctly structured |
| Component 3-stage lifecycle | ✅ Data model complete |
| Project stage + health tracking | ✅ Works |
| Task dependencies + blocker flags | ✅ Works |
| Procurement item tracking | ✅ Works |
| Notification infrastructure (backend) | ✅ Works |
| Background worker (reminders) | ✅ Works |
| Dashboard aggregations (6 types) | ✅ Works |

### What is weak (built but incomplete UX)

| Area | Problem |
|------|---------|
| Opportunity review workflow | Fields exist but assessment is a text box, not structured |
| Kickoff record | Form exists but not connected to opportunity context |
| Machine tree as a work interface | Tree is structural — engineers don't work from it |
| Escalation management | Notifications fire but PM has no escalation dashboard |
| Risk register | Schema exists, no UI |
| Comments | Flat, no threading, low discoverability |
| Notifications | In-app only, no email, no preferences |

### What does not exist

| Feature | Why it matters |
|---------|---------------|
| Discussion board on Opportunity | Stage 1 truth source — biggest gap |
| Designer work queue | Engineers can't see their work without hunting the tree |
| Batch component assignment | Allocating 10+ components is painful one by one |
| Department split view (Mech vs Elec) | Two tracks are invisible to each other |
| IO list management | Core electrical engineering artifact missing |
| Approval routing | "Approved" is a status, not a system-enforced workflow |
| BOM export | Components can't be exported as a Bill of Materials |
| Release package | No bundle mechanism when releasing a unit to procurement |
| Gantt / milestone timeline | Milestones are a list, not a visual schedule |
| Assembly work orders | Build stage is unbuilt beyond component install flags |
| FAT/SAT test tracking | Acceptance testing stage is unbuilt |
| Email notifications | All notifications are in-app only |
| PO management | No purchase order number, document, or tracking |

---

## Phased Roadmap

---

### Phase 1 — Discussion Board (Stage 1 fix)
**Priority: Critical**  
**Complexity: Medium**  
**Who benefits: Sales, PM, Engineering**

**Goal:** Give the OEM a place to capture the evolving customer conversation, so the opportunity intake form reflects a record rather than a memory.

**What to build:**

A `DiscussionThread` attached to an Opportunity, containing ordered `DiscussionEntry` items.

Each entry has:
- `type`: `meeting | call | email | note | question | decision`
- `content`: rich text or plain text body
- `authorId`: who logged it
- `participants[]`: who was in the meeting/call
- `date`: when this happened (not when it was logged)
- `isOpenQuestion`: boolean — is this an unresolved question?
- `resolvedAt`: timestamp if question was resolved
- `resolvedBy`: who resolved it
- `linkedRequirementKey`: optional link to an intake form field (e.g. `throughputTarget`)
- `attachments[]`: file links (email PDFs, photos, voice note transcripts)

**UI:**
- Timeline-style feed on the Opportunity detail page (new tab: "Discussion")
- Filter by type (show only meetings, show only open questions)
- "Pin as decision" action → adds to kickoff decision log when project is created
- "Link to requirement" action → connects a discussion entry to an intake field

**Backend:**
- New `DiscussionEntry` schema
- `POST /opportunities/:id/discussion` — add entry
- `GET /opportunities/:id/discussion` — list entries
- `PATCH /opportunities/:id/discussion/:entryId` — update (resolve question, edit)

**Success criteria:**
- Sales can log a meeting note with participants and date
- PM can see a chronological record of the customer conversation
- Open questions are visually distinct and resolvable
- At least one entry can be pinned and flows into the project kickoff

---

### Phase 2 — Designer Work Queue (Stage 5/6 fix)
**Priority: High**  
**Complexity: Medium**  
**Who benefits: Engineers, Designers, PM**

**Goal:** Give each engineer a personal work queue showing exactly what they own, what stage it's at, and what is due — without having to browse the ISA-88 tree.

**What to build:**

A `/my-work` page (or "My Work" tab in the task board) that shows:

For each user:
- **My Components** — components assigned to me, grouped by project + ISA-88 context
  - Columns: Component name | Unit | Status | Due date | Blocked?
  - Sorted by: due date ascending, blocked items highlighted
  - Quick-update: click status to advance (InDesign → UnderReview etc.)
- **My Tasks** — tasks assigned to me (already partially exists in task board)
- **Blocked items** — anything I'm blocked on with the blocker reason visible

**Batch assignment:**
- From the ISA-88 tree, allow selecting multiple components and assigning them to a user
- "Assign selected to…" bulk action with due date

**Success criteria:**
- An engineer opens the app and sees everything they own in one screen
- They can update a component's design status without opening the ISA-88 tree
- PM can see each team member's load (component count by status) in the project dashboard

---

### Phase 3 — Department Split View (Stage 4/6 fix)
**Priority: Medium**  
**Complexity: Low–Medium**  
**Who benefits: Mechanical Engineers, Electrical Engineers, PM**

**Goal:** Make the mechanical and electrical engineering tracks visually distinct so each discipline sees their work without noise from the other.

**What to build:**

On the project page and machine tree:
- A **department filter tab**: `All | Mechanical | Electrical | Automation`
- When "Mechanical" is selected: show only units/modules/components with `discipline = Mechanical`
- When "Electrical" is selected: show only electrical and controls items
- Each discipline's task board is filtered by department automatically for logged-in engineers

Inter-track dependency indicator:
- On a unit, show "depends on" links to units from other departments
- Visual indicator when a dependency is not yet in `ready_for_procurement` status

**Success criteria:**
- An electrical engineer opens the project and sees only their work
- A PM can switch between tracks to check status
- Cross-track dependencies are visible with a status indicator

---

### Phase 4 — Escalation Management UI (Stage 7 fix)
**Priority: Medium**  
**Complexity: Low**  
**Who benefits: PM, Manager, Leadership**

**Goal:** Give PMs a single view of everything that has been escalated, how long it has been blocked, and what action is needed.

**What to build:**

A dedicated **Escalations** panel within the project page:
- List of all tasks/components in `blocked` or `escalation` notification state
- Columns: Item | Owner | Blocked since | Blocker reason | Last action taken
- Actions: "Add PM note" (log what was done), "Mark resolved" (with resolution note)
- Resolution notes become part of the item's audit log

Notification improvements:
- Escalation re-fires every N days if not resolved (configurable in Settings)
- PM gets a daily digest of open escalations (when email is added)

**Success criteria:**
- PM opens the Escalations panel and sees all blocked items in one place
- PM can log "chased customer on 19 April" against a blocked item
- Resolved escalations show a history of what happened

---

### Phase 5 — Approval Routing (Stage 5/6 deep fix)
**Priority: Medium**  
**Complexity: High**  
**Who benefits: Engineers, PM, QA**

**Goal:** Make design review and approval a system-enforced workflow rather than just a status change.

**What to build:**

Formal approval step on components and deliverables:
- When `designStatus` moves to `UnderReview`, an approval request is created
- Approval request is assigned to a reviewer (configurable: unit owner, PM, or named reviewer)
- Reviewer sees a notification and a pending-approval list
- Reviewer can Approve (moves to Released) or Reject with comments
- Rejection sends the component back to InDesign with the reviewer's comment attached

**Approval chain (optional, Phase 5b):**
- Some components may require two approvals (e.g. engineer → PM → customer)
- Configurable per project or unit

**Success criteria:**
- Designer cannot self-approve their own design
- Reviewer receives notification and can approve/reject with a comment
- Approval history is visible on the component

---

### Phase 6 — BOM Export & Release Package (Stage 5/6 output)
**Priority: Medium**  
**Complexity: Medium**  
**Who benefits: Procurement, PM, Engineering**

**Goal:** When a unit is released to procurement, automatically bundle all its released components into a structured Bill of Materials that procurement can work from.

**What to build:**

- "Release to Procurement" action on a Unit generates a **Release Package**:
  - PDF / Excel export of all components in that unit
  - Columns: Part name | Code | Quantity | Supplier | Lead time | Procurement status
  - Package is stored as a `ProjectDocument` linked to the unit
- Procurement receives a notification with the release package attached
- Components in the package are automatically moved to `procurementStatus = Ready`

**Success criteria:**
- One click releases a unit and creates a BOM document
- Procurement can download the BOM and start ordering
- No manual data entry needed to populate procurement items

---

### Phase 7 — Assembly & FAT/SAT (Stage 9)
**Priority: Low (future)**  
**Complexity: High**  
**Who benefits: Assembly, QA, PM, Customer**

**Goal:** Track the physical build and acceptance testing stages.

**What to build:**

Assembly:
- Assembly work orders per machine section
- Component install checklist (ties to `assemblyStatus`)
- Assembly progress dashboard

FAT/SAT:
- Test plan with structured test cases
- Pass/fail per test case
- Punch list for failures
- Customer sign-off record
- FAT/SAT report export

**Success criteria:**
- Assembly team can check off components as installed
- QA can run through a structured test plan
- Customer sign-off is recorded in the system

---

### Phase 8 — Email Notifications & Digest (cross-cutting)
**Priority: Medium (blocks Phase 4 full value)**  
**Complexity: Medium**  
**Who benefits: All users**

**Goal:** Ensure users receive notifications even when they are not actively using the platform.

**What to build:**

- Email transport layer (SMTP / SendGrid / SES)
- Per-user notification preferences (which types, email vs in-app vs both)
- Daily digest email for designers (their overdue/upcoming items)
- Immediate email for escalations

---

## Dependency Map

```
Phase 1 (Discussion Board)
  └─ Feeds into → Kickoff record improvements (Phase 3)
  
Phase 2 (Designer Work Queue)
  └─ Depends on → ISA-88 component data (already built)
  └─ Enables → Phase 5 (Approval Routing needs the work queue as entry point)
  
Phase 3 (Department Split View)
  └─ Depends on → Phase 2 (work queue gives context)
  
Phase 4 (Escalation Management)
  └─ Partially depends on → Phase 8 (email makes escalations actionable)
  
Phase 5 (Approval Routing)
  └─ Depends on → Phase 2 (work queue) + Phase 3 (department context)
  
Phase 6 (BOM Export)
  └─ Depends on → Phase 5 (components should be approved before BOM)
  
Phase 7 (Assembly & FAT/SAT)
  └─ Depends on → Phase 6 (needs released components)
```

---

## Effort Estimates

| Phase | Backend effort | Frontend effort | Total estimate |
|-------|--------------|----------------|---------------|
| 1. Discussion Board | Medium (new schema + 3 endpoints) | Medium (new UI component) | 3–4 days |
| 2. Designer Work Queue | Low (query existing data) | Medium (new page) | 2–3 days |
| 3. Department Split View | None (data exists) | Low–Medium (filter UI) | 1–2 days |
| 4. Escalation Management | Low (query existing data) | Medium (new panel) | 2 days |
| 5. Approval Routing | High (new workflow state machine) | High (approval UI) | 5–7 days |
| 6. BOM Export | Medium (export + document creation) | Low (trigger button) | 2–3 days |
| 7. Assembly & FAT/SAT | High (new schemas + endpoints) | High (new pages) | 7–10 days |
| 8. Email Notifications | Medium (transport + templates) | Low (settings UI) | 3–4 days |

---

## Next Immediate Action

**Start Phase 1: Discussion Board**

Before writing any code:
1. Review this roadmap document
2. Confirm Phase 1 scope is correct
3. Write implementation plan (schema, endpoints, UI components)
4. Build backend first, test via API, then build UI
5. Test with `sarah@machineiq.com` (sales role) and `james@machineiq.com` (PM role)

Questions to resolve before building:
- Should discussion entries support rich text (bold, lists) or plain text only?
- Should customers ever see the discussion thread, or is it internal-only?
- Should pinned decisions auto-populate the kickoff record, or require manual review?
