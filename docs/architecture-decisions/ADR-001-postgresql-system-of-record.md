# ADR-001: PostgreSQL as the MachineIQ ERP System of Record

- Status: Accepted
- Decision date: 2026-08-28
- Decision owner: Product owner
- Applies from: Release 1 / v2.1
- Client source: `docs/customer-references/Dashboard.docx`

## Decision

MachineIQ ERP will use PostgreSQL as its only production system of record beginning with Release 1. MongoDB will not remain as a production database, reporting replica, fallback store, or dual-write target.

The existing MongoDB application must be migrated before Release 1 is approved. Release 1 is therefore expanded from Master Data Foundation to **PostgreSQL Foundation and Master Data**.

## Non-negotiable outcomes

- Preserve every current MachineIQ workflow and all client requirements.
- Preserve product behavior, workflow rules, API contracts, and client requirements. Development data is explicitly disposable.
- Use database foreign keys, unique constraints, check constraints, and transactions for ERP integrity.
- Use UUID primary keys in the PostgreSQL target model.
- Use explicit versioned migrations. TypeORM `synchronize` must remain disabled in every environment.
- Perform one controlled cutover after reconciliation; do not ship a dual-write application.
- Seed clean, deterministic PostgreSQL demo data for client review; no MongoDB data import is required.

## Data modelling rules

- Relational entities and lifecycle references use normalized tables and foreign keys.
- Money uses `numeric`, never floating-point storage.
- Stock, accounting, payment, approval, and audit records use transactional append-only models where required.
- Flexible intake answers and immutable commercial snapshots may use PostgreSQL `jsonb`; core references, quantities, statuses, ownership, and financial values must not be hidden in JSON.
- All timestamps are stored as timezone-aware values.
- Soft-deletable operational records retain `deleted_at`; immutable ledgers are corrected by reversal entries.

## Release 1 cutover gates

1. The complete target schema is represented by reviewed migrations.
2. Every current API domain has an explicit PostgreSQL target model.
3. Fresh-database migration, seed, validation, and reset are automated.
4. Required fields, foreign keys, unique constraints, totals, and orphan checks pass.
5. All backend modules use PostgreSQL repositories; no runtime Mongoose dependency remains.
6. Existing backend unit and integration tests pass.
7. Critical desktop and mobile E2E workflows pass.
8. PostgreSQL backup and restore are demonstrated.
9. MongoDB is removed from runtime configuration and deployment manifests only after cutover validation.

## Rationale

The client explicitly recommends PostgreSQL. The required Inventory, Purchase, Production, Quality, Workflow, and Finance modules depend on transactional multi-row updates, enforceable relationships, immutable ledgers, consistent numbering, reconciliation, and financial precision. Choosing PostgreSQL before those modules are built avoids a later high-risk conversion of stock and accounting history.

## Consequences

- Release 1 is larger and cannot be called complete when only the master-data screens are finished.
- Existing development data is discarded and replaced by deterministic PostgreSQL seed data.
- Services using Mongoose queries and `populate()` must be rewritten around PostgreSQL repositories and explicit relations.
- Delivery may proceed domain by domain internally, but the released application must have one authoritative PostgreSQL persistence path.
