# YSSE main portal

A modular functional demonstration of YSSE's public portal, learning resources and virtual internship recruitment.

**Live demo:** https://ysse-portal.vercel.app

**Project documentation (PDF):** [YSSE Main Portal Documentation](docs/YSSE-Main-Portal-Documentation.pdf) — 27 October 2026; implementation, workflows, setup, verification and alignment with the supplied research report.

Vercel is connected to this repository. Pushes to `main` trigger production deployment. Hosted recruitment data uses Neon PostgreSQL; use sample data only.

## Run locally

Requires Node.js 24. Install the locked dependencies first.

```sh
npm ci
npm start
```

On Windows PowerShell with script restrictions use `npm.cmd start`. Open http://127.0.0.1:3000.

Without `DATABASE_URL`, the database is created automatically in ignored `data/ysse.sqlite`; applications survive server restarts. Hosted deployments use Neon PostgreSQL through `DATABASE_URL`.

## Try the demo

Open **Sign in**. Both seeded local accounts use password `YsseDemo2026!`:

- Applicant: `applicant@demo.ysse.test`
- Staff: `staff@demo.ysse.test`

Use separate browser profiles or a private window for applicant and staff. Follow the [demo walkthrough](docs/DEMO-WALKTHROUGH.md) to submit an application, review it, schedule an interview, accept an offer and complete onboarding.

Use sample information. Notifications are previews, and account emails are not verified. This is not a live recruitment campaign. The hosted demo uses the same shared sample credentials.

## Development and verification

Install the locked development tools:

```sh
npm ci
npm run check
npm test
npm run test:browser
npm run format:check
```

Windows browser checks use installed Microsoft Edge. On other systems install Chromium first with `npx playwright install chromium` (`--with-deps` on CI). Browser tests use port 3100 and isolated in-memory data. `npm run dev` watches backend changes; refresh the browser for frontend edits. `npm run format` formats source files.

A ready-to-use [GitHub Actions template](docs/ci/portal-checks.yml) runs syntax, formatting, API and browser checks on pushes and pull requests. To enable it, copy it to `.github/workflows/ci.yml` using GitHub's web editor or a credential with workflow permission. The current push credential cannot create workflow files, so automatic CI is not enabled yet. Local checks have been run separately.

## Structure

- `public/js/pages/` — feature page modules
- `public/js/data.js` — public reference and illustrative content
- `public/js/ui.js` — shared rendering utilities
- `public/styles.css` — responsive design system
- `server/` — HTTP server and recruitment services
- `docs/TASKS.md` — delivery board and production backlog
- `docs/PROGRESS.md` — lead-ready milestone updates
- `docs/DEMO-WALKTHROUGH.md` — complete applicant/staff demonstration
- `docs/ARCHITECTURE.md` — storage, access rules and production boundaries
- `docs/CONTENT-SOURCES.md` — verified sources and content still needed
- `docs/VERCEL.md` — hosted runtime, database configuration and deployment checks
- `api/index.js` — Vercel function adapter

## Configuration

See `.env.example`. Set environment variables in your shell; no `.env` loader is required. Default address: `127.0.0.1:3000`. Example PowerShell: `$env:PORT = '3002'; npm.cmd start`.

`DEMO_MODE=false` disables built-in demo accounts and self-registration. It does not make this app production-ready. The Vercel demo uses sample accounts and data only; review the production backlog before accepting real applicants.

This is a demonstration. It does not represent a live YSSE recruitment campaign. Organization information links to published sources; proposed department copy, hierarchy and learning content are labelled as samples.
