#!/usr/bin/env bash
set -uo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CANDIDATE_INPUT="${1:-working-tree}"
CANDIDATE="$(printf '%s' "$CANDIDATE_INPUT" | tr -cs 'A-Za-z0-9._-' '-')"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
REPORT_DIR="$ROOT_DIR/logs/release-checks/${TIMESTAMP}-${CANDIDATE}"
SUMMARY="$REPORT_DIR/summary.md"
SOURCE_DOC="$ROOT_DIR/docs/customer-references/Dashboard.docx"
EXPECTED_SOURCE_HASH="3acddd37fca8a16622147664f8cfe52ee6a5a66c5877bc70c867b196577a8df2"

mkdir -p "$REPORT_DIR"

if git -C "$ROOT_DIR" rev-parse --verify HEAD >/dev/null 2>&1; then
  SOURCE_REVISION="$(git -C "$ROOT_DIR" rev-parse HEAD)"
else
  SOURCE_REVISION="NO_COMMIT"
fi

BACKEND_VERSION="$(node -p "require('$ROOT_DIR/backend/package.json').version")"
FRONTEND_VERSION="$(node -p "require('$ROOT_DIR/frontend/package.json').version")"
ACTUAL_SOURCE_HASH="MISSING"
if [ -f "$SOURCE_DOC" ]; then
  ACTUAL_SOURCE_HASH="$(sha256sum "$SOURCE_DOC" | awk '{print $1}')"
fi

declare -a CHECK_NAMES=()
declare -a CHECK_RESULTS=()
OVERALL_EXIT=0

run_check() {
  local name="$1"
  local log_name="$2"
  shift 2
  CHECK_NAMES+=("$name")
  echo "Running $name..."
  if "$@" >"$REPORT_DIR/$log_name" 2>&1; then
    CHECK_RESULTS+=("PASS")
  else
    CHECK_RESULTS+=("FAIL")
    OVERALL_EXIT=1
  fi
}

if [ "$ACTUAL_SOURCE_HASH" = "$EXPECTED_SOURCE_HASH" ]; then
  CHECK_NAMES+=("Client specification hash")
  CHECK_RESULTS+=("PASS")
else
  CHECK_NAMES+=("Client specification hash")
  CHECK_RESULTS+=("FAIL")
  OVERALL_EXIT=1
fi

if [ "$BACKEND_VERSION" = "$FRONTEND_VERSION" ]; then
  CHECK_NAMES+=("Frontend/backend version alignment")
  CHECK_RESULTS+=("PASS")
else
  CHECK_NAMES+=("Frontend/backend version alignment")
  CHECK_RESULTS+=("FAIL")
  OVERALL_EXIT=1
fi

if [ "$CANDIDATE_INPUT" = "working-tree" ]; then
  CHECK_NAMES+=("Candidate/package version match")
  CHECK_RESULTS+=("SKIPPED (no candidate version supplied)")
else
  EXPECTED_VERSION="${CANDIDATE_INPUT#v}"
  if [ "$BACKEND_VERSION" = "$EXPECTED_VERSION" ] && [ "$FRONTEND_VERSION" = "$EXPECTED_VERSION" ]; then
    CHECK_NAMES+=("Candidate/package version match")
    CHECK_RESULTS+=("PASS")
  else
    CHECK_NAMES+=("Candidate/package version match")
    CHECK_RESULTS+=("FAIL (expected $EXPECTED_VERSION)")
    OVERALL_EXIT=1
  fi
fi

run_check "Backend production build" "backend-build.log" npm --prefix "$ROOT_DIR/backend" run build
run_check "Backend unit tests" "backend-tests.log" npm --prefix "$ROOT_DIR/backend" test -- --runInBand

if [ -n "${POSTGRES_TEST_DATABASE_URL:-}" ]; then
  run_check "PostgreSQL migration integration" "postgres-integration.log" env \
    POSTGRES_TEST_DATABASE_URL="$POSTGRES_TEST_DATABASE_URL" \
    npm --prefix "$ROOT_DIR/backend" run test:postgres
else
  CHECK_NAMES+=("PostgreSQL migration integration")
  CHECK_RESULTS+=("SKIPPED (set POSTGRES_TEST_DATABASE_URL to a disposable database)")
fi

run_check "Frontend production build" "frontend-build.log" npm --prefix "$ROOT_DIR/frontend" run build

FRONTEND_INDEX=$((${#CHECK_RESULTS[@]} - 1))
if grep -Eq "ERR_INVALID_URL|TypeError: Failed to parse URL|Failed to compile|Build error occurred" "$REPORT_DIR/frontend-build.log"; then
  CHECK_RESULTS[$FRONTEND_INDEX]="FAIL (fatal diagnostic found)"
  OVERALL_EXIT=1
fi

if [ "${RUN_E2E:-0}" = "1" ]; then
  run_check "Frontend Playwright E2E" "frontend-e2e.log" npm --prefix "$ROOT_DIR/frontend" run test:e2e -- --workers=1
else
  CHECK_NAMES+=("Frontend Playwright E2E")
  CHECK_RESULTS+=("SKIPPED (set RUN_E2E=1)")
fi

{
  echo "# MachineIQ release check"
  echo
  echo "| Field | Value |"
  echo "|---|---|"
  echo "| Timestamp | $TIMESTAMP |"
  echo "| Candidate | $CANDIDATE_INPUT |"
  echo "| Source revision | $SOURCE_REVISION |"
  echo "| Backend version | $BACKEND_VERSION |"
  echo "| Frontend version | $FRONTEND_VERSION |"
  echo "| Client specification hash | $ACTUAL_SOURCE_HASH |"
  echo
  echo "| Check | Result |"
  echo "|---|---|"
  for index in "${!CHECK_NAMES[@]}"; do
    echo "| ${CHECK_NAMES[$index]} | ${CHECK_RESULTS[$index]} |"
  done
  echo
  if [ "$OVERALL_EXIT" -eq 0 ]; then
    echo "Automated build checks passed. Release approval still requires the target checklist and required E2E checks in docs/release-spec-tracker.md."
  else
    echo "Automated build checks failed. This candidate is not releasable."
  fi
} >"$SUMMARY"

cat "$SUMMARY"
echo
echo "Evidence: $SUMMARY"
exit "$OVERALL_EXIT"
