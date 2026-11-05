alter function public.set_ad_projects_updated_at()
  set search_path = pg_catalog, public;

revoke all on function public.set_ad_projects_updated_at()
  from public, anon, authenticated;
