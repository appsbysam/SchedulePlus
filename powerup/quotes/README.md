# Power Up Solar Quotes

Power Up-only quote editor and server-side Microsoft 365 email sending. Supabase PowerUp project: `otrzmqyqbyovjggdswzn`.

## Implemented
- Save/reopen/duplicate quote, GST-inclusive line items, admin catalogue, preview/print, convert accepted quote to job.
- Email send button sends a **saved and unchanged** quotation PDF to its stored customer email address via Supabase Edge Function `powerup-send-quote`.
- Server validates authenticated Power Up admin/owner membership, fetches quote and lines from database, builds PDF, authenticates Microsoft Graph with server-side credentials, submits from `sales@powerup.sydney`, records attempt and updates quote status after Graph HTTP 202.
- Exchange Application RBAC Mail.Send restricted to sales mailbox. Broad Microsoft Entra Mail.Send application permission removed.
- Supabase secrets: `POWERUP_MS_CLIENT_ID`, `POWERUP_MS_TENANT_ID`, `POWERUP_MS_CLIENT_SECRET`.
- Send attempt table `powerup_quote_send_attempts`, atomic begin RPC `powerup_begin_quote_send` prevents concurrent duplicate submissions. Database RLS denies direct client log access.

## Verification needed
- No authenticated browser end-to-end test or live Graph delivery test has yet been completed. Microsoft Graph 202 means accepted for processing, not delivered. Verify Sent Items and recipient inbox, and confirm an unrelated mailbox is denied.
- Admin-only sending is intentional; sales users without admin role cannot send until explicit policy decision.
- Secret expires 11 October 2027; renew in advance.
- Frontend release must update version.js, sw.js, Power Up cache references and What's New notes. Other tenants' behaviour must remain unchanged.
