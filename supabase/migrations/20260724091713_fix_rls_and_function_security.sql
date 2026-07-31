/*
# Fix RLS bypass, public storage listing, and SECURITY DEFINER exposure

## Problems fixed
1. contact_messages INSERT policy `msg_insert_all` used `WITH CHECK (true)` —
   allowed unrestricted inserts by anyone. Replaced with a check that the
   required fields (name, email, message) are non-empty so only well-formed
   contact submissions are accepted.
2. reservations INSERT policy `res_insert_all` used `WITH CHECK (true)` —
   allowed unrestricted inserts by anyone. Replaced with a check that the
   required booking fields (name, email, party_size, date, time) are present
   and valid so only well-formed reservations are accepted.
3. Public bucket `guest-memories` had a broad SELECT policy on storage.objects
   that let anyone LIST every file in the bucket. Public buckets serve object
   URLs without any RLS policy, so the listing policy is unnecessary and was
   removed. getPublicUrl() and direct public-URL access continue to work.
4. `is_staff()` and `is_admin()` were SECURITY DEFINER and executable by
   anon + authenticated via /rest/v1/rpc. They only read auth.jwt() (no table
   access), so they were switched to SECURITY INVOKER — RLS policies that call
   them continue to work, but they can no longer be invoked as a privileged
   function via RPC.
5. `handle_new_user()` is a trigger function that must stay SECURITY DEFINER
   (it writes to auth.users), but EXECUTE was revoked from anon + authenticated
   so it can no longer be called directly via /rest/v1/rpc. The trigger still
   fires because trigger execution does not check the caller's EXECUTE privilege.

## Notes
- All policy changes are idempotent (drop + recreate).
- No data is modified or deleted.
- The reservation and contact forms continue to work for anonymous visitors
  because the INSERT policies still target `TO anon, authenticated` — they now
  simply validate that the submission has the required fields.
*/

-- ---------------------------------------------------------------------------
-- 1. contact_messages: replace unrestricted INSERT with field-validated INSERT
-- ---------------------------------------------------------------------------
drop policy if exists "msg_insert_all" on public.contact_messages;
create policy "msg_insert_all" on public.contact_messages
  for insert to anon, authenticated
  with check (
    coalesce(length(btrim(name))::int, 0) > 0
    and coalesce(length(btrim(email))::int, 0) > 0
    and coalesce(length(btrim(message))::int, 0) > 0
  );

-- ---------------------------------------------------------------------------
-- 2. reservations: replace unrestricted INSERT with field-validated INSERT
-- ---------------------------------------------------------------------------
drop policy if exists "res_insert_all" on public.reservations;
create policy "res_insert_all" on public.reservations
  for insert to anon, authenticated
  with check (
    coalesce(length(btrim(name))::int, 0) > 0
    and coalesce(length(btrim(email))::int, 0) > 0
    and party_size > 0
    and reservation_date is not null
    and coalesce(length(btrim(reservation_time))::int, 0) > 0
  );

-- ---------------------------------------------------------------------------
-- 3. storage.objects: remove broad SELECT that allowed listing guest-memories
-- ---------------------------------------------------------------------------
drop policy if exists "public_read_guest_memories" on storage.objects;

-- ---------------------------------------------------------------------------
-- 4. is_staff() / is_admin(): switch from SECURITY DEFINER to SECURITY INVOKER
--    (these only read auth.jwt(); no table access, so INVOKER is safe and
--     removes the privileged-RPC attack surface)
-- ---------------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean
language sql stable security invoker
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'manager', 'staff'),
    false
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security invoker
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- 5. handle_new_user(): keep SECURITY DEFINER (writes to auth.users) but
--    revoke direct EXECUTE from anon + authenticated so it cannot be called
--    via /rest/v1/rpc. The trigger still works — trigger execution does not
--    check the firing role's EXECUTE privilege.
-- ---------------------------------------------------------------------------
revoke execute on function public.handle_new_user() from anon, authenticated;
