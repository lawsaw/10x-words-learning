-- migration: 20251111000001_add_profile_display_name.sql
-- purpose: add optional display_name field to profiles table

-- add display_name column to profiles table
alter table app.profiles
add column if not exists display_name text;

comment on column app.profiles.display_name is 'optional user display name for personalization';


