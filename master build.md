Build a production-grade web application called "OEM Machine Execution Platform".

Purpose:
This platform is for OEM machine-building companies to manage the full internal flow from customer machine request to project kickoff, engineering execution, procurement readiness, and management visibility.

Core business problem:
OEM companies often manage projects across Excel, email, meetings, ERP, CAD tools, and shared folders. This causes weak handover from sales to engineering, poor ownership, hidden dependencies, procurement delays, and poor dashboard visibility for managers. The application must become the single operational execution layer that connects all teams.

Target users:

- Sales engineers
- Project managers
- Mechanical designers
- Electrical designers
- Controls/software engineers
- Procurement teams
- Engineering managers
- Operations managers
- Leadership

Build goals:

1. Capture customer machine requests in structured form
2. Support feasibility review and kickoff meetings
3. Break a machine project into modules, subassemblies, deliverables, and tasks
4. Assign work to owners with deadlines, statuses, and dependencies
5. Track blockers, overdue items, and workflow progression
6. Show procurement readiness for approved outputs
7. Provide high-level dashboards for project health, bottlenecks, and department workload
8. Maintain documents, decisions, and audit trail

Preferred stack:

- Frontend: React or Next.js with clean industrial/professional UI
- Backend: Node.js with Express or NestJS
- Database: PostgreSQL
- Auth: role-based authentication
- Architecture: modular, scalable, API-first
- Notifications: support reminders and escalation workflows
- File handling: attachment upload for RFQs, notes, and project documents

Core modules to implement:

1. Opportunity / Machine Request Intake
2. Feasibility Review
3. Kickoff Workspace
4. Project and Stage Management
5. Machine Breakdown Structure
6. Task and Deliverable Management
7. Dependency and Blocker Tracking
8. Procurement Readiness and Handover
9. Notifications / Reminders / Escalation
10. Dashboards and Reporting
11. Documents and Decision Log
12. Admin / Role Permissions

Required workflows:

A. Sales intake workflow

- Sales creates a machine request
- Captures customer info, machine type, product/application, performance targets, axis count, delivery target, budget notes, attachments, and special requirements
- Status options: New, Under Review, Feasibility In Progress, Approved, Rejected, Converted to Project

B. Feasibility and concept workflow

- Engineering/project leadership reviews the request
- Adds risk notes, complexity, feasibility comments
- Approves or rejects for project conversion

C. Kickoff workflow

- Project manager runs kickoff workspace
- Records attendees, notes, decisions, risks, milestone targets, and action items
- Defines departmental responsibilities

D. Engineering execution workflow

- Project is broken into Machine > Module > Subassembly > Task / Deliverable
- Each task must support:
  - owner
  - department
  - due date
  - priority
  - status
  - dependency links
  - blocker reason
  - attachments
  - comments
- Suggested task statuses:
  - Not Started
  - In Progress
  - Waiting for Input
  - Under Review
  - Blocked
  - Released
  - Completed

E. Procurement handover workflow

- Deliverables/components can be marked procurement-related
- Procurement sees what is not ready, pending release, ready for procurement, ordered, received, or changed after release
- Show long-lead risk visibility

F. Notification and escalation workflow

- Send reminders before due dates
- Flag overdue tasks
- Escalate blocked or overdue critical items
- Notify on assignment, reassignment, deadline changes, and dependency impact

Required dashboards:

1. Executive Dashboard

- total active projects
- healthy / watch / at-risk / delayed projects
- overdue tasks
- blocked tasks
- milestones at risk
- bottlenecks by department

2. Project Dashboard

- current stage
- milestone progress
- overdue items
- active blockers
- department progress
- recent decisions
- procurement readiness summary

3. Department Dashboard

- assigned tasks
- due this week
- overdue
- blocked
- workload view

4. Procurement Dashboard

- pending release items
- ready-for-procurement items
- long-lead risks
- changed-after-release items

Data model should include:

- User
- Department
- Customer
- Opportunity
- Requirement
- Project
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

Permissions:

- Sales: create opportunities, view own opportunities/projects
- Project Manager: manage projects, milestones, kickoff, assignments
- Engineer/Designer: update assigned tasks, add files, add blockers
- Procurement: manage procurement statuses and procurement comments
- Manager/Leadership: view dashboards, reports, and escalations
- Admin: manage users, roles, workflow rules, templates

UI expectations:

- Professional industrial SaaS look
- Clear dashboards
- Strong table views and kanban views
- Hierarchical project/module/task view
- Status badges
- Minimal clutter
- Responsive layout
- Easy filtering by project, department, owner, status, risk

Non-functional requirements:

- Role-based security
- Audit trail for important actions
- Scalable structure
- Clean API separation
- Maintainable codebase
- Validation on forms
- Search and filtering
- Fast dashboard performance

MVP scope:

- Opportunity intake
- Project creation
- Kickoff workspace
- Machine breakdown structure
- Task assignment and status tracking
- Dependency/blocker management
- Procurement handover statuses
- Notifications/reminders
- Core dashboards
- File attachments
- Decision log

Out of scope for MVP:

- Full ERP replacement
- Full PLM replacement
- Direct CAD editing
- Supplier portal
- Advanced AI prediction
- Advanced cost engine

Engineering instructions:

- Generate clean folder structure
- Use modular architecture
- Use reusable components
- Add seed data for demo
- Add example users and roles
- Add sample project data for one machine project
- Create REST APIs or structured server actions
- Include validation and error handling
- Include pagination/filtering for main tables
- Include status enums and workflow constants in a clean centralized manner

Deliverables I want from you:

1. Full application architecture
2. Database schema
3. API design
4. UI page structure
5. Component structure
6. Example workflow implementation
7. Seed/demo dataset
8. MVP build order
9. Suggestions for phase 2 improvements

Important product mindset:
This is not a generic task tracker. It is an OEM machine project execution platform that connects sales handover, engineering deliverables, procurement readiness, and management control.
