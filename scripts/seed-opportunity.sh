#!/usr/bin/env bash
# seed-opportunity.sh — wipe + seed opportunities (delegates to seed-opportunity.py)
# Usage:
#   ./scripts/seed-opportunity.sh            # wipe + seed
#   ./scripts/seed-opportunity.sh --clean    # wipe only
#   ./scripts/seed-opportunity.sh [base_url] # custom API base
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "$DIR/seed-opportunity.py" "$@"
