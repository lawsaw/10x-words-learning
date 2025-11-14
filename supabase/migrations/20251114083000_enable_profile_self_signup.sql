-- migration: 20251114083000_enable_profile_self_signup.sql
-- purpose: allow authenticated users to insert their own profile rows during sign-up.
-- considerations: relies on existing rls policies; ensures only the owning user can insert.

grant insert on app.profiles to authenticated;

create policy profiles_insert_authenticated
    on app.profiles
    for insert
    to authenticated
    with check (user_id = auth.uid());


