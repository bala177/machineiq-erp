# OEM Machine Execution Platform — Product Specification

## 1. Product Overview

### Product working title

OEM Machine Execution Platform

### Product vision

Build a software platform for OEM machine builders that connects sales handover, project kickoff, engineering task breakdown, procurement readiness, workflow tracking, and management visibility in one unified system.

### Core problem

OEM companies often manage machine projects across email, Excel, meetings, CAD tools, ERP, and shared folders. This creates fragmented ownership, poor handover from sales to engineering, hidden dependencies, procurement delays, missed deadlines, and weak management visibility.

### Product objective

Create a single operational system where:

- customer requirements are captured in structured form
- internal kickoff decisions are documented
- machine work is broken into actionable deliverables
- tasks are assigned to responsible people
- dependencies and blockers are visible
- approved outputs move cleanly into procurement
- managers can see project health, bottlenecks, and risks at a high level

---

## 2. Target Users

### Primary users

- Sales engineers
- Project managers
- Mechanical designers
- Electrical designers
- Controls/software engineers
- Procurement teams
- Engineering managers
- Operations managers
- Directors / leadership

### Secondary users

- Production planners
- Service teams
- Quality teams
- Supplier coordinators

---

## 3. Business Problems to Solve

### Sales to engineering handover gap

Sales captures requirements informally, but engineering receives incomplete information.

### Poor project ownership

Projects move through many departments, but responsibility for specific outputs is unclear.

### Hidden dependencies

One delayed design output can block procurement, assembly, or downstream engineering, but teams notice too late.

### Procurement delay

Ordering teams do not know what is ready for release, what is still changing, and what is a long-lead risk.

### Weak management visibility

Management cannot easily see which projects are delayed, which department is overloaded, or what bottleneck is affecting delivery.

---

## 4. Product Scope

### In scope for MVP

- Opportunity / machine request intake
- Structured requirement capture
- Kickoff meeting workspace
- Project creation and stage tracking
- Machine breakdown structure
- Task assignment by department and owner
- Due dates and status tracking
- Dependency and blocker tracking
- Notifications and reminders
- Procurement handover status
- High-level management dashboard
- Document attachment support
- Decision log

### Out of scope for MVP

- Full ERP replacement
- Full PLM replacement
- Detailed CAD editing
- Full supplier portal
- Advanced cost estimation engine
- Native manufacturing execution features

### Future scope

- CAD/PDM integration
- ERP integration
- AI summaries and risk prediction
- BOM import and synchronization
- Change impact analyzer
- Resource capacity planning
- Supplier collaboration portal

---

## 5. Core Product Principles

- Single source of truth for project execution
- Clear ownership for every deliverable
- Visible dependencies and blockers
- Strong handoff between departments
- Real-time project visibility for management
- Minimal friction for engineering teams
- Workflow-driven, not just task-list driven
- Built for machine-building OEM processes

---

## 6. End-to-End Workflow

### Stage 1: Inquiry / opportunity intake

Sales creates a new machine opportunity with customer details, requested machine type, scope, performance targets, deadlines, and attachments.

### Stage 2: Technical feasibility review

Engineering or project leadership reviews the request, adds feasibility notes, risks, complexity, and recommends whether to proceed.

### Stage 3: Concept approval

Internal stakeholders approve or reject the concept and define whether it moves into active project mode.

### Stage 4: Kickoff meeting

A kickoff workspace is used to document attendees, discussion points, action items, decisions, risks, deadlines, and departmental responsibilities.

### Stage 5: Project structure definition

The machine is broken into modules, stations, subassemblies, and deliverables.

### Stage 6: Engineering execution

Tasks are assigned to owners in mechanical, electrical, controls, and related departments. Progress, due dates, reviews, and blockers are tracked.

### Stage 7: Procurement handover

Released deliverables and approved components move into procurement-ready status.

### Stage 8: Monitoring and escalation

Notifications, reminders, overdue alerts, and blocker escalation help keep projects on track.

### Stage 9: Project reporting and closure

Management reviews project outcomes, bottlenecks, cycle times, and lessons learned.

---

## 7. Functional Modules

## 7.1 Opportunity and Requirement Intake Module

### Purpose

Capture customer machine requests in structured form and convert them into internal project candidates.

### Features

- Create new machine request
- Capture customer and opportunity information
- Store performance targets and constraints
- Attach RFQ, drawings, notes, and emails
- Add feasibility comments
- Set target delivery timelines
- Assign initial reviewer
- Convert approved opportunity into project

### Example fields

- Opportunity ID
- Customer name
- End customer
- Product/application type
- Machine type
- Axis count
- Throughput target
- Safety requirements
- Country / compliance region
- Delivery target date
- Budget range
- Special customer requests
- Risk notes
- Attachments
- Status

---

## 7.2 Kickoff and Feasibility Workspace

### Purpose

Support cross-functional project kickoff and internal alignment.

### Features

- Kickoff agenda template
- Attendee list
- Department-wise checklist
- Decision log
- Action item capture
- Risk register initialization
- Milestone definition
- Responsibility matrix

### Kickoff outputs

- Approved scope
- Responsible teams and owners
- Initial deadlines
- Risks
- Long lead concerns
- Follow-up actions

---

## 7.3 Project and Stage Management Module

### Purpose

Track the project at a high level from concept to closure.

### Stages

- Inquiry
- Feasibility
- Concept approved
- Engineering in progress
- Review / release
- Procurement in progress
- Build / assembly
- FAT / SAT
- Completed
- On hold
- Cancelled

### Features

- Create project from approved opportunity
- Set milestones
- Set target delivery date
- Set project priority
- Update project health
- Assign project manager
- Track current stage
- View project timeline

---

## 7.4 Machine Breakdown Structure Module

### Purpose

Represent machine work in a hierarchical engineering-friendly structure.

### Hierarchy example

Project > Machine > Module > Subassembly > Deliverable / Task

### Features

- Define machine modules
- Create stations / subassemblies
- Assign ownership at different levels
- Group related tasks under module structures
- Link deliverables and components
- Track status by hierarchy

---

## 7.5 Task and Deliverable Management Module

### Purpose

Assign, track, and manage engineering work and related outputs.

### Features

- Create tasks and deliverables
- Assign owner and department
- Set due date
- Define priority
- Set status
- Add dependencies
- Add comments
- Attach files
- Mark blockers
- Track progress
- Trigger next-step workflow

### Task types

- Design task
- Review task
- Approval task
- Release task
- Procurement handover task
- Follow-up task

### Suggested statuses

- Not started
- In progress
- Waiting for input
- Under review
- Blocked
- Released
- Closed

---

## 7.6 Dependency and Blocker Tracking Module

### Purpose

Make upstream/downstream impact visible.

### Features

- Link tasks with dependency relationships
- Flag blockers
- Show blocked-by and blocking relationships
- Highlight critical path items
- Show bottleneck chain
- Enable escalation on blocked critical items

---

## 7.7 Procurement Readiness and Handover Module

### Purpose

Ensure procurement receives only approved, usable, and traceable outputs.

### Features

- Mark deliverables as procurement-ready
- Track long lead items
- View items pending release
- View items already handed to procurement
- Track ordering readiness status
- Flag revisions after release
- Link approved design outputs to procurement tasks

### Procurement statuses

- Not applicable
- Pending design release
- Ready for procurement
- Ordered
- Partially received
- Received
- Changed after release

---

## 7.8 Notification, Reminder, and Escalation Engine

### Purpose

Prevent silent delays.

### Features

- Due date reminders
- Overdue alerts
- Escalation after threshold
- Blocker alerts
- Milestone risk alerts
- Notifications on assignment or reassignment
- Alerts on changed deadlines

### Triggers

- Task due in X days
- Task overdue
- Task blocked beyond Y days
- Dependency delayed
- Critical milestone at risk

---

## 7.9 Dashboard and Reporting Module

### Purpose

Provide visibility at portfolio, project, and department levels.

### Dashboard views

- Executive portfolio dashboard
- Project manager dashboard
- Department workload dashboard
- Procurement risk dashboard
- Engineering release dashboard

### Example KPIs

- Active projects
- On-track projects
- Delayed projects
- Overdue tasks
- Blocked tasks
- Bottlenecks by department
- Long lead items pending release
- Average cycle time by department
- Project health score
- Milestone slippage count

---

## 7.10 Document and Decision Log Module

### Purpose

Capture key files, approvals, and decisions in project context.

### Features

- Attach files at project or task level
- Store meeting notes
- Track decision history
- Link documents to modules or deliverables
- Maintain audit trail of major changes

---

## 8. Non-Functional Requirements

### Performance

- Dashboard should load quickly for normal active project counts
- Search and filtering should be responsive

### Security

- Role-based access control
- Department-based visibility where needed
- Audit trail for changes
- Secure file access

### Reliability

- Stable workflow execution
- No silent loss of assignment or reminder events

### Scalability

- Support multiple OEM customers / multiple plants in future
- Handle many projects, modules, tasks, and attachments

### Usability

- Easy for non-technical industrial users
- Low-friction UI for quick status updates
- Clear status language

---

## 9. Roles and Permissions

### Sales

- Create opportunities
- View assigned projects
- Add requirements and attachments
- View high-level project status

### Project manager

- Create and manage projects
- Run kickoff workspace
- Assign tasks
- Update milestones
- View all project-level data

### Engineer / designer

- View assigned tasks
- Update status
- attach outputs
- mark blockers
- comment on dependencies

### Procurement

- View procurement-ready items
- track ordering statuses
- comment on long lead risks

### Manager / leadership

- View dashboards and reports
- View bottlenecks and project health
- View escalations

### Admin

- Configure workflows
- Manage users, departments, status rules
- Configure templates

---

## 10. Suggested Data Model

### Main entities

- User
- Department
- Customer
- Opportunity
- Requirement
- Project
- ProjectStage
- Milestone
- Machine
- Module
- Subassembly
- Task
- Deliverable
- Dependency
- Blocker
- ProcurementItem
- Supplier
- Document
- DecisionLog
- Comment
- Notification
- Risk
- AuditLog

### Key relationships

- One customer has many opportunities
- One approved opportunity becomes one project
- One project contains many machine modules
- One module contains many subassemblies and tasks
- One task may have many dependencies
- One deliverable can be linked to procurement readiness
- One project contains many documents, decisions, and risks

---

## 11. Suggested Status Models

### Opportunity status

- New
- Under review
- Feasibility in progress
- Approved
- Rejected
- Converted to project

### Project health

- Healthy
- Watch
- At risk
- Delayed

### Task status

- Not started
- In progress
- Waiting for input
- Under review
- Blocked
- Released
- Completed

### Procurement readiness

- Not ready
- Pending release
- Ready for procurement
- Ordered
- Received
- Changed after release

---

## 12. UI / Screen List

### Core screens

1. Login / role landing page
2. Opportunity intake form
3. Opportunity review page
4. Project overview page
5. Kickoff workspace page
6. Machine breakdown structure page
7. Task board page
8. Department workload page
9. Dependency / blocker page
10. Procurement readiness page
11. Dashboard page
12. Document center
13. Notifications center
14. Reports page
15. Admin settings page

### Project overview widgets

- project summary card
- stage tracker
- milestone list
- health indicator
- active blockers
- overdue tasks
- department progress summary
- recent decisions

---

## 13. MVP Definition

### MVP goal

Deliver a usable platform that improves handover, ownership, execution tracking, and high-level visibility across OEM projects.

### MVP features

- Opportunity intake
- Project creation
- Kickoff workspace
- Machine/module structure
- Task assignment and status tracking
- Reminders and overdue alerts
- Dependency/blocker marking
- Procurement handover state
- Dashboard with core KPIs
- File attachments
- Decision log

### MVP success criteria

- Teams can track at least one real machine project end-to-end
- Managers can identify overdue tasks and blocked projects quickly
- Procurement can distinguish ready vs non-ready items
- Sales-to-engineering handover is captured in one system

---

## 14. Future Enhancements

### Integrations

- SolidWorks / PDM integration
- ERP integration
- Outlook / Teams integration
- Excel import/export

### Intelligence layer

- AI-generated kickoff summaries
- Requirement extraction from notes and documents
- Risk prediction based on delays and workload
- Automatic weekly management summaries
- Similar machine template recommendations

### Advanced planning

- Capacity planning by department
- Resource leveling
- Change impact analysis
- Cost and delay simulations

---

## 15. Recommended Tech Direction

### Frontend

- React / Next.js
- Role-based dashboards
- Kanban + table + hierarchy views

### Backend

- Node.js / Express or NestJS
- Workflow services
- Notification engine
- Audit logging

### Database

- PostgreSQL for structured workflow-heavy data
- Optional document/object storage for attachments

### Optional architecture enhancement

- Event-driven notifications
- Background jobs for reminders and escalations
- API-first design for future integrations

---

## 16. Strategic Product Positioning

### One-line positioning

A machine-building execution platform that connects sales handover, engineering work, procurement readiness, and project visibility.

### Practical comparison

Like a mix of project control, engineering handoff, and procurement coordination built specifically for OEM machine builders.

---

## 17. Build Recommendation

Do not start by trying to replace ERP or PLM.

Start with the operational execution layer:

- handover
- kickoff
- ownership
- tracking
- dependencies
- procurement readiness
- dashboard visibility

This wedge is strong, realistic, and commercially meaningful.
