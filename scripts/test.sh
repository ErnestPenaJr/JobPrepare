#!/usr/bin/env bash
set -euo pipefail

echo "[tests] Installing web dependencies..."
npm install --prefix web

echo "[tests] Ensuring Playwright browsers are installed..."
(cd web && npx playwright install chromium)

echo "[tests] Running Playwright e2e (screenshots in web/tests-artifacts)..."
(cd web && npx playwright test --project=chromium --reporter=list)

echo "[tests] Done. Artifacts in ./web/tests-artifacts"

