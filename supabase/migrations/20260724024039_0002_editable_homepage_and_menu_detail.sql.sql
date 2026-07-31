-- ===========================================================================
-- Migration 0002: Fully editable homepage + rich menu detail with food images
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. restaurant_settings: add all editable homepage text fields
-- ---------------------------------------------------------------------------
alter table public.restaurant_settings
  add column if not exists hero_title text default 'Where every plate tells a story',
  add column if not exists hero_title_accent text default 'story',
  add column if not exists hero_subtitle text default 'A candlelit room, an open kitchen, and a seasonal tasting menu that honors classical French technique. Welcome to Lumière.',
  add column if not exists about_eyebrow text default 'Our Story',
  add column if not exists about_title text default 'A love letter to French gastronomy',
  add column if not exists about_image text default 'https://images.pexels.com/photos/3338497/pexels-photo-3338497.jpeg?auto=compress&cs=tinysrgb&w=900',
  add column if not exists stat_number text default '10',
  add column if not exists stat_label text default 'Years of craftsmanship',
  add column if not exists feature_1_icon text default 'UtensilsCrossed',
  add column if not exists feature_1_label text default 'Seasonal Tasting Menu',
  add column if not exists feature_2_icon text default 'Wine',
  add column if not exists feature_2_label text default 'Curated Cellar',
  add column if not exists feature_3_icon text default 'Sparkles',
  add column if not exists feature_3_label text default 'Open Kitchen',
  add column if not exists menu_eyebrow text default 'The Menu',
  add column if not exists menu_title text default 'A celebration of the season',
  add column if not exists menu_subtitle text default 'Our menu changes with the harvest. Below is a selection of what is gracing our tables this season.',
  add column if not exists events_eyebrow text default 'Special Evenings',
  add column if not exists events_title text default 'Upcoming events',
  add column if not exists gallery_eyebrow text default 'The Gallery',
  add column if not exists gallery_title text default 'Moments at Lumière',
  add column if not exists testimonials_eyebrow text default 'Guest Words',
  add column if not exists testimonials_title text default 'What our guests say',
  add column if not exists contact_eyebrow text default 'Get in Touch',
  add column if not exists contact_title text default 'Visit Lumière',
  add column if not exists reservation_eyebrow text default 'Reservations',
  add column if not exists reservation_title text default 'Reserve your evening',
  add column if not exists reservation_subtitle text default 'We seat parties of one to eight. Book below and we''ll confirm your table by email.',
  add column if not exists reservation_bg_image text default 'https://images.pexels.com/photos/2577934/pexels-photo-2577934.jpeg?auto=compress&cs=tinysrgb&w=1600';

-- ---------------------------------------------------------------------------
-- 2. menu_categories: add image and subtitle for elegant category cards
-- ---------------------------------------------------------------------------
alter table public.menu_categories
  add column if not exists image_url text,
  add column if not exists subtitle text;

-- ---------------------------------------------------------------------------
-- 3. menu_items: add rich detail fields for food detail modal
-- ---------------------------------------------------------------------------
alter table public.menu_items
  add column if not exists long_description text,
  add column if not exists ingredients text,
  add column if not exists pairing text;

-- ---------------------------------------------------------------------------
-- 4. menu_item_images: multiple photos per dish for the detail gallery
-- ---------------------------------------------------------------------------
create table if not exists public.menu_item_images (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  image_url text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.menu_item_images enable row level security;

drop policy if exists "mi_img_select_all" on public.menu_item_images;
create policy "mi_img_select_all" on public.menu_item_images
  for select to anon, authenticated using (true);

drop policy if exists "mi_img_insert_staff" on public.menu_item_images;
create policy "mi_img_insert_staff" on public.menu_item_images
  for insert to authenticated with check (public.is_staff());

drop policy if exists "mi_img_update_staff" on public.menu_item_images;
create policy "mi_img_update_staff" on public.menu_item_images
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

drop policy if exists "mi_img_delete_staff" on public.menu_item_images;
create policy "mi_img_delete_staff" on public.menu_item_images
  for delete to authenticated using (public.is_staff());

-- ---------------------------------------------------------------------------
-- 5. Seed: category images + subtitles, menu item detail fields
-- ---------------------------------------------------------------------------
update public.menu_categories set
  image_url = case name
    when 'Appetizers' then 'https://images.pexels.com/photos/460832/pexels-photo-460832.jpeg?auto=compress&cs=tinysrgb&w=800'
    when 'First Course' then 'https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg?auto=compress&cs=tinysrgb&w=800'
    when 'Main Course' then 'https://images.pexels.com/photos/2233348/pexels-photo-2233348.jpeg?auto=compress&cs=tinysrgb&w=800'
    when 'Desserts' then 'https://images.pexels.com/photos/14738384/pexels-photo-14738384.jpeg?auto=compress&cs=tinysrgb&w=800'
    when 'Cellar & Bar' then 'https://images.pexels.com/photos/3937673/pexels-photo-3937673.jpeg?auto=compress&cs=tinysrgb&w=800'
  end,
  subtitle = case name
    when 'Appetizers' then 'Small plates to awaken the palate'
    when 'First Course' then 'Refined starters from the season''s harvest'
    when 'Main Course' then 'The heart of the table'
    when 'Desserts' then 'Sweet conclusions to a memorable evening'
    when 'Cellar & Bar' then 'Curated wines and crafted spirits'
  end
where image_url is null;

-- Add long descriptions to featured items
update public.menu_items set
  long_description = 'Six East Coast oysters shucked to order, served over cracked ice with a classic mignonette of shallots, cracked pepper, and aged sherry vinegar. The brine of the Atlantic meets the sharp elegance of a French classic.'
where name = 'Oysters Mignonette';

update public.menu_items set
  long_description = 'Yellowfin tuna, sliced thin and dressed with blood orange supremes, shaved fennel, a whisper of chili oil, and Maldon sea salt. A study in clarity and restraint.'
where name = 'Tuna Crudo';

update public.menu_items set
  long_description = 'Bresse chicken braised low and slow in red Burgundy with lardons, pearl onions, and mushrooms. The sauce is reduced until silk-like, then finished with a knob of butter at the pass. A pillar of the French canon.'
where name = 'Coq au Vin';

update public.menu_items set
  long_description = 'Eight ounces of center-cut tenderloin, seared and rested, seated atop pommes purée, draped in a bordelaise reduction, and crowned with a disc of roasted bone marrow butter that melts into the meat.'
where name = 'Filet de Boeuf';

update public.menu_items set
  long_description = 'Tahitian vanilla custard set beneath a crackling caramelized sugar crust, scattered with seasonal berries and a sprig of mint. The simplest dessert, done perfectly.'
where name = 'Crème Brûlée';

-- Add ingredients and pairings to key items
update public.menu_items set
  ingredients = 'East Coast oysters, shallots, sherry vinegar, cracked pepper, Maldon salt',
  pairing = 'Chablis or a crisp Sancerre'
where name = 'Oysters Mignonette';

update public.menu_items set
  ingredients = 'Bresse chicken, red Burgundy, lardons, pearl onions, cremini mushrooms, thyme',
  pairing = 'Pinot Noir or Côte de Beaune'
where name = 'Coq au Vin';

update public.menu_items set
  ingredients = 'Beef tenderloin, bone marrow, pommes purée, bordelaise sauce, shallots',
  pairing = 'Left-bank Bordeaux or a structured Syrah'
where name = 'Filet de Boeuf';

-- ---------------------------------------------------------------------------
-- 6. Seed: a few extra food photos for the detail gallery
-- ---------------------------------------------------------------------------
insert into public.menu_item_images (menu_item_id, image_url, caption, sort_order)
select mi.id, img.url, img.cap, img.ord
from public.menu_items mi
join (values
  ('Oysters Mignonette', 'https://images.pexels.com/photos/460832/pexels-photo-460832.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Plated over cracked ice', 1),
  ('Oysters Mignonette', 'https://images.pexels.com/photos/1629152/pexels-photo-1629152.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Mignonette and lemon', 2),
  ('Coq au Vin', 'https://images.pexels.com/photos/2233348/pexels-photo-2233348.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Braised to tenderness', 1),
  ('Coq au Vin', 'https://images.pexels.com/photos/2092506/pexels-photo-2092506.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Served with pearl onions', 2),
  ('Filet de Boeuf', 'https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Seared to temperature', 1),
  ('Filet de Boeuf', 'https://images.pexels.com/photos/2696064/pexels-photo-2696064.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Bone marrow butter melting', 2)
) as img(dish, url, cap, ord) on img.dish = mi.name
on conflict do nothing;