CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE TABLE "repo_index_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" uuid NOT NULL,
	"chunk_index" integer,
	"chunk_type" text,
	"symbol_name" text,
	"content" text NOT NULL,
	"start_line" integer,
	"end_line" integer,
	"token_count" integer,
	"embedding" vector(1536),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repo_index_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"repo_path" text NOT NULL,
	"file_path" text NOT NULL,
	"language" text NOT NULL,
	"content_hash" text NOT NULL,
	"line_count" integer,
	"indexed_at" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repo_index_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_file_id" uuid NOT NULL,
	"import_specifier" text,
	"resolved_file_id" uuid,
	"is_external" boolean,
	"imported_names" text[]
);
--> statement-breakpoint
CREATE TABLE "repo_index_summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" uuid NOT NULL,
	"chunk_id" uuid,
	"summary" text,
	"summary_embedding" vector(1536),
	"model" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repo_index_symbols" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" uuid NOT NULL,
	"name" text,
	"kind" text,
	"is_exported" boolean,
	"is_default_export" boolean,
	"chunk_id" uuid
);
--> statement-breakpoint
ALTER TABLE "repo_index_chunks" ADD CONSTRAINT "repo_index_chunks_file_id_repo_index_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."repo_index_files"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "repo_index_imports" ADD CONSTRAINT "repo_index_imports_source_file_id_repo_index_files_id_fk" FOREIGN KEY ("source_file_id") REFERENCES "public"."repo_index_files"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "repo_index_imports" ADD CONSTRAINT "repo_index_imports_resolved_file_id_repo_index_files_id_fk" FOREIGN KEY ("resolved_file_id") REFERENCES "public"."repo_index_files"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "repo_index_summaries" ADD CONSTRAINT "repo_index_summaries_file_id_repo_index_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."repo_index_files"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "repo_index_summaries" ADD CONSTRAINT "repo_index_summaries_chunk_id_repo_index_chunks_id_fk" FOREIGN KEY ("chunk_id") REFERENCES "public"."repo_index_chunks"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "repo_index_symbols" ADD CONSTRAINT "repo_index_symbols_file_id_repo_index_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."repo_index_files"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "repo_index_symbols" ADD CONSTRAINT "repo_index_symbols_chunk_id_repo_index_chunks_id_fk" FOREIGN KEY ("chunk_id") REFERENCES "public"."repo_index_chunks"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "repo_index_chunks_embedding_hnsw_idx" ON "repo_index_chunks" USING hnsw ("embedding" vector_cosine_ops) WITH (m=16,ef_construction=64);
--> statement-breakpoint
CREATE INDEX "repo_index_chunks_file_id_chunk_index_idx" ON "repo_index_chunks" USING btree ("file_id","chunk_index");
--> statement-breakpoint
CREATE INDEX "repo_index_chunks_content_trgm_idx" ON "repo_index_chunks" USING gin ("content" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX "repo_index_chunks_symbol_name_trgm_idx" ON "repo_index_chunks" USING gin ("symbol_name" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX "repo_index_files_project_id_content_hash_idx" ON "repo_index_files" USING btree ("project_id","content_hash");
--> statement-breakpoint
CREATE INDEX "repo_index_summaries_summary_embedding_hnsw_idx" ON "repo_index_summaries" USING hnsw ("summary_embedding" vector_cosine_ops) WITH (m=16,ef_construction=64);
