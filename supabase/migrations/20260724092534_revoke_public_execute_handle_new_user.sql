/*
# Remove PUBLIC execute grant on handle_new_user()

## Problem
The previous fix revoked explicit EXECUTE grants from anon + authenticated on
`handle_new_user()`, but the function still carried a default `=X/postgres`
(PUBLIC) grant. Roles anon and authenticated inherit PUBLIC privileges, so
they could still call the SECURITY DEFINER trigger function directly via
/rest/v1/rpc/handle_new_user.

## Fix
Revoke EXECUTE from PUBLIC on handle_new_user(). Only the function owner
(postgres) and service_role retain EXECUTE. The trigger continues to fire
normally on new sign-ups because trigger execution does not check the firing
role's EXECUTE privilege.

## Notes
- No data is modified.
- Idempotent: re-running is a no-op.
*/

revoke execute on function public.handle_new_user() from public;
