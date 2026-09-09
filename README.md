# Apex Partner Portal

Private partner-program application and operations portal for Apex Fleet Consulting LLC.

## Capabilities

- Public partner application with private supporting-document storage
- Email notifications when partner applications or referrals arrive
- Admin-only application, agreement, referral, routing, and payout workflow
- Approval automatically changes the agreement state to **Agreement Sent** and emails instructions
- Passwordless partner access through Supabase email links; no ChatGPT account required
- Agreement issued, viewed, signed, and declined audit timestamps
- Structured referral qualification with objective score and reasons
- Referral, compensation, and payout visibility for each authenticated partner
- Printable application-to-payout workflow restricted to authorized Apex admins

## Stack

- Next.js 16 / React 19
- Supabase Auth, Postgres, and private Storage
- Resend transactional email
- Vercel hosting

See [DEPLOYMENT.md](DEPLOYMENT.md) for setup and end-to-end testing.

## Local development

1. Copy `.env.example` to `.env.local` and fill in the project values.
2. Run the Supabase migration in `supabase/migrations/0001_partner_portal.sql`.
3. Install dependencies with `npm install`.
4. Start with `npm run dev`.

Run `npm test` before deploying.
