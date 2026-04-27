/*
  # Create Quest Platform Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `username` (text, unique, not null)
      - `password_hash` (text, not null)
      - `created_at` (timestamptz)
    - `stories`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text)
      - `author_id` (uuid, foreign key to users)
      - `created_at` (timestamptz)
    - `nodes`
      - `id` (uuid, primary key)
      - `story_id` (uuid, foreign key to stories)
      - `text_content` (text, not null)
      - `image_url` (text)
      - `is_start_node` (boolean, default false)
      - `is_end_node` (boolean, default false)
      - `created_at` (timestamptz)
    - `edges`
      - `id` (uuid, primary key)
      - `from_node_id` (uuid, foreign key to nodes)
      - `to_node_id` (uuid, foreign key to nodes)
      - `choice_text` (text, not null)
      - `created_at` (timestamptz)
    - `save_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `story_id` (uuid, foreign key to stories)
      - `current_node_id` (uuid, foreign key to nodes)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can read/update their own data
    - Stories are readable by all authenticated users, writable by author
    - Nodes/edges readable by all authenticated users, writable by story author
    - Save progress readable/writable only by the user themselves

  3. Important Notes
    - Each story should have exactly one start node
    - End nodes should have no outgoing edges
    - The DFS validation function will check for isolated nodes and dead ends
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Stories table
CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read stories"
  ON stories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authors can insert own stories"
  ON stories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own stories"
  ON stories FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own stories"
  ON stories FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Nodes table
CREATE TABLE IF NOT EXISTS nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  text_content text NOT NULL,
  image_url text DEFAULT '',
  is_start_node boolean DEFAULT false,
  is_end_node boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read nodes"
  ON nodes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Story authors can insert nodes"
  ON nodes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = nodes.story_id
      AND stories.author_id = auth.uid()
    )
  );

CREATE POLICY "Story authors can update nodes"
  ON nodes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = nodes.story_id
      AND stories.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = nodes.story_id
      AND stories.author_id = auth.uid()
    )
  );

CREATE POLICY "Story authors can delete nodes"
  ON nodes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM stories
      WHERE stories.id = nodes.story_id
      AND stories.author_id = auth.uid()
    )
  );

-- Edges table
CREATE TABLE IF NOT EXISTS edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id uuid NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  to_node_id uuid NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  choice_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read edges"
  ON edges FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Story authors can insert edges"
  ON edges FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM nodes n
      JOIN stories s ON s.id = n.story_id
      WHERE n.id = edges.from_node_id
      AND s.author_id = auth.uid()
    )
  );

CREATE POLICY "Story authors can update edges"
  ON edges FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM nodes n
      JOIN stories s ON s.id = n.story_id
      WHERE n.id = edges.from_node_id
      AND s.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM nodes n
      JOIN stories s ON s.id = n.story_id
      WHERE n.id = edges.from_node_id
      AND s.author_id = auth.uid()
    )
  );

CREATE POLICY "Story authors can delete edges"
  ON edges FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM nodes n
      JOIN stories s ON s.id = n.story_id
      WHERE n.id = edges.from_node_id
      AND s.author_id = auth.uid()
    )
  );

-- Save progress table
CREATE TABLE IF NOT EXISTS save_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id uuid NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  current_node_id uuid NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, story_id)
);

ALTER TABLE save_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own save progress"
  ON save_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own save progress"
  ON save_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own save progress"
  ON save_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own save progress"
  ON save_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_nodes_story_id ON nodes(story_id);
CREATE INDEX IF NOT EXISTS idx_edges_from_node_id ON edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_edges_to_node_id ON edges(to_node_id);
CREATE INDEX IF NOT EXISTS idx_stories_author_id ON stories(author_id);
CREATE INDEX IF NOT EXISTS idx_save_progress_user_story ON save_progress(user_id, story_id);
