-- AiConfig holds the single global AI setting row (id 'global'), written by
-- PUT /admin/ai/config. Absent on a fresh database, in which case the AI_MODEL
-- environment default applies. ScheduledDraft is the one shot content
-- generation queue the per minute ai-schedule job drains.
-- CreateTable
CREATE TABLE "AiConfig" (
    "id" TEXT NOT NULL,
    "chatModel" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduledDraft" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'document',
    "input" JSONB NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdBy" TEXT NOT NULL,
    "draftId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduledDraft_status_runAt_idx" ON "ScheduledDraft"("status", "runAt");
