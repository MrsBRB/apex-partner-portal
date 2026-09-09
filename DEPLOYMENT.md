# Apex Partner Portal deployment

The replacement portal uses Vercel, Supabase, and Resend. Partners authenticate by emailed magic link and do not need ChatGPT accounts.

## 1. Supabase database

1. Open the Supabase project.
2. Open **SQL Editor** and run `supabase/migrations/0001_partner_portal.sql`.
3. In **Authentication → URL Configuration**, set the Site URL to the Vercel production URL initially. Add both the Vercel URL and `https://partners.apexfleetconsulting.com/auth/callback` as redirect URLs.
4. In **Authentication → Email**, keep email enabled. Custom SMTP should use the already verified Apex/Resend sender.

## 2. Vercel environment variables

Add the variables listed in `.env.example` to Production, Preview, and Development. The publishable Supabase key is safe for the browser. Keep `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` secret and enter them directly in Vercel—never in chat or source control.

## 3. Deploy and domain

1. Import `MrsBRB/apex-partner-portal` into Vercel.
2. Deploy the `main` branch.
3. Add `partners.apexfleetconsulting.com` in **Project Settings → Domains**.
4. Add the DNS record Vercel displays at the domain host.
5. After DNS resolves, set `PARTNER_PORTAL_URL=https://partners.apexfleetconsulting.com/portal` and redeploy.

## 4. End-to-end acceptance test

Use `mrsbenkert16@gmail.com` as the partner tester:

1. Submit a partner application and optional file.
2. Confirm the admin notification and notification email arrive.
3. Sign in as an Apex admin and move the application to **Approved**.
4. Confirm the agreement column becomes **Agreement Sent** and the approval/instructions email arrives.
5. Use the partner email magic link; verify no ChatGPT account is requested.
6. Open the agreement; confirm **Agreement Viewed** and its timestamp.
7. Sign it; confirm **Agreement Signed**, signer identity, and timestamp.
8. Submit a referral; confirm the partner sees it, Apex receives both notifications, and the preliminary qualification result is stored.
9. Advance it through routing, pursuit, won, commission pending, approved for payout, payment scheduled, and paid.
10. Confirm the compensation amount and paid date remain visible to the partner.
11. Confirm `/resources/partner-workflow` redirects non-admin users and prints correctly for an admin.
