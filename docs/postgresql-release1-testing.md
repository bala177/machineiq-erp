# Release 1 PostgreSQL testing

Release 1 uses PostgreSQL 16 as its only runtime database. `DATABASE_URL` must
point to PostgreSQL; MongoDB is not loaded by the application.

## Local setup and demo data

```bash
./scripts/postgres-setup.sh
npm --prefix backend run db:migration:run
npm --prefix backend run seed
npm --prefix backend run db:validate
```

The demo login is `reviewer@machineiq.local` / `ChangeMe123!`. Change this
password when the database is used outside an isolated local test environment.

## Automated database gate

The local setup script creates the disposable `machineiq_test` database. Run:

```bash
POSTGRES_TEST_DATABASE_URL=postgresql://machineiq:machineiq@localhost:5432/machineiq_test \
  npm --prefix backend run test:postgres
```

The integration test drops everything in the supplied database, applies the
baseline migration, verifies all Release 1 tables, reverts the migration, and
applies it again. Never point `POSTGRES_TEST_DATABASE_URL` at development,
review, or production data.

To include this test in release evidence:

```bash
POSTGRES_TEST_DATABASE_URL=postgresql://machineiq:machineiq@localhost:5432/machineiq_test \
  npm run release:check -- v2.1.0-rc.1
```

## Backup and restore

```bash
pg_dump --format=custom --file=machineiq.dump "$DATABASE_URL"
createdb machineiq_restore
pg_restore --exit-on-error --no-owner \
  --dbname=postgresql://machineiq:machineiq@localhost:5432/machineiq_restore \
  machineiq.dump
DATABASE_URL=postgresql://machineiq:machineiq@localhost:5432/machineiq_restore \
  npm --prefix backend run db:validate
```

For recovery, stop application writes, restore the latest verified dump into a
new database, run `db:validate`, then change `DATABASE_URL` to the restored
database. Retain the previous database until acceptance checks pass.
