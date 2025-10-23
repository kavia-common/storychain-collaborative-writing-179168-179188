-- Initial schema for StoryChain
-- Users, Stories, Paragraphs, Reactions
-- Note: Support both uuid-ossp and pgcrypto for UUID generation depending on environment.

-- Try to enable uuid-ossp; ignore if not available
DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  EXCEPTION WHEN undefined_file THEN
    -- uuid-ossp not available; will fallback to pgcrypto/gen_random_uuid
    RAISE NOTICE 'uuid-ossp extension not available, will use pgcrypto';
  END;
END
$$;

-- Try to enable pgcrypto for gen_random_uuid; ignore if not available
DO $$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  EXCEPTION WHEN undefined_file THEN
    RAISE NOTICE 'pgcrypto extension not available';
  END;
END
$$;

-- Helper: use gen_random_uuid() when available, otherwise uuid_generate_v4()
-- We implement this by creating a SQL function uuid_v4() that picks the available generator.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'uuid_v4'
  ) THEN
    CREATE OR REPLACE FUNCTION uuid_v4() RETURNS uuid AS $f$
      SELECT COALESCE(
        NULLIF(current_setting('uuid.generate', true), '')::uuid,
        -- try gen_random_uuid if exists
        (SELECT CASE WHEN EXISTS (
          SELECT 1 FROM pg_proc WHERE proname = 'gen_random_uuid'
        ) THEN gen_random_uuid() ELSE NULL END),
        -- fallback to uuid_generate_v4 if exists
        (SELECT CASE WHEN EXISTS (
          SELECT 1 FROM pg_proc WHERE proname = 'uuid_generate_v4'
        ) THEN uuid_generate_v4() ELSE NULL END)
      );
    $f$ LANGUAGE SQL STABLE;
  END IF;
END
$$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT COALESCE(uuid_v4(), gen_random_uuid(), uuid_generate_v4()),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT, -- optional if using external auth providers
  display_name VARCHAR(100),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT COALESCE(uuid_v4(), gen_random_uuid(), uuid_generate_v4()),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'ongoing', -- ongoing | completed | archived
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  current_paragraph_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Paragraphs table
CREATE TABLE IF NOT EXISTS paragraphs (
  id UUID PRIMARY KEY DEFAULT COALESCE(uuid_v4(), gen_random_uuid(), uuid_generate_v4()),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  paragraph_order INTEGER NOT NULL, -- sequential order within a story
  ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (story_id, paragraph_order)
);

-- Reactions table (likes, emojis, etc.)
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT COALESCE(uuid_v4(), gen_random_uuid(), uuid_generate_v4()),
  paragraph_id UUID NOT NULL REFERENCES paragraphs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reaction_type VARCHAR(32) NOT NULL, -- e.g., like, laugh, wow, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (paragraph_id, user_id, reaction_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

CREATE INDEX IF NOT EXISTS idx_stories_status ON stories (status);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON stories (created_at);
CREATE INDEX IF NOT EXISTS idx_stories_created_by ON stories (created_by);

CREATE INDEX IF NOT EXISTS idx_paragraphs_story_id ON paragraphs (story_id);
CREATE INDEX IF NOT EXISTS idx_paragraphs_author_id ON paragraphs (author_id);
CREATE INDEX IF NOT EXISTS idx_paragraphs_story_order ON paragraphs (story_id, paragraph_order);

CREATE INDEX IF NOT EXISTS idx_reactions_paragraph_id ON reactions (paragraph_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions (user_id);
