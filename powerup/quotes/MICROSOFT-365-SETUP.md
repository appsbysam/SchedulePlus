# Microsoft 365 — Power Up Solar quotation sending

Sender is the **separate Exchange Online UserMailbox** `sales@powerup.sydney`, NOT an alias of `solar@powerup.sydney`.

## Configured 11 October 2026
- Entra app: Schedule Plus - Power Up Quotes; client ID `df87f692-d775-46ae-9622-f8bb36c55c16`; tenant ID `0cd8b6ec-6277-4b28-bca7-f96905de7a82`.
- Enterprise application service principal object ID: `acf76ec2-cdca-4cd0-9404-85e52287b408`.
- Exchange service principal registered, management scope `PowerUp-Quotes-Sales-Only` filters `PrimarySmtpAddress -eq 'sales@powerup.sydney'`.
- Exchange management role assignment `PowerUp-Quotes-MailSend` uses `Application Mail.Send` with that scope.
- `Test-ServicePrincipalAuthorization` yielded `InScope=True` for sales and `False` for solar.
- Broad Microsoft Graph `Mail.Send` application permission removed from Entra; do not re-add or grant admin consent.
- Three `POWERUP_MS_*` secrets stored in Supabase Edge Function Secrets. Never commit credentials.
- Client secret expiry 11 October 2027. Renew before expiry.

## Runtime
- `powerup-send-quote` validates a logged-in Power Up admin/owner, loads saved quote and line items, generates PDF and calls Graph `POST /users/sales@powerup.sydney/sendMail` with an attached PDF. Only an HTTP 202 counts as accepted, not proof of delivery.
- Records attempt and sets quote to `sent` on acceptance.
- First real authenticated browser/email test still required. Check Sent Items, recipient inbox and the Power Up quote record.
