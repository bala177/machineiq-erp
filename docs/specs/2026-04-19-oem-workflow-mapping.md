# MachineIQ — OEM Real-World Workflow vs. Platform Mapping
**Date:** 2026-04-19  
**Status:** Living document

---

## The Real OEM Machine-Build Lifecycle

This document maps how a real OEM machine-building company operates against what MachineIQ currently supports, identifies gaps, and records decisions made during brainstorming.

---

## Stage 0: The Players

```
OEM Company  ←→  MachineIQ  ←→  End Customer (e.g. Nestlé, a food producer)
                               ↑
                         Direct Customer
                      (may be an integrator or
                       the end customer directly)
```

**OEM internal roles involved:**
- Marketing / Sales — first contact, requirement gathering
- Project Manager — project ownership
- Mechanical Engineers / Designers — mechanical design and drawing release
- Electrical Engineers — panel design, IO lists, wiring
- Controls / Software Engineers — PLC/HMI programming
- Procurement — component ordering and supplier management
- Assembly / Shop Floor — physical build (not yet in MachineIQ)
- Quality / FAT/SAT team — acceptance testing

---

## Stage 1 — Customer Discovery & Requirements Discussion

### What happens in real life

Sales or Marketing meets the customer (e.g. Nestlé). Multiple meetings, calls, emails, and site visits happen over days or weeks. Key outputs:

- What product does the customer produce?
- What throughput / speed / capacity do they need?
- What safety standards apply (CE, OSHA, etc.)?
- What is their budget range?
- What is their timeline?
- Are there special constraints (washdown, cleanroom, etc.)?
- Is this a standard machine type or a new concept?

This conversation is **the single source of truth** for the entire project. Every design decision downstream traces back here.

### What MachineIQ currently does

The **Opportunity** module captures the *output* of this stage — a structured intake form with fields like `machineType`, `throughputTarget`, `safetyRequirements`, `deliveryTargetDate`, `customRequirements`.

**What is missing:**

The *process* of getting to those outputs is not captured. There is no place to:
- Log meeting notes ("call with Nestlé on 15 April — they want 200 cans/min, not 180")
- Thread a conversation across multiple contacts
- Attach emails or voice notes
- Show the customer what has been captured and let them confirm it
- Track open questions ("asked about cleanroom req — awaiting their answer")
- Version the requirements as understanding evolves

**Gap severity: Critical**  
This stage is the foundation of everything. Without it, the intake form is filled from memory rather than a structured record, and disputes about "what the customer actually asked for" have no resolution point.

---

## Stage 2 — OEM Internal Feasibility & Commercial Response

### What happens in real life

After discovery, the OEM's engineering team assesses:
- Can we build this? At what cost?
- What are the technical risks?
- What is our realistic lead time?
- What does a high-level machine concept look like?

Sales then responds to the customer with a formal proposal — timeline, price, concept overview.

### What MachineIQ currently does

The **Opportunity review workflow** partially covers this:
- `under_review` status assigned to an engineer/PM
- `feasibilityNotes`, `riskNotes`, `complexityNotes` fields captured
- Status progresses through `feasibility_in_progress → approved / rejected`
- Customer-facing delivery date captured in `deliveryTargetDate`

**What is missing:**
- No formal **proposal document** generation
- No **budget vs. cost model** (only free-text `budgetNotes`)
- No concept machine definition at this stage (machine concept emerges later)
- No customer-facing view or portal — all notes are internal

**Gap severity: Medium**  
The workflow exists but lacks formality. The feasibility notes are a text box, not a structured assessment.

---

## Stage 3 — Project Kickoff

### What happens in real life

Once approved, the OEM holds an internal kickoff meeting with all department leads. Key outputs:
- Project scope confirmed
- Team assigned (PM, mechanical lead, electrical lead, procurement lead)
- High-level milestones agreed
- Long-lead procurement items identified immediately
- Risks logged
- Open actions assigned with owners

The kickoff is a formal handover from Sales to Engineering.

### What MachineIQ currently does

The **Project** module has a structured `kickoff` record:
- Meeting date, attendees
- Agenda items, decisions, action items
- Risks logged
- Notes

Milestones are tracked as an array on the project with `title`, `targetDate`, `actualDate`, `completed`, `notes`.

**What is missing:**
- Kickoff record is not **linked back** to the opportunity's discovery discussion — there is no "here is what the customer told us, and here is what we decided internally"
- No structured **risk register** separate from the kickoff notes (Risk schema exists but has no UI)
- No **Gantt or schedule view** — milestones are a list, not a timeline
- Action items from kickoff are not converted to **Tasks** automatically

**Gap severity: Medium**  
Kickoff is captured but the connection to Stage 1 and the conversion to actionable tasks is manual and fragile.

---

## Stage 4 — Machine Concept & ISA-88 Structure Definition

### What happens in real life

The PM and engineering leads define the machine structure — what are the major sections (units), what functional groups exist (equipment modules), what control groupings make sense. This becomes the ISA-88 breakdown.

In parallel, two tracks split:
- **Mechanical track**: Mechanical engineers take ownership of mechanical units
- **Electrical track**: Electrical engineers take ownership of electrical and controls units

These tracks run **in parallel** and must be coordinated (e.g. electrical panel can only be finalised after mechanical layout is frozen).

### What MachineIQ currently does

The **Machines module** implements ISA-88 fully:
- Machine → Unit → EquipmentModule → ControlModule → Component
- Units have a `department` field (Mechanical / Electrical / Automation)
- Units can be assigned owners
- Components are tagged by `discipline` (Mechanical / Electrical / Controls)

**What is missing:**
- No **split view** separating the mechanical and electrical tracks visually
- No **inter-track dependency** management (e.g. "Electrical panel design depends on mechanical layout freeze")
- No concept-phase machine builder — the ISA-88 tree is always tied to a project; there is no pre-project concept definition stage
- Tree editor works well for small structures; **no import from external tools** (CAD, Excel)

**Gap severity: Low–Medium**  
The data model is correct. The UX needs a department-filtered view and a dependency layer between tracks.

---

## Stage 5 — Mechanical Design Execution

### What happens in real life

The mechanical engineering lead takes the ISA-88 structure and assigns:
- Each Unit or EquipmentModule to a designer
- Each designer works on their assigned sections
- They produce drawings, BOMs, and design documents
- Each item goes through: **Design → Peer Review → Approval → Release**
- After release, components become available for procurement

A typical project might have 10–30 mechanical modules, each with 5–20 components.

**Key pain points in reality:**
- Designers work in silos (CAD tool) — progress is invisible to PM
- Review and approval is email-based — no audit trail
- Components released piecemeal — procurement needs to know what is ready
- Blockers (e.g. waiting for customer measurement confirmation) stall multiple designers
- Long-lead items identified late because no one tracks them early

### What MachineIQ currently does

**Components** have the full three-stage lifecycle:
- `designStatus`: NotStarted → InDesign → UnderReview → Released
- `procurementStatus`: NotReady → Ready → Ordered → Received
- `assemblyStatus`: NotReady → Ready → Installed

**Tasks** support `design`, `review`, `approval`, `release` types with dependency tracking.

Background worker sends reminders and escalation notifications.

**What is missing:**
- No **designer work queue** — "Show me all components assigned to Anna, sorted by due date, with status"
- No **batch assignment** — assigning 10 components to a designer one at a time is painful
- **Review and approval** is a task status, not a routed approval workflow — there is no "PM must approve before status advances"
- No **drawing or CAD file version tracking** — documents are flat file links
- No **BOM export** — components exist in the system but cannot be exported as a structured BOM
- No **release package** concept — releasing a Unit should bundle all its components into a package for procurement
- The **ISA-88 tree is structural** but not used as a work interface (designers don't open the tree and update their components from within it)

**Gap severity: High**  
This is the core daily workflow for the engineering team. The data model is solid but the work execution UX is weak.

---

## Stage 6 — Electrical Design Execution

### What happens in real life

Mirrors mechanical but with different outputs:
- IO lists (inputs and outputs per control module)
- Panel layout and schematics
- Cable schedules
- PLC/HMI software architecture
- Control narrative documents

Key difference from mechanical: Electrical work **depends on mechanical layout being frozen** before final panel sizing. This creates a natural inter-track dependency.

### What MachineIQ currently does

The same component lifecycle and task system applies. `discipline = Electrical | Controls` distinguishes electrical components.

**What is missing:**
- All the same gaps as mechanical design (work queue, batch assign, approval workflow, BOM export)
- No **IO list management** — this is a major electrical engineering artifact with no dedicated UI
- No **panel schedule** or **cable schedule** tracking
- No **cross-track dependency enforcement** — the system does not prevent an electrical designer from marking their panel as released while the mechanical layout is still in design

**Gap severity: High**  
Electrical engineering is the most underserved discipline in the current build.

---

## Stage 7 — Task Tracking, Blockers & Escalation

### What happens in real life

At any given time on a live project:
- The PM needs to know: what is late, what is blocked, what is at risk
- Designers need to know: what is due this week, what is blocked on me, who do I chase
- Procurement needs to know: what components have been released so they can order
- Management needs to know: is the project healthy or heading for trouble

**Blocker resolution in reality:**
1. Designer hits a blocker (e.g. customer hasn't confirmed a dimension)
2. Designer flags to PM
3. PM chases customer or makes a design decision
4. Blocker resolved, designer continues

This process happens in email and phone calls — invisible to the system.

### What MachineIQ currently does

- Tasks have `blocked` status with `blockerReason`
- Components have `blockedByDependencies` with `blockerReason`
- Notifications fire for `blocker` and `escalation` events
- Background worker escalates overdue items
- Dashboard shows blocked task counts

**What is missing:**
- No **escalation management page** — PM cannot see "these 5 items have been escalated, here is the history"
- No **blocker resolution workflow** — marking a blocker as resolved is just a status change, not a conversation
- No **PM intervention log** — no record of what the PM did to resolve a blocker
- Notification fires once — if ignored, there is no follow-up cadence

**Gap severity: Medium**  
The plumbing is there. The PM-facing surface for managing escalations needs a dedicated view.

---

## Stage 8 — Procurement Handover & Ordering

### What happens in real life

As components are released from design:
- Procurement receives release packages
- They identify suppliers, get quotes, issue purchase orders
- Long-lead items were (ideally) identified at kickoff and pre-ordered
- Delivery dates are tracked and compared against the assembly schedule
- Late deliveries trigger escalations

### What MachineIQ currently does

Procurement module tracks items through:
- `pending_design_release → ready_for_procurement → ordered → partially_received → received`
- Supplier master with contact details
- Long-lead flag with lead time in days
- Expected delivery date tracking
- Procurement dashboard with status overview

**What is missing:**
- No **purchase order management** — PO number, PO date, PO document
- No **quote comparison** — multiple supplier quotes per item
- No **delivery tracking** against assembly schedule (when does assembly need this item?)
- No **partial delivery detail** — partially received says some arrived, but not which items or quantities
- No **supplier portal** — supplier cannot see what they owe or update delivery dates themselves

**Gap severity: Medium**  
Core procurement tracking works. Advanced purchasing workflow is future scope.

---

## Stage 9 — Build, Assembly & FAT/SAT

### What happens in real life

Once components are received:
- Assembly team builds the machine section by section
- Components are installed and checked off
- Factory Acceptance Test (FAT) is run — machine tested in the OEM's factory
- Site Acceptance Test (SAT) is run — machine tested at the customer's site
- Punch list items are tracked and resolved

### What MachineIQ currently does

- Project has `build_assembly` and `fat_sat` stages
- Components have `assemblyStatus`: NotReady → Ready → Installed

**What is missing:**
- No **assembly work order** or sequence management
- No **FAT/SAT test plan or test case tracking**
- No **punch list** management
- No **customer sign-off** record for FAT/SAT
- The `assemblyStatus` on components is the only assembly tracking mechanism — no higher-level view

**Gap severity: High for assembly teams**  
This stage is essentially unbuilt beyond stage labels and component install tracking.

---

## Summary: Coverage by Stage

| Stage | What Exists | Gap Level |
|-------|------------|-----------|
| 1. Customer discovery & discussion | Opportunity intake form (output only) | 🔴 Critical — no discussion board |
| 2. Feasibility & proposal | Opportunity review workflow (partial) | 🟡 Medium — no cost model, no proposal doc |
| 3. Project kickoff | Kickoff record, milestones, decisions | 🟡 Medium — not linked to Stage 1, no Gantt |
| 4. Machine concept & ISA-88 definition | Full ISA-88 hierarchy | 🟡 Medium — no split view, no inter-track deps |
| 5. Mechanical design execution | Component lifecycle, tasks | 🔴 High — no work queue, no approval routing |
| 6. Electrical design execution | Same as mechanical | 🔴 High — no IO list, no cross-track deps |
| 7. Tracking, blockers & escalation | Tasks, notifications, background worker | 🟡 Medium — no escalation management UI |
| 8. Procurement handover & ordering | Procurement module | 🟡 Medium — no PO management, no supplier portal |
| 9. Build, assembly & FAT/SAT | Stage labels + component install tracking | 🔴 High — almost entirely unbuilt |

---

## Key Brainstorming Decisions

### Decision 1: Priority order for improvement

Agreed: tackle in this order —
1. **Discussion Board** (Stage 1) — foundational truth source
2. **Designer work queue** (Stage 5/6) — daily engineering UX
3. **Department split view** (Stage 4) — mechanical vs. electrical clarity
4. **Escalation management** (Stage 7) — PM-facing oversight
5. **Assembly & FAT/SAT** (Stage 9) — after engineering is solid

### Decision 2: Discussion board scope

Not a full forum. A lightweight, structured thread attached to an Opportunity with:
- Entries tagged by type (meeting, email, call, note, question)
- Open questions trackable (mark as resolved)
- Key decisions pinned (flow into kickoff)
- Requirements extracted from discussion and linked to intake fields

### Decision 3: Build incrementally, not all at once

Each phase must be fully usable before the next begins. No half-built features.
Each phase shipped, tested, and documented before moving to the next.
