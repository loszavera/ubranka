import { readFile, readdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export async function makeDatabase() {
  const { PGlite } = await import(process.env.PGLITE_MODULE ? pathToFileURL(process.env.PGLITE_MODULE).href : '@electric-sql/pglite');
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls; create role supabase_auth_admin;
    create schema auth; create schema storage;
    revoke usage on schema public from public;
    grant usage on schema auth,public,storage to anon,authenticated,service_role;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,metadata jsonb default '{}');
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to authenticated;
  `);
  const directory=new URL('../../migrations/',import.meta.url);
  for(const name of (await readdir(directory)).filter(x=>x.endsWith('.sql')).sort())await db.exec(await readFile(new URL(name,directory),'utf8'));
  return db;
}
