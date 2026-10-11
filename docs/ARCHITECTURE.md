# Architecture and operating boundaries

## Runtime

Node.js 24 serves a vanilla HTML/CSS/JavaScript frontend and a JSON API. Runtime code has no third-party dependencies. Development tools are locked in `package-lock.json`. Browser routes use the URL hash; the server still must run because recruitment and account features require the API.

The visual direction uses an original SVG illustration and a proposed mark. Fonts load from Google Fonts with system fallbacks. No external images, Facebook feed or analytics scripts are required for the demo.

## Modules

| Module                           | Responsibility                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------- |
| `public/js/app.js`               | Route dispatch, layout, session-aware navigation and page binding                 |
| `public/js/pages/public.js`      | Organization, department, learning and update views                               |
| `public/js/pages/recruitment.js` | Authentication, application, applicant dashboard and shared recruitment rendering |
| `public/js/pages/staff.js`       | Staff review, batch controls, announcements and CSV export                        |
| `public/js/ui.js`                | Escaping, shared UI patterns and feedback                                         |
| `public/js/api.js`               | JSON requests and session state                                                   |
| `server/index.js`                | HTTP/static serving and security headers                                          |
| `server/database.js`             | Schema, sample account seeding, settings and transactional history                |
| `server/api.js`                  | Authentication, request protection, permissions and API dispatch                  |
| `server/recruitment.js`          | Validation, ownership, application serialization and transition rules             |

## Storage

The ignored `data/ysse.sqlite` database stores accounts, sessions, batch settings, announcements, applications, CV bytes, evaluation records, history and notification previews. SQLite WAL files can also appear in `data/`. Database and CV files never enter Git. API and browser tests use isolated databases.

The application identifier is a UUID; the shortened reference displayed in the UI is for convenience. One account can create one application in the current batch. Submitted application details are locked. Every transition stores an actor, timestamp and applicant-safe message. Review notes and scores are excluded from applicant responses.

## Access and validation

- Passwords use salted scrypt hashes; session cookies are HTTP-only, same-site, and expire after eight hours.
- Role and ownership checks run on the server, including CV downloads and offer acceptance.
- JSON mutations require a custom request header and matching browser origin.
- Authentication attempts have a local process rate limit. This is not a distributed production limiter.
- PDF uploads require a PDF signature, `.pdf` name and size of at most 2 MB. Production uploads still need malware scanning and content validation.
- Deadlines, department openings, required fields, consent, interview dates, URLs and permitted status transitions are validated on the server.
- API data is escaped before rendering. CSP restricts scripts to the application and disallows framing.
- CSV exports neutralize formula prefixes.

All staff demo accounts have organization-wide recruitment access. Department-scoped reviewers and a separate final approver role need HR's approved permission matrix.

## Production work

This local demo is not ready for public recruitment with real applicant data. Before a production launch:

1. Obtain approved brand assets, content, staff identities, course recordings and recruitment rules.
2. Integrate email verification, account recovery and email delivery; replace sample accounts and offers.
3. Add department-scoped access, final approval controls, a retention policy and audited administrative operations.
4. Integrate durable file storage with scanning, reliable notifications and backups with a tested restore procedure.
5. Provision HTTPS hosting, secret management, monitoring and deployment rollback.
6. Plan existing website/forms/certificate integrations and data migration with their owners.
7. Add multiple-batch administration, recording access controls and course progress as required.

`DEMO_MODE=false` disables seeded demo-account access and new self-registration; it is not a production authentication integration. Custom accounts created during the demo remain unverified. Start from a clean production database with an approved identity flow.

The server binds to `127.0.0.1` by default. Do not expose the seeded-account demo publicly. Configure `PORT` and `HOST` through environment variables only when needed for a controlled preview.

## Verification

`npm test` covers the complete lifecycle and permission/validation boundaries. `npm run test:browser` uses Playwright with Edge on Windows or Chromium elsewhere, covering public navigation, filtering, downloads, mobile overflow and the full applicant/staff journey. Browser tests run against an in-memory database on port 3100. The CI template installs Chromium and runs the same checks after activation. It is stored in `docs/ci/portal-checks.yml` because the push credential lacks permission to create workflows. Passing local checks does not establish live integration or production readiness.
