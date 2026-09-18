# Optional: cloud sync (free tier)

The app is fully functional without any account: attempts live in the browser's
local storage. Sync adds a copy in the cloud so a lost phone or cleared browser
never loses history. Cost: 0 (Supabase free tier is far above single-user volume;
no payment method required).

1. Create a free project at supabase.com. Note the project URL
   (`https://xyz.supabase.co`) and the anon public key (Project Settings > API).
2. SQL Editor: paste and run `schema.sql` from this repo.
3. Authentication > Providers: enable Email. Create the user (her email + a
   password) under Authentication > Users, then turn OFF open signups
   (Authentication > Providers > Email > "Allow new users to sign up" off).
4. Give the app the values: either put them in `config.js`
   (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) before deploying, or paste them in the
   app's Settings screen (Settings values win).
5. On the phone/laptop: open the app > Settings > sign in with that email and
   password > "Sync now". The status line should show no pending items.
6. Verify: airplane-mode the phone, take a short attempt, go online, press
   "Sync now", and check the `attempts` table in Supabase shows the row.

Notes

- Push runs automatically (60 s interval, on app load, after each submit);
  pull happens on load and when the tab becomes visible. Failures are silent
  except the pending counter in Settings: offline-first, always.
- Conflicts: last write wins per attempt (single human, single writer).
- Deleting an attempt syncs as a tombstone; both sides converge.
- The anon key is a public key by design: row-level security (the policy in
  `schema.sql`) restricts every row to its owning signed-in user.
