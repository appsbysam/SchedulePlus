# Power Up Quotes

Power Up-only feature development. Keep the shared SchedulePlus baseline and other tenants unchanged.

Planned: quote editor, reusable catalogue, saved quotes, PDF preview, Microsoft 365 send from sales@powerup.sydney, and conversion to jobs.

Security requirements: tenant-scoped Supabase RLS, role checks, and server-side Microsoft Graph credentials. Do not enable live email sending until tested.

## Release versioning — mandatory
- Development branch does not change the live version.
- On release, bump APP_VERSION in root version.js to the next available version, update matching cache-busting references in powerup/index.html, and update the What's New modal and service-worker cache/version as appropriate.
- Verify installed Power Up PWA updates and displays the new version before calling release complete.
- Do not change other tenant behaviour as part of a Power Up-only release.

## Current implementation
- Saved quote list, create/edit, status selector, catalogue lookup, PDF print preview.
- Quote statuses are manually selected; setting Sent does NOT send email.
- Cloud storage tables and Power Up membership RLS created in the PowerUp Supabase project.
- Pending: authenticated browser end-to-end tests, owner-controlled catalogue maintenance, atomic quote line saving, quote-to-job workflow, Microsoft 365 permissions and email sending.
