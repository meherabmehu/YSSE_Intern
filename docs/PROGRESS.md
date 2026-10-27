# Lead progress updates

## Milestone 1 — foundation

Built the public portal with separate page modules, shared UI utilities and a responsive visual system. Added the nine verified department names, sample learning resources, search/filter controls and official social/certificate links.

Verified content comes from ysseglobal.org and internship.ysseglobal.org. Department descriptions, reporting roles, courses and announcements are explicitly illustrative. Real team identities and current recruitment openings require approval.

Next: persistent applicant and staff recruitment workflows, then integration checks and handover documentation. No external messages have been sent.

## Milestone 2 — recruitment pipeline

Added SQLite persistence, password hashing, HTTP-only sessions and role/ownership checks. Applicants can save drafts, attach a PDF CV or portfolio, review and submit, track status, accept an offer and withdraw. Staff can screen applications, save private scores/notes, schedule interviews, select or waitlist candidates, and complete onboarding after offer acceptance. Each transition records an actor, timestamp and notification preview.

Added batch/deadline/department configuration, application filtering, CSV export and demo announcement management. No emails are sent. Demo sign-up deliberately does not claim to verify email ownership.

Validation: all 12 backend integration checks pass, including the complete journey, private-note isolation, unauthorized access, duplicate applications, closed deadlines, invalid transitions, CV handling and database restart persistence. Formatted source for readability.

Next: browser interaction and responsive checks, setup/walkthrough documentation and GitHub CI. Real team data, approved recordings, email delivery and production hosting remain on the backlog.

## Milestone 3 — verified demonstration and handover

Completed the initial functional demo. Added explicit dashboard refresh, corrected the mobile hero overflow and keyboard skip navigation, protected applicant drafts from direct staff access, and re-read current state after request I/O to prevent duplicate concurrent stage changes. Disabled seeded-account access when demo mode is off.

Validation: 14 API integration tests and two Playwright browser suites pass locally. Browser suites cover public pages, department search, course filters, lesson navigation, worksheet downloads, mobile navigation/overflow, draft reload, submission, private evaluation, interview scheduling, selection, offer acceptance, onboarding, filtered CSV export, batch closure and announcement publication. Checked desktop and mobile screenshots visually. JavaScript syntax and source formatting checks pass.

Added setup instructions, a complete walkthrough, architecture/security boundaries, source inventory, task/PR templates and a GitHub Actions template. It runs the same checks with Chromium on Linux; local browser checks used Microsoft Edge on Windows. GitHub rejected the workflow-path push because the current token lacks workflow scope. The template is therefore stored in `docs/ci/portal-checks.yml`; activation remains pending and no remote CI pass is claimed.

Delivery used three meaningful milestone pushes. The first two were separated by about eleven minutes; the final push followed browser verification, fixes and documentation. No artificial empty commits or external lead messages were created. This document is ready for the project lead to review.

Remaining production work is listed in TASKS.md: approved brand/team/course data, verified identity and email delivery, department-specific access, production hosting/backups and integration with existing systems. The demo stores local data and previews notifications; no live recruitment campaign or emails were launched.

## Deployment milestone — Vercel and durable hosted storage

Deployed the functional demo at https://ysse-portal.vercel.app and connected the existing GitHub repository for automatic deployment on main pushes. Added a Node.js 24 Vercel function adapter, routing/security headers and asynchronous database support. Local SQLite remains available; hosted sessions, applications, CVs, reviews and notifications use a new isolated Neon PostgreSQL database on the existing integration's Free plan in Singapore. Credentials are environment variables and ignored local files, never repository content.

Validation: 15 local API/adapter tests pass, the live PostgreSQL integration test passes in an isolated temporary schema, and both local browser suites pass. Verified the full recruitment lifecycle on the actual hosted API with a synthetic QA applicant; removed only that generated account and its records afterwards. Live mobile homepage and internship navigation show no overflow or JavaScript errors. Hosted health, batch, session and static assets all return HTTP 200.

The Vercel connector could not access the team scope, so deployment used the CLI's existing authorized login in the same scope. No new paid plan or integration subscription was purchased. Local SQLite data was not migrated. The hosted site is still a sample-data demo with shared accounts; real recruitment requires the previously listed identity, permissions, approved content, email and data-management work. One additional meaningful deployment commit records this milestone.

## Visual refinement milestone

Added the official certificate-portal YSSE logo to the header, footer and favicon, nine original department emblems to directory cards and department pages, and local illustrative teamwork/learning photos. Added linked homepage insights using the sourced founding year and department count, plus hover/pointer and keyboard-focus feedback for exploration links. Simplified sign-in/register labels and headings by removing demo wording; shared sample accounts and the site-wide sample-data notice retain their purpose.

Validation: 15 local API tests and both browser suites pass. Reviewed desktop homepage and mobile department screenshots; mobile routes have no horizontal overflow. JavaScript syntax, formatting and diff checks pass. One meaningful visual-update commit is used for this request.
`nOne repeat browser run timed out waiting for the announcement toast; the initial and subsequent complete runs passed, including public announcement visibility. No recruitment code was changed for this visual milestone.

## PDF documentation handover ? 27 October 2026

Created docs/YSSE-Main-Portal-Documentation.pdf, a single 14-page project documentation and handover file. Reviewed the supplied Wing 05 Team A Research & Feasibility Report dated 23 October 2026 and mapped its broader proposals to the actual d9f6f95 code baseline. The PDF separates implemented features from partial and future work and documents public pages, all nine departments, learning, applicant/staff workflows, architecture, schema/API, security boundaries, local/hosted setup, risks, measures and source provenance. Screenshots use local sample data.

Fresh checks: JavaScript syntax passed; 15 API/adapter tests passed with the optional PostgreSQL test skipped; both Playwright browser suites passed. This documentation task did not mutate hosted records or rerun hosted PostgreSQL integration. The report layout was checked for page overflow before PDF generation.
