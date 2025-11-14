-- migration: 20251113000002_align_languages_with_prd.sql
-- purpose: align the languages reference table with the PRD static list and ensure language codes
-- follow the validation schema (2-letter lowercase codes).

begin;

-- 1. Ensure the target language rows exist with the desired codes.
insert into app.languages (code, name)
values
  ('en', 'English'),
  ('de', 'German'),
  ('pl', 'Polish'),
  ('ru', 'Russian'),
  ('uk', 'Ukrainian')
on conflict (code) do update
set
  name = excluded.name,
  updated_at = now();

-- 2. Update existing references from legacy codes to the new validated codes.
update app.profiles
set user_language_id = 'en'
where user_language_id = 'english';

update app.profiles
set user_language_id = 'de'
where user_language_id = 'german';

update app.profiles
set user_language_id = 'pl'
where user_language_id = 'polish';

update app.profiles
set user_language_id = 'ru'
where user_language_id = 'russian';

update app.profiles
set user_language_id = 'uk'
where user_language_id = 'ukrainian';

update app.user_learning_languages
set language_id = 'en'
where language_id = 'english';

update app.user_learning_languages
set language_id = 'de'
where language_id = 'german';

update app.user_learning_languages
set language_id = 'pl'
where language_id = 'polish';

update app.user_learning_languages
set language_id = 'ru'
where language_id = 'russian';

update app.user_learning_languages
set language_id = 'uk'
where language_id = 'ukrainian';

-- 3. Remove any legacy codes that violate validation or fall outside the PRD list.
delete from app.languages
where code not in ('en', 'de', 'pl', 'ru', 'uk');

commit;

