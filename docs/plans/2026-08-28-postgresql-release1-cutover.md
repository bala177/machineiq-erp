# Release 1 PostgreSQL Cutover Plan

## Scope baseline

Current persistence footprint measured on 2026-08-28:

- 24 Mongoose schema files
- 26 backend modules
- 65 injected Mongoose models
- 114 `populate()` relation loads
- 392 ObjectId-related usages
- Approximately 4,350 service lines requiring repository review

This plan preserves the current execution platform and adds the client Master Data requirements. It does not treat a successful database connection as a completed migration.

## Stage 1 — PostgreSQL platform

- Use the installed local PostgreSQL 16 cluster for development; Docker is not part of the database setup.
- Provision managed PostgreSQL 16 through the Render Blueprint for review and production deployments.
- Add NestJS TypeORM integration and PostgreSQL driver.
- Add validated `DATABASE_URL` configuration.
- Configure migration CLI with `synchronize: false`.
- Establish UUID, timestamps, soft-delete, audit, money, enum, and JSONB conventions.
- Add database readiness and migration-status health checks.

Exit criteria: a clean database can be created, migrated up, migrated down where safe, and health-checked without MongoDB.

## Stage 2 — Identity and Release 1 master data

- Users, departments, permissions, and role permissions
- Company, branches, and locations
- Customers and contacts
- Suppliers
- Items, item categories, and UOMs
- Document types and sequences
- Settings required by setup and commercial documents

Exit criteria: setup, login, user administration, and every v2.1 master-data flow use PostgreSQL and pass API tests.

## Stage 3 — Existing commercial and execution domains

- Opportunities and discussions
- Quotes and invoices
- Projects, machines, templates, and components
- Tasks, dependencies, and deliverables
- Procurement readiness
- Documents, notifications, and audit log
- Dashboard query replacements

Exit criteria: all current APIs use PostgreSQL, response contracts remain compatible with the frontend, and no Mongoose model is loaded at runtime.

## Stage 4 — Clean database seed and validation

- Recreate PostgreSQL from versioned migrations.
- Seed deterministic client-demo records in dependency order.
- Validate required fields, unique values, foreign keys, totals, and orphan records.
- Prove reset-and-reseed repeatability.

Exit criteria: two clean migration-and-seed runs complete with identical validation results.

## Stage 5 — Release certification

- Remove MongoDB from runtime and deployment configuration.
- Run backend build, unit, integration, migration, and concurrency tests.
- Run frontend build without fatal diagnostics.
- Run critical Playwright flows on desktop and mobile.
- Demonstrate PostgreSQL backup and restore.
- Align versions, commit the exact source, and tag the candidate.

Exit criteria: every Release 1 gate in `docs/release-spec-tracker.md` passes.

## Cutover sequence

1. Stop the MongoDB-backed development application.
2. Recreate the PostgreSQL development/review database.
3. Apply PostgreSQL migrations.
4. Run the deterministic client-demo seed and validation.
5. Start the PostgreSQL-backed application.
6. Execute smoke and critical workflow tests.
7. Approve the client-review build.
