-- Verify the role through the trusted API gateway/PostgREST, without reading
-- Auth users or comparing two different but valid server-key representations.
create function public.wardrobe_worker_authorized()
returns boolean language sql stable security invoker set search_path='' as $$
  select current_user='service_role';
$$;
revoke all on function public.wardrobe_worker_authorized() from public,anon,authenticated;
grant execute on function public.wardrobe_worker_authorized() to service_role;
