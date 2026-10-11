# Vercel deployment

The Vercel project is `ysse-portal` under `meherabmehus-projects`. Its production API uses an isolated Neon PostgreSQL database on the existing integration's **Free** plan in Singapore (`sin1`). Credentials are managed by the integration as project environment variables. They must never be copied into Git or client-side code.

Live URL: https://ysse-portal.vercel.app

GitHub repository: https://github.com/meherabmehu/YSSE_Intern. The project is connected to the repository; `main` pushes trigger production deployments.

Verified on the live URL: public assets, batch/session/health endpoints, sample account authentication, draft save, submission, staff screening and interview, selection, offer acceptance, onboarding, notification previews, and mobile frontend navigation. The synthetic QA applicant and its records were removed after the check.

## Runtime

- `public/` is the static frontend output.
- `api/index.js` handles API requests as a Node.js 24 function.
- `vercel.json` routes `/api/*` to the function and applies security headers.
- `DATABASE_URL` is mandatory for hosted API requests. The handler returns 503 if durable storage is unavailable; it does not silently switch to temporary SQLite.
- Local development uses SQLite unless `DATABASE_URL` is explicitly set.
- PostgreSQL uses pooled connections, transactions and status compare-and-swap checks. History and notifications roll back if a competing reviewer already changed the status.
- The integration also provides an unpooled URL used only for isolated database integration checks.

The hosted database starts fresh. Existing local SQLite applications have not been migrated. The local file remains unchanged.

## Deploy from the existing linked checkout

```sh
vercel --scope meherabmehus-projects deploy --prod
```

This requires the CLI's existing authorized login. `.vercel/` is checkout-local and ignored by Git. Ignore `.env*` files containing downloaded environment values. `.env.example` contains placeholders only.

## Check durable storage without touching demo records

Pull the project's environment into an ignored file, then run the PostgreSQL test. It creates a uniquely named schema, runs the complete recruitment journey across two app instances and removes only that schema.

```powershell
vercel.cmd --scope meherabmehus-projects env pull .env.vercel.local --environment production --yes
$env:YSSE_TEST_POSTGRES = '1'
node --env-file=.env.vercel.local --test tests/postgres.integration.test.js
```

Regular API and browser tests explicitly use local isolated SQLite databases. They cannot write to the hosted database accidentally.

## Demo boundaries

This deployment is a public functional demonstration with shared sample account credentials. Use fabricated information and sample CVs only. Anyone using the staff demo can review submitted sample applications. Account ownership is not verified, notifications do not send email, and staff roles are not yet department-scoped.

Before using real applicants, replace shared accounts, implement verified identity and account recovery, approve role permissions and retention policies, add file scanning and backups, and obtain approved organization content. Vercel deployment alone does not complete those production requirements.
