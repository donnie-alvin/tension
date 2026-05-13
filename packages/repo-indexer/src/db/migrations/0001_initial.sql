CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS repo_index_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  repo_path text NOT NULL,
  file_path text NOT NULL,
  language text NOT NULL,
  content_hash text NOT NULL,
  line_count integer,
  indexed_at timestamptz,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS repo_index_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES repo_index_files(id) ON DELETE CASCADE,
  chunk_index integer,
  chunk_type text,
  symbol_name text,
  content text NOT NULL,
  start_line integer,
  end_line integer,
  token_count integer,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS repo_index_symbols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES repo_index_files(id) ON DELETE CASCADE,
  name text,
  kind text,
  is_exported boolean,
  is_default_export boolean,
  chunk_id uuid REFERENCES repo_index_chunks(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS repo_index_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file_id uuid NOT NULL REFERENCES repo_index_files(id) ON DELETE CASCADE,
  import_specifier text,
  resolved_file_id uuid REFERENCES repo_index_files(id) ON DELETE SET NULL,
  is_external boolean,
  imported_names text[]
);

CREATE TABLE IF NOT EXISTS repo_index_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id uuid NOT NULL REFERENCES repo_index_files(id) ON DELETE CASCADE,
  chunk_id uuid REFERENCES repo_index_chunks(id) ON DELETE SET NULL,
  summary text,
  summary_embedding vector(1536),
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS repo_index_chunks_embedding_hnsw_idx
  ON repo_index_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS repo_index_summaries_summary_embedding_hnsw_idx
  ON repo_index_summaries USING hnsw (summary_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS repo_index_chunks_file_id_chunk_index_idx
  ON repo_index_chunks (file_id, chunk_index);

CREATE INDEX IF NOT EXISTS repo_index_files_project_id_content_hash_idx
  ON repo_index_files (project_id, content_hash);

CREATE INDEX IF NOT EXISTS repo_index_chunks_content_trgm_idx
  ON repo_index_chunks USING gin (content gin_trgm_ops);

CREATE INDEX IF NOT EXISTS repo_index_chunks_symbol_name_trgm_idx
  ON repo_index_chunks USING gin (symbol_name gin_trgm_ops);
