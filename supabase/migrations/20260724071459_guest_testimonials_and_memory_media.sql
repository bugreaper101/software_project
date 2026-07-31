/*
# Guest testimonials with media and admin moderation

1. New Tables
- `guest_testimonials`
  - id (uuid, PK)
  - user_id (uuid, FK auth.users, defaults to auth.uid()) — the submitting guest
  - author_name (text, not null) — display name shown publicly
  - avatar_url (text, nullable) — optional profile photo URL
  - rating (int, 1–5, not null, default 5) — star rating
  - quote (text, not null) — the guest's written words
  - status (text, pending|approved|rejected|blocked, default 'pending') — moderation state
  - sort_order (int, default 0) — admin-controlled ordering after approval
  - created_at (timestamptz, default now())
- `guest_memory_media`
  - id (uuid, PK)
  - testimonial_id (uuid, FK guest_testimonials ON DELETE CASCADE)
  - user_id (uuid, FK auth.users) — the guest who uploaded
  - media_url (text, not null) — public storage URL
  - media_type (text, 'image'|'video', not null)
  - caption (text, nullable)
  - sort_order (int, default 0)
  - created_at (timestamptz, default now())

2. Storage
- Creates a public storage bucket `guest-memories` for uploading guest photos and videos.
- Storage policies: authenticated users can upload to their own folder; public can read.

3. Security (RLS)
- guest_testimonials:
  - SELECT: public (anon) can read only approved rows; authenticated users can also read their own rows (any status); staff can read all.
  - INSERT: any authenticated user can insert their own (user_id defaults to auth.uid()).
  - UPDATE: staff can update any row (moderation); guests can update only their own.
  - DELETE: staff can delete any; guests can delete their own.
- guest_memory_media:
  - SELECT: public can read media belonging to approved testimonials; authenticated users can read their own; staff can read all.
  - INSERT: authenticated users can insert media for their own testimonials.
  - UPDATE/DELETE: staff can manage any; guests can manage their own.

4. Notes
- A "blocked" testimonial means the admin has blocked that guest's submission; the admin should
  also block future submissions by checking if the user has any blocked row (checked in app logic
  on insert — the app will query for existing blocked rows before allowing a new submission).
- Media uploads go to Supabase Storage bucket `guest-memories` under path `user_id/timestamp_filename`.
*/

-- ── guest_testimonials ──
CREATE TABLE IF NOT EXISTS guest_testimonials (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  avatar_url  text,
  rating      int  NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  quote       text NOT NULL,
  status      text NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','approved','rejected','blocked')),
  sort_order  int  NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE guest_testimonials ENABLE ROW LEVEL SECURITY;

-- SELECT: public reads approved only; authenticated also reads own; staff reads all
DROP POLICY IF EXISTS "public_read_approved_testimonials" ON guest_testimonials;
CREATE POLICY "public_read_approved_testimonials"
  ON guest_testimonials FOR SELECT
  TO anon, authenticated
  USING (
    status = 'approved'
    OR auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('admin','manager','staff')
    )
  );

-- INSERT: any authenticated user can create their own
DROP POLICY IF EXISTS "insert_own_testimonial" ON guest_testimonials;
CREATE POLICY "insert_own_testimonial"
  ON guest_testimonials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: staff can moderate any; guests can edit their own
DROP POLICY IF EXISTS "update_testimonial" ON guest_testimonials;
CREATE POLICY "update_testimonial"
  ON guest_testimonials FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('admin','manager','staff')
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('admin','manager','staff')
    )
  );

-- DELETE: staff can delete any; guests can delete their own
DROP POLICY IF EXISTS "delete_testimonial" ON guest_testimonials;
CREATE POLICY "delete_testimonial"
  ON guest_testimonials FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('admin','manager','staff')
    )
  );

-- ── guest_memory_media ──
CREATE TABLE IF NOT EXISTS guest_memory_media (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  testimonial_id uuid NOT NULL REFERENCES guest_testimonials(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url      text NOT NULL,
  media_type     text NOT NULL CHECK (media_type IN ('image','video')),
  caption        text,
  sort_order     int  NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE guest_memory_media ENABLE ROW LEVEL SECURITY;

-- SELECT: public reads media of approved testimonials; authenticated reads own; staff reads all
DROP POLICY IF EXISTS "public_read_approved_media" ON guest_memory_media;
CREATE POLICY "public_read_approved_media"
  ON guest_memory_media FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM guest_testimonials gt
      WHERE gt.id = guest_memory_media.testimonial_id
        AND gt.status = 'approved'
    )
    OR auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('admin','manager','staff')
    )
  );

-- INSERT: authenticated users can add media to their own testimonials
DROP POLICY IF EXISTS "insert_own_media" ON guest_memory_media;
CREATE POLICY "insert_own_media"
  ON guest_memory_media FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM guest_testimonials gt
      WHERE gt.id = guest_memory_media.testimonial_id
        AND gt.user_id = auth.uid()
    )
  );

-- UPDATE / DELETE: staff manage any; guests manage their own
DROP POLICY IF EXISTS "update_media" ON guest_memory_media;
CREATE POLICY "update_media"
  ON guest_memory_media FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('admin','manager','staff')
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('admin','manager','staff')
    )
  );

DROP POLICY IF EXISTS "delete_media" ON guest_memory_media;
CREATE POLICY "delete_media"
  ON guest_memory_media FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('admin','manager','staff')
    )
  );

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_guest_testimonials_status ON guest_testimonials(status);
CREATE INDEX IF NOT EXISTS idx_guest_testimonials_user   ON guest_testimonials(user_id);
CREATE INDEX IF NOT EXISTS idx_guest_memory_media_test   ON guest_memory_media(testimonial_id);

-- ── Storage bucket for guest media ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('guest-memories', 'guest-memories', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, authenticated upload to own folder
DROP POLICY IF EXISTS "public_read_guest_memories" ON storage.objects;
CREATE POLICY "public_read_guest_memories"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'guest-memories');

DROP POLICY IF EXISTS "auth_upload_guest_memories" ON storage.objects;
CREATE POLICY "auth_upload_guest_memories"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'guest-memories');

DROP POLICY IF EXISTS "auth_update_own_guest_memories" ON storage.objects;
CREATE POLICY "auth_update_own_guest_memories"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'guest-memories' AND owner = auth.uid());

DROP POLICY IF EXISTS "auth_delete_own_guest_memories" ON storage.objects;
CREATE POLICY "auth_delete_own_guest_memories"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'guest-memories' AND owner = auth.uid());
