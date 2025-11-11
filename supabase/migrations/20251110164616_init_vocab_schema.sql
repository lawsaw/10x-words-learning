-- migration: 20251110164616_init_vocab_schema.sql
-- purpose: establish the app schema for vocabulary management including languages, profiles, learning languages, categories, words, supporting triggers, security policies, and rpc helpers.
-- considerations: relies on supabase auth.users, auth.uid(), and pgcrypto. sets search_path defaults for supabase roles, enables rls on mutable tables, and grants minimal privileges. destructive operations are not performed.

-- ensure the required schema and extension exist before creating dependent objects.
create schema if not exists app;

comment on schema app is 'primary application schema containing vocabulary management tables and support objects';

create extension if not exists pgcrypto with schema public;

-- configure supabase roles to prioritize the app schema when resolving unqualified object names.
alter role anon set search_path = app, public;
alter role authenticated set search_path = app, public;
alter role service_role set search_path = app, public;

-- shared trigger function to maintain updated_at columns.
create or replace function app.tg_set_timestamp()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

comment on function app.tg_set_timestamp() is 'keeps updated_at in sync with the current timestamp on row updates';

-- trigger to keep profile.user_language_id immutable after insert.
create or replace function app.tg_prevent_profile_language_update()
returns trigger
language plpgsql
as $$
begin
    if tg_op = 'update' and new.user_language_id is distinct from old.user_language_id then
        raise exception using
            message = 'user_language_id is immutable once set',
            detail = 'attempted to change user_language_id from ' || old.user_language_id || ' to ' || new.user_language_id,
            hint = 'create a new profile if the preferred language must change';
    end if;

    return new;
end;
$$;

comment on function app.tg_prevent_profile_language_update() is 'guards the preferred language on profiles from being altered after creation';

-- trigger to ensure learning language rows align with profile ownership and exclude the immutable profile language.
create or replace function app.tg_guard_learning_language()
returns trigger
language plpgsql
as $$
declare
    v_profile_language text;
begin
    select p.user_language_id
      into v_profile_language
      from app.profiles p
     where p.user_id = new.user_id;

    if v_profile_language is null then
        raise exception using
            message = 'profile does not exist for supplied user_id',
            hint = 'ensure the supabase auth signup hook builds the profile before inserting learning languages';
    end if;

    if new.language_id is not distinct from v_profile_language then
        raise exception using
            message = 'learning language cannot match immutable profile language',
            hint = 'omit the preferred interface language from the study list';
    end if;

    if tg_op = 'update' and new.user_id is distinct from old.user_id then
        raise exception using
            message = 'user_id may not change after creation',
            detail = 'attempted to move learning language to a different owner',
            hint = 'delete and recreate the learning language for a different user';
    end if;

    return new;
end;
$$;

comment on function app.tg_guard_learning_language() is 'validates learning language ownership and prevents duplicating the immutable profile language';

-- trigger to synchronize category ownership with the parent learning language and enforce integrity.
create or replace function app.tg_set_category_owner()
returns trigger
language plpgsql
as $$
declare
    v_parent_user_id uuid;
begin
    select ull.user_id
      into v_parent_user_id
      from app.user_learning_languages ull
     where ull.id = new.user_learning_language_id;

    if v_parent_user_id is null then
        raise exception using
            message = 'user_learning_language_id does not reference an existing parent row',
            hint = 'create the learning language before categories';
    end if;

    new.user_id := v_parent_user_id;

    if tg_op = 'update' and old.user_learning_language_id is distinct from new.user_learning_language_id then
        raise exception using
            message = 'user_learning_language_id cannot change once the category exists',
            hint = 'categories are scoped to a single learning language';
    end if;

    return new;
end;
$$;

comment on function app.tg_set_category_owner() is 'forces categories to inherit ownership metadata from user_learning_languages and prevents cross-language moves';

-- trigger to synchronize word ownership metadata with the associated category.
create or replace function app.tg_set_word_owner()
returns trigger
language plpgsql
as $$
declare
    v_category_user_id uuid;
    v_category_learning_language_id uuid;
begin
    select c.user_id, c.user_learning_language_id
      into v_category_user_id, v_category_learning_language_id
      from app.categories c
     where c.id = new.category_id;

    if v_category_user_id is null then
        raise exception using
            message = 'category_id does not reference an existing category',
            hint = 'create a category before inserting words';
    end if;

    new.user_id := v_category_user_id;
    new.user_learning_language_id := v_category_learning_language_id;

    if tg_op = 'update' and old.category_id is distinct from new.category_id then
        raise exception using
            message = 'category_id cannot change after creation',
            hint = 'words are tied to a specific category';
    end if;

    return new;
end;
$$;

comment on function app.tg_set_word_owner() is 'ensures words stay aligned with their category ownership and learning language scope';

-- base reference table containing application languages.
create table if not exists app.languages (
    code text primary key,
    name text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table app.languages is 'supported interface and study languages';

create trigger languages_set_timestamp
before update on app.languages
for each row
execute function app.tg_set_timestamp();

-- user profile table keyed by supabase auth user_id.
create table if not exists app.profiles (
    user_id uuid primary key references auth.users(id) on delete cascade,
    user_language_id text not null references app.languages(code),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table app.profiles is 'per-user metadata extending supabase auth with immutable preferred language';

create trigger profiles_set_timestamp
before update on app.profiles
for each row
execute function app.tg_set_timestamp();

create trigger profiles_prevent_language_update
before update on app.profiles
for each row
execute function app.tg_prevent_profile_language_update();

-- learning languages that a user is actively studying.
create table if not exists app.user_learning_languages (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references app.profiles(user_id) on delete cascade,
    language_id text not null references app.languages(code),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint unique_user_language unique (user_id, language_id)
);

comment on table app.user_learning_languages is 'joins users to the languages they study beyond their primary interface language';

create trigger user_learning_languages_set_timestamp
before update on app.user_learning_languages
for each row
execute function app.tg_set_timestamp();

create trigger user_learning_languages_guard
before insert or update on app.user_learning_languages
for each row
execute function app.tg_guard_learning_language();

-- vocabulary categories scoped to a learning language.
create table if not exists app.categories (
    id uuid primary key default gen_random_uuid(),
    user_learning_language_id uuid not null references app.user_learning_languages(id) on delete cascade,
    user_id uuid not null references app.profiles(user_id) on delete cascade,
    name text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint unique_category_name unique (user_learning_language_id, name)
);

comment on table app.categories is 'user-defined vocabulary groups partitioned by learning language';

create trigger categories_set_timestamp
before update on app.categories
for each row
execute function app.tg_set_timestamp();

create trigger categories_set_owner
before insert or update on app.categories
for each row
execute function app.tg_set_category_owner();

-- individual vocabulary words with translations and examples.
create table if not exists app.words (
    id uuid primary key default gen_random_uuid(),
    user_learning_language_id uuid not null references app.user_learning_languages(id) on delete cascade,
    user_id uuid not null references app.profiles(user_id) on delete cascade,
    category_id uuid not null references app.categories(id) on delete cascade,
    term text not null,
    translation text not null,
    examples_md text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint unique_word_per_category unique (category_id, term)
);

comment on table app.words is 'vocabulary entries tied to categories with learner translations and markdown examples';

create trigger words_set_timestamp
before update on app.words
for each row
execute function app.tg_set_timestamp();

create trigger words_set_owner
before insert or update on app.words
for each row
execute function app.tg_set_word_owner();

-- indexes supporting dashboard and study queries.
create index if not exists user_learning_languages_user_created_idx on app.user_learning_languages (user_id, created_at desc);
create index if not exists categories_lookup_idx on app.categories (user_learning_language_id, created_at desc);
create index if not exists words_recent_idx on app.words (user_learning_language_id, created_at desc);
create index if not exists words_category_idx on app.words (category_id, created_at desc);

-- seed baseline languages; updates are idempotent to simplify future migrations.
insert into app.languages (code, name)
values
    ('english', 'English'),
    ('german', 'German'),
    ('polish', 'Polish'),
    ('spanish', 'Spanish')
on conflict (code) do update
set name = excluded.name,
    updated_at = now();

-- ensure the authenticated api key can access schema objects needed at runtime.
grant usage on schema app to authenticated, anon;

grant select on app.languages to authenticated, anon;
grant select, update on app.profiles to authenticated;
grant select, insert, update, delete on app.user_learning_languages to authenticated;
grant select, insert, update, delete on app.categories to authenticated;
grant select, insert, update, delete on app.words to authenticated;

-- rls configuration: public reference data remains open while user-specific tables enforce strict ownership checks.
alter table app.languages disable row level security;

alter table app.profiles enable row level security;
alter table app.user_learning_languages enable row level security;
alter table app.categories enable row level security;
alter table app.words enable row level security;

-- app.profiles policies (no anon access; inserts handled by service_role only).
create policy profiles_select_authenticated
    on app.profiles
    for select
    to authenticated
    using (user_id = auth.uid());

create policy profiles_update_authenticated
    on app.profiles
    for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

-- app.user_learning_languages policies granting authenticated users full crud within their scope.
create policy ull_select_authenticated
    on app.user_learning_languages
    for select
    to authenticated
    using (user_id = auth.uid());

create policy ull_insert_authenticated
    on app.user_learning_languages
    for insert
    to authenticated
    with check (user_id = auth.uid());

create policy ull_update_authenticated
    on app.user_learning_languages
    for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

create policy ull_delete_authenticated
    on app.user_learning_languages
    for delete
    to authenticated
    using (user_id = auth.uid());

-- app.categories policies scoped to authenticated owners.
create policy categories_select_authenticated
    on app.categories
    for select
    to authenticated
    using (user_id = auth.uid());

create policy categories_insert_authenticated
    on app.categories
    for insert
    to authenticated
    with check (user_id = auth.uid());

create policy categories_update_authenticated
    on app.categories
    for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

create policy categories_delete_authenticated
    on app.categories
    for delete
    to authenticated
    using (user_id = auth.uid());

-- app.words policies scoped to authenticated owners.
create policy words_select_authenticated
    on app.words
    for select
    to authenticated
    using (user_id = auth.uid());

create policy words_insert_authenticated
    on app.words
    for insert
    to authenticated
    with check (user_id = auth.uid());

create policy words_update_authenticated
    on app.words
    for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

create policy words_delete_authenticated
    on app.words
    for delete
    to authenticated
    using (user_id = auth.uid());

-- security-barrier view consolidating vocabulary data for readonly queries.
create or replace view app.vocabulary_overview
with (security_barrier = true)
as
select
    w.id as word_id,
    w.term,
    w.translation,
    w.examples_md,
    w.category_id,
    c.name as category_name,
    w.user_learning_language_id,
    ull.language_id,
    lang.name as language_name,
    w.user_id,
    w.created_at as word_created_at,
    w.updated_at as word_updated_at,
    c.created_at as category_created_at
from app.words w
join app.categories c on c.id = w.category_id
join app.user_learning_languages ull on ull.id = w.user_learning_language_id
join app.languages lang on lang.code = ull.language_id;

comment on view app.vocabulary_overview is 'read-only vocabulary projection joining words, categories, and languages; relies on underlying rls policies';

-- rpc helper enforcing auth.uid filters on the vocabulary overview.
create or replace function app.rpc_vocabulary_overview(
    p_user_learning_language_id uuid default null,
    p_category_id uuid default null
)
returns setof app.vocabulary_overview
language plpgsql
security definer
set search_path = app, public
as $$
begin
    return query
    select v.*
      from app.vocabulary_overview v
     where v.user_id = auth.uid()
       and (p_user_learning_language_id is null or v.user_learning_language_id = p_user_learning_language_id)
       and (p_category_id is null or v.category_id = p_category_id)
     order by v.word_created_at desc;
end;
$$;

comment on function app.rpc_vocabulary_overview(uuid, uuid) is 'select wrapper returning the caller''s vocabulary with optional language and category filters';

grant execute on function app.rpc_vocabulary_overview(uuid, uuid) to authenticated;

-- ensure anon clients cannot call rpc directly; omit grant to maintain locked-down surface.





