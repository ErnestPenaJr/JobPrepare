# Repository Guidelines

## Project Structure & Module Organization
- Current repo is minimal; prefer a clear layout:
  - `src/` application modules and services
  - `tests/` unit/integration tests
  - `assets/` static files (images, data, fixtures)
  - `scripts/` helper scripts for dev/build/test
  - `docs/` design notes and ADRs

Example:
```
src/  tests/  assets/  scripts/  docs/
```

## Build, Test, and Development Commands
- `./scripts/dev.sh`: start local dev server or file watcher.
- `./scripts/test.sh`: run the fast test suite with coverage.
- `./scripts/lint.sh`: run linters/formatters; fix trivial issues.
- `./scripts/build.sh`: produce release artifacts.

If scripts are not present yet, use stack defaults, e.g. `pytest -q` (Python) or `npm run dev`, `npm test`, `npm run build` (Node). Make scripts executable: `chmod +x scripts/*.sh`.

## Coding Style & Naming Conventions
- Indentation: 2 spaces (JS/TS/JSON/YAML), 4 spaces (Python).
- Naming: kebab-case for files/dirs, `snake_case` for Python, `camelCase` for JS functions, `PascalCase` for classes.
- Tools: prefer Prettier + ESLint (JS/TS) and Black + Flake8 (Python). Run `./scripts/lint.sh` locally before opening a PR.

## Testing Guidelines
- Location: place tests under `tests/` mirroring `src/` structure.
- Naming: `test_*.py` (Python) or `*.spec.ts`/`*.test.ts` (TS/JS).
- Coverage: target ≥80% where practical; focus on critical paths.
- Run locally via `./scripts/test.sh` or stack defaults (`pytest -q`, `npm test`).

## Commit & Pull Request Guidelines
- Branches: `feature/<short-desc>` or `fix/<short-desc>`.
- Commits: follow Conventional Commits (e.g., `feat(auth): add JWT refresh`).
- PRs: include a concise description, linked issues (e.g., `Closes #123`), screenshots for UI changes, and notes on testing/rollout. Ensure lint/tests pass.

## Security & Configuration Tips
- Never commit secrets; use `.env` (gitignored) and provide `.env.example`.
- Prefer parameterized config with safe defaults. Validate inputs and handle errors explicitly.
- Optional: run a quick secret scan if available (`gitleaks detect --no-banner`).

# AGENT 1:
## Resume-Job Match Analyzer
- Purpose: Compare resume and cover letter against job descriptions to identify gaps and strengths
- Core Functions:
  - Parse and extract key requirements from job descriptions
  - Compare candidate qualifications against job requirements
  - Identify missing skills, certifications, or experience
  - Highlight strong matches and competitive advantages
  - Generate gap analysis report
- Inputs: Resume file, cover letter file (optional), job description
- Outputs: Detailed gap analysis with strengths and weaknesses

# AGENT 2:
## Multi-Criteria Qualification Scorer
- Purpose: Calculate objective qualification scores using multiple evaluation methods
- Core Functions:
  # Score candidates on 1-10 scale across 10 different weighting criteria:
    - Technical skills match
    - Years of experience alignment
    - Certification relevance
    - Industry experience fit
    - Tool/technology proficiency
    - Educational background match
    - Achievement relevance
    - Role level appropriateness
    - Domain expertise alignment
    - Soft skills indicators
  - Show all 10 iteration scores transparently
  - Calculate final average score
  - Perform verification re-evaluation if score ≥ 8.0
- Inputs: Resume, job description
- Outputs: 10 individual scores, final averaged score, evaluation breakdown

# AGENT 3:
## Eligibility & Deal-Breaker Screener
- Purpose: Apply hard stop conditions and immediate rejection criteria
- Core Functions:
  - Check final qualification score threshold (must be ≥ 8.0)
  - Screen for disqualifying keywords:
    - "manufacturing", "plant", "factory", "warehouse"
    - "OT" (operational technology - unless IT/cybersecurity context)
    - "SCADA" (unless paired with IT security)
    - "industrial controls" (unless cybersecurity-focused)
  - Check experience requirements:
    - Reject if requires 8+ years experience
    - Reject if requires managing 5+ direct reports
    - Reject if requires clearances not possessed (Secret, Top Secret, TS/SCI)
  - Check location requirements:
    - Reject if location is California or New York
    - Reject if requires full-time on-site (unless waived)
  - Check role focus:
    - Reject if purely physical security only
    - Reject if purely compliance auditing only
    - Reject if purely governance/risk management without technical components
- Inputs: Qualification score, job description, candidate profile
- Outputs: PASS/FAIL decision with specific reason if rejected

# AGENT 4: 
## Truthful Cover Letter Customizer
- Purpose: Tailor existing cover letters to specific job requirements without fabrication
- Core Functions:
  - Use current date automatically
  - Highlight candidate's 5 years cybersecurity experience
  - Emphasize technical skills that match job requirements
  - Showcase relevant achievements from resume
  - INTEGRITY GUARDRAILS:
    - Only reference skills/tools actually in resume
    - Never fabricate certifications or qualifications
    - Never embellish experience levels
    - Flag if job requires skills not in resume (suggest training/learning plan instead)
- Inputs: Existing cover letter, resume, job description
- Outputs: Customized cover letter with truthfulness verification report

# Workflow Integration:
## Sequential Process:
- Agent 3 (Screener) → Quick disqualification check
- Agent 2 (Scorer) → Calculate qualification score
- Agent 3 (Screener) → Verify score threshold
- Agent 1 (Analyzer) → Detailed gap analysis (if passed)
- Agent 4 (Customizer) → Generate tailored cover letter (if requested)

## Independent Use:
- Each agent can function standalone for specific tasks
- Agents 1 & 2 provide insights even for rejected positions (learning opportunities)