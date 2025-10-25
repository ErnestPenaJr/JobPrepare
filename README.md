# JobPrep - Resume & Job Description Analyzer

A Next.js web application that helps job seekers objectively assess their qualification for positions by comparing their resume against job descriptions through multi-perspective scoring analysis.

## 🚀 Quick Deploy

**Deploy to production in ~20 minutes:**
- **[Quick Start Guide](./QUICKSTART_DEPLOY.md)** - Streamlined deployment to Netlify + MySQL
- **[Full Deployment Guide](./docs/DEPLOYMENT.md)** - Comprehensive instructions
- **[Deployment Checklist](./docs/DEPLOYMENT_CHECKLIST.md)** - Step-by-step checklist

**Stack:** Next.js 15 + React 19 + MySQL (Prisma) + Netlify

**Database:** MySQL at `pena-cloud.network:3307/JOBPREP`

---

## 💻 Local Development

### Prerequisites
- Node.js 18+
- MySQL database (local or PlanetScale)

### Setup
```bash
# Install dependencies
cd web
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your DATABASE_URL

# Initialize database
npx prisma db push

# Start development server
npm run dev
```

Open http://localhost:3000

## Endpoints
- `POST /extract` — `{ document: { text } }` → basic skills/years/location extraction.
- `POST /analyze` — `{ jd:{text}, resume:{text}, coverLetter?:{text}, settings?:{ timezone, today } }` → returns scorecard, gaps, keywords, decision, and stop condition reasons if any.
- `POST /cover-letter` — `{ jd:{text}, resume:{text}, existingCoverLetter?:{text}, settings?:{today} }` → returns a rules‑only tailored letter (no fabrication) using verified skills.
- `POST /delete-session` — 204 No Content.
- `POST /upload` — multipart form with `file` → parses PDF/DOCX/TXT and returns `{ fileId, text }`.
- `POST /fetch-url` — `{ url }` → fetches URL server‑side; strips HTML to text.

This is a rules‑only baseline meant to satisfy PRP §5, §7, §8, §10, and §11 at a minimal level without external parsers or LLMs. Replace extractors with robust parsers and add LLM integration in a later pass.

## Frontend
- No dependencies; single-page app in `/frontend` served by the backend.
- Three columns: Inputs, Analysis Results, Actions.
- Supports paste, basic file text read, and URL fetch (CORS permitting).
