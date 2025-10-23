-- Initial schema for StoryChain
-- Users, Stories, Paragraphs, Reactions
-- Note: Adjust UUID/defaults as needed based on environment capabilities.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
