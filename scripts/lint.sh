#!/usr/bin/env bash
set -euo pipefail

# Root has no linter configured; run web eslint if present
if [ -d web ]; then
  (cd web && npx eslint . || true)
fi

