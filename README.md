# Takt Landing Page

## 1) Install and run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 2) Supabase waitlist setup

### Create the table and policy

1. Open your Supabase project.
2. Go to SQL Editor.
3. Run the script in `supabase/waitlist_signups.sql`.

This creates:
- `waitlist_signups` table
- unique email constraint
- RLS enabled
- `anon` insert policy for landing page submissions

### Add environment variables

Copy `.env.example` to `.env.local` and set values from Supabase project settings:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## 3) Vercel env vars

In your Vercel project:
1. Go to `Settings` -> `Environment Variables`
2. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Save and redeploy

## 4) Verify form works

1. Submit the waitlist form on your deployed site.
2. In Supabase Table Editor, open `waitlist_signups`.
3. Confirm row appears.
4. Try submitting the same email again to confirm duplicate handling.
