-- Run this in the Supabase SQL editor if you already ran the original schema.sql
-- (adds the tags column used by the "Generate tags" feature)

alter table public.notes add column if not exists tags text[];
