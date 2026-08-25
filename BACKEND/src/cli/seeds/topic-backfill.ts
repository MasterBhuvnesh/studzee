/**
 * PURE BACKFILL PATCH BUILDER
 *
 * Existing production documents were inserted before the topic field existed
 * and before tags existed. This helper decides which fields a stored document
 * is missing and builds an update patch that fills ONLY those fields from the
 * seed fixture. A field already present on the stored document is never
 * overwritten, even when its value differs from the fixture.
 */

interface StoredShape {
  topic?: unknown
  tags?: unknown
}

interface FixtureShape {
  topic?: string
  tags?: string[]
}

/**
 * Patch for the missing fields, empty when the stored document is already
 * complete. A fixture without a value cannot fill anything either, so both
 * sides must agree a field is missing before it enters the patch.
 */
export const buildBackfillPatch = (
  stored: StoredShape,
  fixture: FixtureShape
): Record<string, unknown> => {
  const patch: Record<string, unknown> = {}

  // Pre-registry documents carry no topic key at all; null counts as absent.
  const topicMissing =
    !('topic' in stored) || stored.topic === undefined || stored.topic === null
  if (topicMissing && fixture.topic) {
    patch.topic = fixture.topic
  }

  // Missing tags and an explicit empty array are treated the same way.
  const tagsMissing =
    !Array.isArray(stored.tags) || (stored.tags as unknown[]).length === 0
  if (tagsMissing && Array.isArray(fixture.tags) && fixture.tags.length > 0) {
    patch.tags = fixture.tags
  }

  return patch
}
