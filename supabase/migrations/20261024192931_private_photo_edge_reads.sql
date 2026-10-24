-- Hosted verification found cached authenticated Storage responses surviving an
-- RLS change, despite private/no-store response headers. Clients must never warm
-- that CDN path. Read bytes only through the POST Edge handler after fresh RLS.
drop policy if exists wardrobe_storage_read on storage.objects;
