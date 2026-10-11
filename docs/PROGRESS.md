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
