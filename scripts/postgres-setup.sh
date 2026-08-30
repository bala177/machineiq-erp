#!/usr/bin/env bash
set -euo pipefail

DB_NAME="machineiq"
TEST_DB_NAME="machineiq_test"
DB_USER="machineiq"
DB_PASSWORD="machineiq"

if ! command -v psql >/dev/null 2>&1; then
  echo "PostgreSQL client is not installed. Install PostgreSQL 16 first."
  exit 1
fi

if ! pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
  echo "Starting the local PostgreSQL cluster (sudo may prompt for your password)..."
  sudo pg_ctlcluster 16 main start
fi

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1; then
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE ROLE $DB_USER LOGIN PASSWORD '$DB_PASSWORD'"
fi

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1; then
  sudo -u postgres createdb --owner="$DB_USER" "$DB_NAME"
fi

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$TEST_DB_NAME'" | grep -q 1; then
  sudo -u postgres createdb --owner="$DB_USER" "$TEST_DB_NAME"
fi

echo "PostgreSQL ready: postgresql://$DB_USER:***@localhost:5432/$DB_NAME"
echo "Disposable test database ready: $TEST_DB_NAME"
echo "Next: npm --prefix backend run db:migration:run"
