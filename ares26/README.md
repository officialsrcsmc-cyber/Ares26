# ARES’26 website (React + Vite + Supabase)

Registration with email confirmation, payment-proof upload, abstract submission, real admin login, and CSV export.

## 1. Create the Supabase project
1. Sign up at supabase.com and click **New project** (pick a region near Pakistan if offered, set a database password).
2. Open **SQL Editor → New query**, paste the whole of `supabase/schema.sql`, click **Run**. This creates the tables, security rules and two private file buckets.

## 2. Emails (important)
Open **Authentication** in Supabase:
- **Sign In / Providers → Email**: keep **Confirm email** switched ON.
- **URL Configuration**: set **Site URL** to your live address (for example `https://ares26.netlify.app`). Under **Redirect URLs** add that address and `http://localhost:5173`.
- **Emails → SMTP Settings**: turn on **custom SMTP** and enter details from an email service (Resend, Brevo, Mailgun or Gmail app password). Supabase's built-in sender only delivers to your own team members and has very low limits, so real participants will not receive emails without this.
- **Emails → Templates**: edit the “Confirm signup” and “Reset password” wording and add the ARES’26 name.

## 3. Connect the site
1. Copy `.env.example` to `.env`.
2. In Supabase open **Project Settings → API**. Paste **Project URL** and the **anon public** key into `.env`. (Never use the `service_role` key in this project.)
3. `npm install` then `npm run dev`.

## 4. Make yourself admin
1. Register on the site with your own email and click the confirmation link.
2. In the SQL Editor run (with your email):
   `update public.profiles set is_admin = true where email = 'you@example.com';`
3. Open `/#ares-admin` and sign in. Admins can review payments, change status, read abstracts, edit dates/team/FAQs, and download CSVs.

## Managing admins and people
- In the admin panel, **Registrations** tab: **Make admin** / **Remove admin** promotes or demotes a person, and **Remove** permanently deletes a non-admin person (account, payment details, abstracts and uploaded files). You cannot demote or delete yourself, and an admin must be demoted before being removed.
- **Abstracts** tab: **Accept** / **Reject** buttons (plus the full status dropdown). Participants see the result on their dashboard under **Abstract acceptance status**.
- **Existing database?** Run the *ADMIN MANAGEMENT* section at the bottom of `supabase/schema.sql` once in the SQL Editor. Without it, Make admin and Remove will show an error.

## 5. Put it online
Netlify, Vercel or Cloudflare Pages all work: build command `npm run build`, output folder `dist`, and add the two `VITE_` variables in the host's environment settings. Then make sure that final address is in Supabase **Site URL** and **Redirect URLs**.

## How registration works
1. Participant fills in account and academic details and gets a confirmation email.
2. After clicking the link and logging in, the dashboard asks for transaction details and the payment proof (stored privately; only the participant and admins can open it).
3. Admin checks the proof and sets Approved or Rejected. A rejected participant can upload a new proof.

## Optional: status emails (proof received, approved, rejected)
Uses Resend (resend.com). Install the Supabase CLI, then:
1. `supabase functions deploy status-email`
2. `supabase secrets set RESEND_API_KEY=... MAIL_FROM="ARES’26 <noreply@yourdomain.com>"` (the domain must be verified in Resend).
3. In Supabase **Database → Webhooks**, create a webhook on table `profiles`, event **Update**, type **Supabase Edge Functions**, function `status-email`.

## Notes
- Edit the bank details text (`BANK`) in `src/shared.js`.
- Passwords are handled by Supabase Auth; the site never stores them.
- Free-tier projects pause after a week of no activity. Open the dashboard occasionally, or upgrade before the event.
