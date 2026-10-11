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
