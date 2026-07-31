/*
# Lumière Restaurant — Core Schema, RLS & Auto-Admin

## Purpose
Builds the complete database foundation for a fine-dining restaurant website with:
- Public content the whole site runs on (settings, menu, events, gallery, testimonials)
- Guest-facing flows (reservations, contact messages)
- An organization/team system where the first admin is auto-detected at sign-up
  and can invite teammates and assign roles (admin / manager / staff)
- Inline admin editing: no separate admin panel. Admin powers are derived from the
  logged-in user's role, so Edit/Add buttons appear only for privileged users.

## Tables created
1. profiles — one row per auth account (display info)
2. team_members — organization roster (email + role + invite status). The master list
   of who is allowed to hold an elevated role. An auto trigger links a new auth user
   to a matching team_member by email, and grants the role via app_metadata.
3. restaurant_settings — single master row controlling the site's identity, hours,
   contact details, hero image, social links.
4. menu_categories — Appetizers / Mains / Desserts / Drinks, etc. (sort order)
5. menu_items — each dish (price, photo, dietary tags, featured, availability)
6. events — special nights (wine dinners, live music) with date & capacity
7. gallery — photo collection grouped by theme (interior / food / events)
8. testimonials — guest reviews with star rating
9. reservations — table bookings with status workflow
10. contact_messages — messages submitted via the contact form

## Security (RLS)
- Public content (settings, menu, categories, events, gallery, testimonials):
  SELECT is open to anon + authenticated (the public website must render for
  visitors who never log in). All writes are restricted to staff+ (role check
  via a helper function).
- reservations: anyone (anon) can INSERT a new booking; guests can SELECT their
  own bookings by email; staff+ can SELECT/UPDATE all.
- contact_messages: anyone (anon) can INSERT; only staff+ can SELECT/UPDATE.
- profiles: each authenticated user sees/edits their own row; staff+ can view all.
- team_members: staff+ can SELECT; only admin can INSERT/UPDATE/DELETE.
- Role checks use a SECURITY DEFINER helper `is_staff()` that reads the user's
  app_metadata.role so the check cannot be spoofed from the client.

## Important notes
1. A trigger `handle_new_user` runs AFTER INSERT on auth.users. It:
   a) creates a profiles row for every new sign-up;
   b) looks up team_members by the new user's email; if a row exists and is
      'active', it writes role = that role into raw_app_meta_data (e.g. 'admin').
      If no team row exists, role stays 'guest'.
   c) This is how the chosen admin email becomes admin automatically on sign-up.
2. The first admin is seeded into team_members with email 'admin@lumiere.com'
   and role 'admin' so the very first sign-up with that email gets admin powers.
3. owner columns default to auth.uid() so inserts from the client work without
   threading the user id explicitly.
4. All policies are dropped before (re)creation so this migration is idempotent.
*/

-- ---------------------------------------------------------------------------
-- Role helper (SECURITY DEFINER) — reads app_metadata.role safely
-- ---------------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'manager', 'staff'),
    false
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_staff" on public.profiles;
create policy "profiles_select_own_or_staff" on public.profiles
  for select to authenticated
  using (auth.uid() = id or public.is_staff());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- team_members
-- ---------------------------------------------------------------------------
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null default 'staff' check (role in ('admin','manager','staff')),
  status text not null default 'invited' check (status in ('invited','active','revoked')),
  user_id uuid references auth.users(id) on delete set null,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.team_members enable row level security;

-- staff+ can see the roster (so managers/staff see who's on the team)
drop policy if exists "team_select_staff" on public.team_members;
create policy "team_select_staff" on public.team_members
  for select to authenticated
  using (public.is_staff());

-- only admin can modify the team
drop policy if exists "team_insert_admin" on public.team_members;
create policy "team_insert_admin" on public.team_members
  for insert to authenticated
  with check (public.is_admin());

drop policy if exists "team_update_admin" on public.team_members;
create policy "team_update_admin" on public.team_members
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "team_delete_admin" on public.team_members;
create policy "team_delete_admin" on public.team_members
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- restaurant_settings (single master row)
-- ---------------------------------------------------------------------------
create table if not exists public.restaurant_settings (
  id int primary key default 1,
  name text not null default 'Lumière',
  tagline text not null default 'An Evening of French Elegance',
  story text,
  phone text,
  email text,
  address text,
  map_url text,
  hero_image text,
  social_instagram text,
  social_facebook text,
  hours jsonb not null default '{
    "mon":{"open":"17:00","close":"22:00","closed":false},
    "tue":{"open":"17:00","close":"22:00","closed":false},
    "wed":{"open":"17:00","close":"22:00","closed":false},
    "thu":{"open":"17:00","close":"22:00","closed":false},
    "fri":{"open":"17:00","close":"23:00","closed":false},
    "sat":{"open":"16:00","close":"23:00","closed":false},
    "sun":{"open":"16:00","close":"21:00","closed":false}
  }'::jsonb,
  check (id = 1)
);

alter table public.restaurant_settings enable row level security;

drop policy if exists "settings_select_all" on public.restaurant_settings;
create policy "settings_select_all" on public.restaurant_settings
  for select to anon, authenticated using (true);

drop policy if exists "settings_update_staff" on public.restaurant_settings;
create policy "settings_update_staff" on public.restaurant_settings
  for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "settings_insert_staff" on public.restaurant_settings;
create policy "settings_insert_staff" on public.restaurant_settings
  for insert to authenticated
  with check (public.is_staff());

-- ---------------------------------------------------------------------------
-- menu_categories
-- ---------------------------------------------------------------------------
create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.menu_categories enable row level security;

drop policy if exists "cat_select_all" on public.menu_categories;
create policy "cat_select_all" on public.menu_categories
  for select to anon, authenticated using (true);

drop policy if exists "cat_insert_staff" on public.menu_categories;
create policy "cat_insert_staff" on public.menu_categories
  for insert to authenticated with check (public.is_staff());

drop policy if exists "cat_update_staff" on public.menu_categories;
create policy "cat_update_staff" on public.menu_categories
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "cat_delete_staff" on public.menu_categories;
create policy "cat_delete_staff" on public.menu_categories
  for delete to authenticated using (public.is_staff());

-- ---------------------------------------------------------------------------
-- menu_items
-- ---------------------------------------------------------------------------
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.menu_categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  image_url text,
  available boolean not null default true,
  featured boolean not null default false,
  dietary_tags text[] not null default '{}',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.menu_items enable row level security;

drop policy if exists "item_select_all" on public.menu_items;
create policy "item_select_all" on public.menu_items
  for select to anon, authenticated using (true);

drop policy if exists "item_insert_staff" on public.menu_items;
create policy "item_insert_staff" on public.menu_items
  for insert to authenticated with check (public.is_staff());

drop policy if exists "item_update_staff" on public.menu_items;
create policy "item_update_staff" on public.menu_items
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "item_delete_staff" on public.menu_items;
create policy "item_delete_staff" on public.menu_items
  for delete to authenticated using (public.is_staff());

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_date date not null,
  image_url text,
  price_per_person numeric(10,2),
  capacity int,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

drop policy if exists "event_select_all" on public.events;
create policy "event_select_all" on public.events
  for select to anon, authenticated using (true);

drop policy if exists "event_insert_staff" on public.events;
create policy "event_insert_staff" on public.events
  for insert to authenticated with check (public.is_staff());

drop policy if exists "event_update_staff" on public.events;
create policy "event_update_staff" on public.events
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "event_delete_staff" on public.events;
create policy "event_delete_staff" on public.events
  for delete to authenticated using (public.is_staff());

-- ---------------------------------------------------------------------------
-- gallery
-- ---------------------------------------------------------------------------
create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text,
  category text not null default 'interior' check (category in ('interior','food','events')),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.gallery enable row level security;

drop policy if exists "gallery_select_all" on public.gallery;
create policy "gallery_select_all" on public.gallery
  for select to anon, authenticated using (true);

drop policy if exists "gallery_insert_staff" on public.gallery;
create policy "gallery_insert_staff" on public.gallery
  for insert to authenticated with check (public.is_staff());

drop policy if exists "gallery_update_staff" on public.gallery;
create policy "gallery_update_staff" on public.gallery
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "gallery_delete_staff" on public.gallery;
create policy "gallery_delete_staff" on public.gallery
  for delete to authenticated using (public.is_staff());

-- ---------------------------------------------------------------------------
-- testimonials
-- ---------------------------------------------------------------------------
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  title text,
  rating int not null default 5 check (rating between 1 and 5),
  quote text not null,
  avatar_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;

drop policy if exists "test_select_all" on public.testimonials;
create policy "test_select_all" on public.testimonials
  for select to anon, authenticated using (true);

drop policy if exists "test_insert_staff" on public.testimonials;
create policy "test_insert_staff" on public.testimonials
  for insert to authenticated with check (public.is_staff());

drop policy if exists "test_update_staff" on public.testimonials;
create policy "test_update_staff" on public.testimonials
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "test_delete_staff" on public.testimonials;
create policy "test_delete_staff" on public.testimonials
  for delete to authenticated using (public.is_staff());

-- ---------------------------------------------------------------------------
-- reservations
-- ---------------------------------------------------------------------------
create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  party_size int not null default 2,
  reservation_date date not null,
  reservation_time text not null,
  special_requests text,
  status text not null default 'pending' check (status in ('pending','confirmed','cancelled','seated','completed')),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.reservations enable row level security;

-- anyone can book a table (incl. logged-out visitors)
drop policy if exists "res_insert_all" on public.reservations;
create policy "res_insert_all" on public.reservations
  for insert to anon, authenticated with check (true);

-- guests see their own bookings by matching email; staff see all
drop policy if exists "res_select_own_or_staff" on public.reservations;
create policy "res_select_own_or_staff" on public.reservations
  for select to authenticated
  using (auth.uid() = user_id or lower(email) = lower((select email from auth.users where id = auth.uid())) or public.is_staff());

-- only staff can change booking status
drop policy if exists "res_update_staff" on public.reservations;
create policy "res_update_staff" on public.reservations
  for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

drop policy if exists "res_delete_staff" on public.reservations;
create policy "res_delete_staff" on public.reservations
  for delete to authenticated using (public.is_staff());

-- ---------------------------------------------------------------------------
-- contact_messages
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists "msg_insert_all" on public.contact_messages;
create policy "msg_insert_all" on public.contact_messages
  for insert to anon, authenticated with check (true);

drop policy if exists "msg_select_staff" on public.contact_messages;
create policy "msg_select_staff" on public.contact_messages
  for select to authenticated using (public.is_staff());

drop policy if exists "msg_update_staff" on public.contact_messages;
create policy "msg_update_staff" on public.contact_messages
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "msg_delete_staff" on public.contact_messages;
create policy "msg_delete_staff" on public.contact_messages
  for delete to authenticated using (public.is_staff());

-- ---------------------------------------------------------------------------
-- Auto-user handler: profiles row + role assignment from team_members
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role text;
  v_member_id uuid;
begin
  -- 1) create profile
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do nothing;

  -- 2) link to team_members by email and grant role via app_metadata
  select id, role into v_member_id, v_role
  from public.team_members
  where lower(email) = lower(new.email) and status in ('invited','active')
  limit 1;

  if v_role is null then
    v_role := 'guest';
  end if;

  -- update auth metadata with role
  update auth.users
    set raw_app_meta_data = jsonb_set(
      coalesce(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(v_role)
    )
  where id = new.id;

  -- mark team member active + link user_id
  if v_member_id is not null then
    update public.team_members
      set status = 'active', user_id = new.id
      where id = v_member_id;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Seed: first admin + master settings + sample content
-- ---------------------------------------------------------------------------

-- First admin (auto-promoted on sign-up with admin@lumiere.com)
insert into public.team_members (email, role, status)
values ('admin@lumiere.com', 'admin', 'invited')
on conflict (email) do nothing;

-- Restaurant settings (single row)
insert into public.restaurant_settings (id, name, tagline, story, phone, email, address, map_url, hero_image, social_instagram, social_facebook)
values (
  1,
  'Lumière',
  'An Evening of French Elegance',
  'Founded in 2014, Lumière is a love letter to French gastronomy. Chef Antoine Mercier crafts seasonal tasting menus that honor classical technique while embracing the produce of our region. Every evening begins with candlelight, an open kitchen, and a glass of something memorable.',
  '+1 (212) 555-0148',
  'reservations@lumiere.com',
  '248 Mercer Street, New York, NY 10012',
  'https://maps.google.com/?q=248+Mercer+Street+New+York',
  'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=1600',
  'https://instagram.com/lumiere',
  'https://facebook.com/lumiere'
)
on conflict (id) do nothing;

-- Menu categories
insert into public.menu_categories (name, description, sort_order) values
  ('Appetizers', 'Small plates to begin the evening', 1),
  ('First Course', 'Refined starters from the season''s harvest', 2),
  ('Main Course', 'The heart of the table', 3),
  ('Desserts', 'Sweet conclusions', 4),
  ('Cellar & Bar', 'Curated wines and spirits', 5)
on conflict do nothing;

-- Menu items (linked to categories by name via subquery)
insert into public.menu_items (category_id, name, description, price, image_url, available, featured, dietary_tags, sort_order)
select c.id, x.name, x.description, x.price, x.image_url, x.available, x.featured, x.dietary_tags, x.sort_order
from (values
  ('Appetizers','Oysters Mignonette','Half-dozen East Coast oysters, shalllet mignonette, cracked ice',24,'https://images.pexels.com/photos/460832/pexels-photo-460832.jpeg?auto=compress&cs=tinysrgb&w=800',true,true,'{pescatarian,gluten-free}'::text[],1),
  ('Appetizers','Tuna Crudo','Yellowfin tuna, blood orange, fennel, chili oil, sea salt',22,'https://images.pexels.com/photos/3066408/pexels-photo-3066408.jpeg?auto=compress&cs=tinysrgb&w=800',true,false,'{pescatarian,gluten-free,dairy-free}'::text[],2),
  ('Appetizers','Beet Tartare','Roasted heirloom beets, capers, shallot, quail yolk, rye crisp',18,'https://images.pexels.com/photos/1213710/pexels-photo-1213710.jpeg?auto=compress&cs=tinysrgb&w=800',true,false,'{vegetarian}'::text[],3),
  ('First Course','Wild Mushroom Velouté','Forest mushrooms, toasted hazelnut, truffle cream, chive oil',19,'https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg?auto=compress&cs=tinysrgb&w=800',true,true,'{vegetarian,gluten-free}'::text[],1),
  ('First Course','Burrata & Stone Fruit','Creamy burrata, grilled peach, basil oil, aged balsamic',21,'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=compress&cs=tinysrgb&w=800',true,false,'{vegetarian,gluten-free}'::text[],2),
  ('First Course','Lobster Bisque','Maine lobster, cognac, tarragon, cognac flamed at the pass',26,'https://images.pexels.com/photos/540901/pexels-photo-540901.jpeg?auto=compress&cs=tinysrgb&w=800',true,false,'{pescatarian,gluten-free}'::text[],3),
  ('Main Course','Coq au Vin','Bresse chicken, red wine, lardons, pearl onions, mushrooms',42,'https://images.pexels.com/photos/2233348/pexels-photo-2233348.jpeg?auto=compress&cs=tinysrgb&w=800',true,true,'{gluten-free}'::text[],1),
  ('Main Course','Bouillabaisse Marseillaise','Day-boat catch, saffron broth, rouille, toasted sourdough',48,'https://images.pexels.com/photos/540902/pexels-photo-540902.jpeg?auto=comprime&cs=tinysrgb&w=800',true,false,'{pescatarian}'::text[],2),
  ('Main Course','Filet de Boeuf','8oz tenderloin, bone marrow butter, pommes purée, bordelaise',56,'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=800',true,true,'{gluten-free}'::text[],3),
  ('Main Course','Risotto aux Champignons','Carnaroli rice, wild mushrooms, parmesan, white truffle oil',38,'https://images.pexels.com/photos/1437267/pexels-photo-1437267.jpeg?auto=compress&cs=tinysrgb&w=800',true,false,'{vegetarian,gluten-free}'::text[],4),
  ('Desserts','Crème Brûlée','Tahitian vanilla custard, caramelized sugar crust, seasonal berries',14,'https://images.pexels.com/photos/14738384/pexels-photo-14738384.jpeg?auto=compress&cs=tinysrgb&w=800',true,true,'{vegetarian,gluten-free}'::text[],1),
  ('Desserts','Tarte Tatin','Caramelized apple tart, crème fraîche, Calvados caramel',15,'https://images.pexels.com/photos/3026808/pexels-photo-3026808.jpeg?auto=compress&cs=tinysrgb&w=800',true,false,'{vegetarian}'::text[],2),
  ('Desserts','Dark Chocolate Soufflé','70% Valrhona, crème anglaise, gold leaf',16,'https://images.pexels.com/photos/410999/pexels-photo-410999.jpeg?auto=compress&cs=tinysrgb&w=800',true,false,'{vegetarian}'::text[],3),
  ('Cellar & Bar','Sommelier''s Flight','Three glasses paired to your tasting menu',36,'https://images.pexels.com/photos/3937673/pexels-photo-3937673.jpeg?auto=compress&cs=tinysrgb&w=800',true,true,'{}'::text[],1),
  ('Cellar & Bar','Lumière Martini','House gin, dry vermouth, olive, lemon twist',18,'https://images.pexels.com/photos/4667145/pexels-photo-4667145.jpeg?auto=compress&cs=tinysrgb&w=800',true,false,'{vegetarian}'::text[],2),
  ('Cellar & Bar','Champagne by the Glass','Grower champagne, served chilled',22,'https://images.pexels.com/photos/3008/wine-glass-drink-party.jpg?auto=compress&cs=tinysrgb&w=800',true,false,'{vegetarian,gluten-free}'::text[],3)
) as x(category, name, description, price, image_url, available, featured, dietary_tags, sort_order)
join public.menu_categories c on c.name = x.category
on conflict do nothing;

-- Events
insert into public.events (title, description, event_date, image_url, price_per_person, capacity) values
  ('Bordeaux Vintage Dinner', 'A six-course tasting paired with rare vintages from our Bordeaux cellar, hosted by Sommelier Claire Dubois.', '2026-08-15', 'https://images.pexels.com/photos/14081062/pexels-photo-14081062.jpeg?auto=compress&cs=tinysrgb&w=800', 185, 24),
  ('Jazz & Champagne Night', 'Live jazz trio with a flowing champagne pairing menu. An evening of standards and bubbles.', '2026-09-05', 'https://images.pexels.com/photos/2577934/pexels-photo-2577934.jpeg?auto=compress&cs=tinysrgb&w=800', 145, 40),
  ('Truffle Season Tasting', 'The first black winter truffles arrive. A four-course menu celebrating the season.', '2026-11-20', 'https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg?auto=compress&cs=tinysrgb&w=800', 220, 18)
on conflict do nothing;

-- Gallery
insert into public.gallery (image_url, caption, category, sort_order) values
  ('https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800','Our main dining room at dusk','interior',1),
  ('https://images.pexels.com/photos/260922/pexels-photo-260922.jpeg?auto=compress&cs=tinysrgb&w=800','The candlelit bar','interior',2),
  ('https://images.pexels.com/photos/3338497/pexels-photo-3338497.jpeg?auto=compress&cs=tinysrgb&w=800','Private dining alcove','interior',3),
  ('https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=800','Plating at the pass','food',1),
  ('https://images.pexels.com/photos/3066408/pexels-photo-3066408.jpeg?auto=export&cs=tinysrgb&w=800','Tuna crudo, finished','food',2),
  ('https://images.progel.com/photos/1414651/pexels-photo-1414651.jpeg?auto=compress&cs=tinysrgb&w=800','Dessert service','food',3),
  ('https://images.pexels.com/photos/2577934/pexels-photo-2577934.jpeg?auto=compress&cs=tinysrgb&w=800','Jazz night on the patio','events',1),
  ('https://images.pexels.com/photos/14081062/pexels-photo-14081062.jpeg?auto=compress&cs=tinysrgb&w=800','Wine dinner pairing','events',2)
on conflict do nothing;

-- Testimonials
insert into public.testimonials (author, title, rating, quote, avatar_url, sort_order) values
  ('Eleanor V.', 'Food Critic, The Times', 5, 'Lumière is the most quietly confident kitchen in the city. The bouillabaisse alone is worth the journey.', null, 1),
  ('Marcus B.', 'Anniversary Dinner', 5, 'We have celebrated every anniversary here for six years. The staff remember our wine. It feels like coming home.', null, 2),
  ('Sofia R.', 'Food Blogger', 5, 'From the first amuse-bouche to the soufflé, every plate told a story. Service that anticipates rather than intrudes.', null, 3),
  ('James W.', 'Wine Enthusiast', 5, 'The sommelier''s flight was a masterclass. I discovered two producers I now order by the case.', null, 4)
on conflict do nothing;
