# Microsoft 365 sending — permission handoff

Target sender: `sales@powerup.sydney` (alias of `solar@powerup.sydney`).

## Required from the Microsoft 365 administrator

1. Confirm `sales@powerup.sydney` is a verified Exchange Online proxy address on the intended mailbox.
2. Confirm Exchange Online **Send from alias** is enabled for the organisation and test that the alias remains visible to recipients.
3. Authorise a dedicated Entra ID app registration for the server-side email integration, with the narrowest workable Microsoft Graph `Mail.Send` permissions. Scope access to the intended mailbox with Exchange application RBAC where supported. Do not grant unrestricted organisation-wide mailbox access.
4. Provide the tenant ID, app/client ID and a securely stored app credential **through Supabase secrets**, not in GitHub, chat, or browser JavaScript.
5. Confirm whether the sales rep is allowed to send quotes independently or whether admin approval is required.

## Integration design

- Browser calls a Supabase Edge Function using its authenticated session.
- Function verifies the user is an active member of Power Up, checks quote status and ownership/role, and loads saved quote data from Supabase.
- Function renders a branded PDF and sends via Graph, then records a delivery attempt and marks status `sent` only after Graph accepts the request.
- Prevent duplicate sends with an idempotency key; log errors without storing access tokens or secrets.
- Never trust recipient, sender, price, quote ID or role supplied only by the browser.

**Not enabled or deployed yet.** Microsoft 365 permission approval is the next external dependency.
