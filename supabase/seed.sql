-- Seed file for local development
-- Run automatically after migrations via: pnpm supabase db reset

-- Create a deterministic dev user in Supabase Auth.
-- Seed both auth.users and auth.identities so email/password sign-in works locally.
-- The handle_new_user trigger will automatically create the public.users row.
with dev_user as (
  select
    '11111111-1111-1111-1111-111111111111'::uuid as user_id,
    'dev@mindful.test'::text as email,
    'devuser'::text as username
),
inserted_user as (
  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    reauthentication_token,
    reauthentication_sent_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    last_sign_in_at,
    banned_until,
    created_at,
    updated_at
  )
  select
    dev_user.user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    dev_user.email,
    crypt('devpassword123', gen_salt('bf')),
    now(),
    null,
    '',
    now(),
    '',
    null,
    '',
    '',
    null,
    '',
    0,
    null,
    null,
    '',
    '',
    null,
    '',
    null,
    jsonb_build_object('provider', 'email', 'providers', array['email']),
    jsonb_build_object('username', dev_user.username),
    null,
    now(),
    null,
    now(),
    now()
  from dev_user
  where not exists (
    select 1 from auth.users where id = dev_user.user_id or email = dev_user.email
  )
  returning id, email
)
insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  inserted_user.id,
  inserted_user.id,
  jsonb_build_object(
    'sub', inserted_user.id::text,
    'email', inserted_user.email,
    'email_verified', true
  ),
  'email',
  inserted_user.id::text,
  now(),
  now(),
  now()
from inserted_user
where not exists (
  select 1 from auth.identities where user_id = inserted_user.id and provider = 'email'
);
