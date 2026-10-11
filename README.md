# frontend

Evidence-centric reviewer workspace for the **Evidence-First AI 3PL Invoice Reconciliation Engine** (part of COMPFEST AI Innovation Challenge — Smart Logistics).

## Phase 0 Status

Implemented now:
- Next.js 15 App Router scaffold with TypeScript & Tailwind CSS
- Health check API endpoint at `GET /api/health`
- API client helper in `src/lib/api.ts`
- Base design system tokens and dark-mode foundation
- Container Dockerfile and safe `.env.example`

Full document review UI, bounding-box evidence viewer, exception queue, and dispute package export will be implemented in subsequent phases after the core reconciliation engine and schemas are validated.

## Local Development

```bash
# Copy environment template
cp .env.example .env.local

# Install dependencies
npm install

# Run development server on port 3000
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Docker Deployment

Build and run standalone:

```bash
docker build -t aic-frontend .
docker run -p 3000:3000 aic-frontend
```

Or via the unified Docker Compose in sibling `infra` repository:

```bash
docker compose -f ../infra/docker-compose.yml up --build
```

## Repository Boundaries

- `frontend`: Reviewer-facing UI, bounding-box overlays, exception triage, and human approval/dispute actions.
- `backend-api`: API Gateway, job lifecycle, deterministic pricing, reconciliation, audit trail.
- `ai-service`: Document OCR, layout analysis, structured extraction, signature detection.
- `schemas`: Canonical versioned JSON contracts.
- `infra`: Docker Compose, migrations, policies, thresholds.
- `synthetic-data`: Dataset generator and benchmark test cases.

> **Note:** The frontend never executes OCR models or performs financial calculations directly. It consumes structured evidence and allows human reviewers to inspect, verify, approve, or dispute cases.
