-- Keep admin access to workspace tokens inside the private storage broker.
-- The function is callable only by the Supabase service role used by the Edge Function.

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

-- Private bucket access is granted with one-file signed upload/download URLs
-- by the workspace-storage Edge Function, not direct anon Storage RLS policies.
drop policy if exists "Browser workspaces can view their own EMM source videos" on storage.objects;
drop policy if exists "Browser workspaces can upload their own EMM source videos" on storage.objects;
drop policy if exists "Browser workspaces can update their own EMM source videos" on storage.objects;
drop policy if exists "Browser workspaces can delete their own EMM source videos" on storage.objects;
