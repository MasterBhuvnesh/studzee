-- Drop the SystemLog table. It was declared in the initial migration but never
-- written to or read by any code path, so no data is lost.

-- DropIndex
DROP INDEX IF EXISTS "SystemLog_event_idx";

-- DropIndex
DROP INDEX IF EXISTS "SystemLog_createdAt_idx";

-- DropTable
DROP TABLE IF EXISTS "SystemLog";
