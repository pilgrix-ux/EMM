-- Service-role-only visitor lookup used by the private Storage broker.
-- The Edge Function hashes the supplied token via this function and then
-- performs owner-checked Storage operations with the service role.

create or replace function public.resolve_workspace_token(p_token text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $function$
  select visitor.id
  from private.workspace_visitors as visitor
  where p_token is not null
    and length(p_token) = 43
    and p_token ~ '^[A-Za-z0-9_-]{43}$'
    and visitor.token_hash = encode(
      extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'),
      'hex'
    )
    and visitor.expires_at > now()
  limit 1;
$function$;

revoke all on function public.resolve_workspace_token(text) from public, anon, authenticated;
grant execute on function public.resolve_workspace_token(text) to service_role;

-- Storage signed grants are issued by the Edge Function; direct anonymous
-- access to objects in this private bucket is deliberately not granted.
drop policy if exists "Browser workspaces can view their own EMM source videos" on storage.objects;
drop policy if exists "Browser workspaces can upload their own EMM source videos" on storage.objects;
drop policy if exists "Browser workspaces can update their own EMM source videos" on storage.objects;
drop policy if exists "Browser workspaces can delete their own EMM source videos" on storage.objects;
