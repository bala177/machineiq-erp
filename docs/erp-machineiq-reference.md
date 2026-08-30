# MachineIQ Reference Patterns

This document captures the design conventions from the earlier MachineIQ product so the new ERP expansion stays aligned with the platform patterns that already proved workable.

## 1. Product direction

Earlier MachineIQ was built for OEM machine-building execution, not a generic ERP. The strongest product patterns are:

- project-centric execution
- machine breakdown hierarchy
- engineering tasks and deliverables
- procurement readiness tracking
- dashboards and role-based visibility
- audit trail and soft-delete conventions

That means the ERP expansion should extend the existing model rather than replace it.

## 2. Architectural conventions

### Tech stack
- Frontend: Next.js App Router + Tailwind CSS
- Backend: NestJS + MongoDB + Mongoose
- Auth: JWT + RBAC
- Real-time: Socket.IO
- Platform convention: modular, API-first service structure

### Code and data conventions
- Use camelCase on documents and fields
- Include timestamps on all main records
- Use soft delete via `deletedAt`
- Preserve auditability with mutation logging
- Keep business rules on the server, not only in the client
- Use domain-aware schemas with one schema per major entity

## 3. Domain model patterns

The earlier product showed a clear operational narrative:

- Customer → Opportunity → Project → Machine → Module/Subassembly → Task/Deliverable
- Project work is tracked with dependencies and blockers
- Procurement exists as readiness and ordering signals, not pure accounting data
- Supplier and customer records are explicit domain objects
- Department and user models form the base identity layer

This is the right pattern to extend into ERP master data and sales flow.

## 4. Role and access model

MachineIQ used a role-based access pattern with server-side enforcement. The ERP expansion should keep that as a foundation:

- admin
- sales
- project manager
- engineer/designer
- procurement
- leadership/manager

For the ERP releases, the new flow should not replace the RBAC pattern. It should extend it with a permission model for workflow approvals and document access.

## 5. Business workflow patterns

### Engineering-first pattern
The earlier product is strongest when a machine is treated as a breakdown tree with operational accountability.

This is the pattern to preserve:

1. customer request or opportunity
2. feasibility and review
3. project kickoff
4. machine breakdown and task planning
5. dependencies and blockers
6. design release
7. procurement readiness
8. status visibility via dashboard and notifications

### ERP extension pattern
The ERP modules should plug into this operational backbone, not replace it.

- Sales closes the commercial cycle
- Inventory adds stock movement and valuation
- Purchase adds requisition and procurement execution
- Production expands from engineering readiness to manufacturing execution
- Finance sits on top of sales/purchase/inventory transactions only after the data model is correct

## 6. Data-model guidance for Release 1

The earlier repo confirms these are the right baseline entities for any ERP extension:

- `User` and `Department`
- `Customer`
- `Supplier`
- `Project`
- `Quote`
- `Invoice`
- `ProcurementItem`
- `Machine` and subordinate engineering structures

The new ERP foundation should therefore add, not reinvent:

- Item master
- Branch and location
- supplier/customer code fields
- warehouse/stock concept
- permission matrix beneath existing roles
- numbering model for commercial documents
- `Component.itemId` as the structural bridge between engineering BOM and ERP inventory

## 7. Recommended application of the reference

The ERP version should follow this rule:

- keep the deep engineering model from the earlier MachineIQ product
- extend it with ERP primitives only where the business truly requires them
- do not flatten engineering data into generic accounting tables
- do not replace the role/permission model with a different auth model

## 8. Summary

The earlier MachineIQ repo provides the correct backbone for the ERP expansion:

- modular NestJS architecture
- MongoDB-based document model
- role-based access control
- project/machine/task lifecycle
- soft-delete and audit patterns
- domain-driven object model

The ERP release should reuse these conventions and add the missing commercial/master-data foundation without discarding the engineering execution identity.
