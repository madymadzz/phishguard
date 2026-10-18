-- ==============================================================================
-- PHISHGUARD: 0001_init.sql
-- Comprehensive Database Schema with Row-Level Security and Initial Seeds
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 1. PROFILES TABLE
-- ==============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Function: Check if current user is active admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
end;
$$ language plpgsql security definer stable;

-- Trigger to prevent regular users from elevating role or status
create or replace function public.protect_profile_fields()
returns trigger as $$
begin
  if auth.role() = 'authenticated' and not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Unauthorized to change account role.';
    end if;
    if new.status is distinct from old.status then
      raise exception 'Unauthorized to change account status.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_protect_profile_fields on public.profiles;
create trigger tr_protect_profile_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- Auto-create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    'user',
    'active'
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profiles RLS Policies
create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id or public.is_admin());

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- ==============================================================================
-- 2. SCANS TABLE
-- ==============================================================================
create table if not exists public.scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  source text not null check (source in ('url', 'qr')),
  input_value text not null,
  final_url text,
  hostname text,
  registrable_domain text,
  risk_level text not null check (risk_level in ('safe', 'suspicious', 'dangerous')),
  risk_score int not null check (risk_score between 0 and 100),
  reasons jsonb not null default '[]'::jsonb,
  signals jsonb not null default '{}'::jsonb,
  redirect_chain jsonb not null default '[]'::jsonb,
  ai_explanation jsonb not null default '{}'::jsonb,
  engine_version text not null default '1.0.0',
  created_at timestamptz not null default now()
);

create index if not exists idx_scans_user_created on public.scans(user_id, created_at desc);
create index if not exists idx_scans_risk_level on public.scans(risk_level);
create index if not exists idx_scans_registrable_domain on public.scans(registrable_domain);

alter table public.scans enable row level security;

-- Scans RLS Policies
create policy "Users can view own scans"
  on public.scans for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

create policy "Users can create own scans"
  on public.scans for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own scans"
  on public.scans for delete
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- ==============================================================================
-- 3. SCAN CACHE TABLE (Server only)
-- ==============================================================================
create table if not exists public.scan_cache (
  url_hash text primary key,
  result jsonb not null,
  expires_at timestamptz not null
);

create index if not exists idx_scan_cache_expires on public.scan_cache(expires_at);

alter table public.scan_cache enable row level security;
-- No client policies: accessible strictly via service_role key

-- ==============================================================================
-- 4. DOMAIN RULES TABLE (Admin block/allow list)
-- ==============================================================================
create table if not exists public.domain_rules (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  rule_type text not null check (rule_type in ('block', 'allow')),
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint uq_domain_rule unique (domain, rule_type)
);

create index if not exists idx_domain_rules_domain on public.domain_rules(domain);

alter table public.domain_rules enable row level security;

create policy "Admins can manage domain rules"
  on public.domain_rules for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ==============================================================================
-- 5. REPORTS TABLE (User false-positive / false-negative reports)
-- ==============================================================================
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid references public.scans(id) on delete set null,
  user_id uuid references public.profiles(id) on delete cascade,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewed', 'resolved')),
  admin_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_reports_status on public.reports(status);

alter table public.reports enable row level security;

create policy "Users can insert own reports"
  on public.reports for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can view own reports"
  on public.reports for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

create policy "Admins can update reports"
  on public.reports for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ==============================================================================
-- 6. LEARN ARTICLES TABLE
-- ==============================================================================
create table if not exists public.learn_articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text not null,
  body_md text not null,
  category text not null,
  read_minutes int not null default 3,
  published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_learn_published_order on public.learn_articles(published, sort_order);

alter table public.learn_articles enable row level security;

create policy "Authenticated users can read published articles"
  on public.learn_articles for select
  to authenticated
  using (published = true or public.is_admin());

create policy "Admins have full access to learn articles"
  on public.learn_articles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ==============================================================================
-- 7. APP SETTINGS TABLE
-- ==============================================================================
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

create policy "Authenticated users can read app settings"
  on public.app_settings for select
  to authenticated
  using (true);

create policy "Admins can update app settings"
  on public.app_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ==============================================================================
-- 8. AUDIT LOG TABLE (Append-only)
-- ==============================================================================
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_log_created on public.audit_log(created_at desc);

alter table public.audit_log enable row level security;

create policy "Admins can view audit logs"
  on public.audit_log for select
  to authenticated
  using (public.is_admin());

create policy "Admins and service can insert audit logs"
  on public.audit_log for insert
  to authenticated
  with check (public.is_admin());

-- ==============================================================================
-- 9. INITIAL SEEDS
-- ==============================================================================

-- Seed App Settings
insert into public.app_settings (key, value)
values
  ('registration_open', 'true'::jsonb),
  ('maintenance_mode', 'false'::jsonb),
  ('ai_explanations_enabled', 'true'::jsonb),
  ('safe_browsing_enabled', 'true'::jsonb),
  ('urlhaus_enabled', 'true'::jsonb),
  ('virustotal_enabled', 'false'::jsonb),
  ('disclaimer_text', '"PhishGuard gives a risk indication and does not guarantee 100% detection."'::jsonb)
on conflict (key) do nothing;

-- Seed Learn Articles
insert into public.learn_articles (slug, title, summary, body_md, category, read_minutes, published, sort_order)
values
  (
    'what-is-phishing',
    'What is Phishing?',
    'Phishing is a deceptive technique where attackers impersonate trustworthy entities to steal sensitive information.',
    '## Understanding Phishing

Phishing is one of the oldest and most dangerous cyber threats on the internet. Attackers use deceptive emails, text messages, fraudulent websites, and QR codes designed to look identical to legitimate organizations.

### How It Works
1. **The Bait:** You receive an urgent message, email, or scanned QR code claiming your account has been locked, you won''t receive a parcel, or you won a prize.
2. **The Hook:** The message contains a link to a counterfeit website that looks just like your bank, university, or social media platform.
3. **The Theft:** When you enter your username, password, or OTP (One-Time Password), the attackers immediately capture and use them to hijack your real account.

### Why PhishGuard Matters
PhishGuard analyzes URLs before you open them, inspecting certificates, domain age, typosquatting, redirect hops, and global threat databases to warn you before credentials are compromised.',
    'Basics',
    3,
    true,
    1
  ),
  (
    'spot-a-fake-link',
    'How to Spot a Fake Link',
    'Learn how to inspect domain names, catch deceptive typos, and identify missing security certificates.',
    '## Deconstruct Every Link Before Tapping

Cybercriminals often disguise fake websites using subtle spelling tricks and unusual domains.

### 1. Check the Registrable Domain
Look at the text immediately preceding the `.com`, `.org`, or `.ph`.
- Real: `gcash.com` or `bdo.com.ph`
- Fake: `gcash-verify.com.xyz` or `bdo-online-security.top`

### 2. Watch for Typosquatting
Attackers replace characters with visually similar ones:
- `paypa1.com` instead of `paypal.com`
- `micros0ft.com` instead of `microsoft.com`

### 3. Missing HTTPS
Never enter credentials or personal data into an `http://` website. Modern legitimate services always use secure `https://` encryption.',
    'Detection',
    4,
    true,
    2
  ),
  (
    'qr-code-scams',
    'QR Code Scams (Quishing)',
    'Attackers plaster malicious QR codes in public places to bypass traditional link filters.',
    '## What is "Quishing"?

"Quishing" is phishing conducted via Quick Response (QR) codes. Because human eyes cannot read the destination embedded inside a QR code pattern, attackers exploit this blind trust.

### Common Tactics
- **Sticker Overlays:** Placing a fraudulent QR sticker over legitimate payment codes at store counters or parking meters.
- **Urgent Letters/Notices:** Fake notices claiming an urgent package delivery or utility bill penalty with a QR code to resolve it.

### Best Practices
- Never scan random QR codes found on lamp posts or received via unsolicited physical mail.
- Always use **PhishGuard''s QR Scanner** to inspect where the code directs you before tapping to open it.',
    'Mobile Security',
    3,
    true,
    3
  ),
  (
    'smishing-and-social-media',
    'Smishing & Social Media Scams',
    'Urgent SMS alerts impersonating GCash, Maya, Shopee, and delivery couriers targeting Filipino users.',
    '## Smishing in the Philippines

Smishing (SMS phishing) frequently impersonates widely used financial and courier services across the Philippines.

### Typical Lures
- **GCash / Maya:** "Your account has been restricted due to inactivity. Verify at `gcash-support-portal.info` within 24 hours."
- **Parcel Delivery (LBC, J&T):** "Your package cannot be delivered due to incorrect address. Confirm your delivery address now."
- **Job Offers:** Telegram/WhatsApp messages offering high daily income for liking products online.

### Crucial Defense Rule
Legitimate banks and e-wallets will **never** send clickable links in SMS asking for your MPIN or OTP.',
    'Threats',
    4,
    true,
    4
  ),
  (
    'what-to-do-if-you-clicked',
    'What to Do If You Clicked a Suspicious Link',
    'A quick emergency response guide if you suspect you visited a malicious website or submitted credentials.',
    '## Immediate Action Plan

If you realized you opened a suspicious link or entered information, act quickly:

1. **Change Passwords Immediately:** From a safe device, change the password for the affected service and any other accounts sharing the same password.
2. **Revoke Active Sessions:** Go to security settings and log out of all active sessions/devices.
3. **Contact Your Bank/E-Wallet:** If financial details were submitted, freeze your card or contact customer support immediately.
4. **Report the Link:** Submit the URL to PhishGuard''s report tool to help protect other community members.',
    'Incident Response',
    4,
    true,
    5
  ),
  (
    'staying-safe-online',
    'Staying Safe Online: Everyday Best Practices',
    'Simple security habits that prevent over 95% of common online attacks and account takeovers.',
    '## Everyday Cyber Hygiene

Staying secure online does not require advanced technical knowledge—just consistent habits.

### Top 4 Habits
1. **Enable Two-Factor Authentication (2FA):** Always use authenticator apps (like Google Authenticator) instead of SMS OTPs whenever possible.
2. **Use a Password Manager:** Generate unique, complex passwords for every single platform.
3. **Verify Before Trusting:** When receiving an unexpected message from a friend asking for money, call them directly on phone or in person to verify.
4. **Keep Software Updated:** Regularly install security updates for your phone''s operating system and web browser.',
    'Best Practices',
    3,
    true,
    6
  )
on conflict (slug) do nothing;
