-- KbChunk stores an embedding in a pgvector column, so the extension has to
-- exist before the table that declares one. IF NOT EXISTS keeps this safe on a
-- managed database where the extension is already installed, which is the case
-- on Supabase and on Neon.
--
-- This is why docker-compose.yml runs pgvector/pgvector:pg16 rather than the
-- plain Postgres image. RDS, Neon and Supabase all offer pgvector, so the
-- deployment options are unchanged.
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "AiDraft" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sourceId" TEXT,
    "payload" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "appliedId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KbChunk" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT,
    "heading" TEXT,
    "text" TEXT NOT NULL,
    "embedding" vector(2048) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KbChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiDraft_status_kind_idx" ON "AiDraft"("status", "kind");

-- CreateIndex
CREATE INDEX "AiDraft_sourceId_kind_idx" ON "AiDraft"("sourceId", "kind");

-- CreateIndex
CREATE INDEX "AiDraft_createdAt_idx" ON "AiDraft"("createdAt");

-- CreateIndex
CREATE INDEX "KbChunk_source_sourceId_idx" ON "KbChunk"("source", "sourceId");

-- No approximate nearest neighbour index. pgvector caps an HNSW index at 2000
-- dimensions and nemotron-3-embed-1b returns 2048, so hnsw (embedding
-- vector_cosine_ops) is rejected outright. The knowledge base is a few dozen
-- chunks, where a sequential scan is already sub millisecond, so the index
-- would be ceremony even if the dimension allowed it.
-- ponytail: exact scan on every support question. If the corpus reaches the
-- thousands, store the column as halfvec(2048) and index that instead, which
-- HNSW supports up to 4000 dimensions.
