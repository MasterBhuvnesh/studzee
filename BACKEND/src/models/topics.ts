import { z } from 'zod'

/**
 * FIXED TOPIC REGISTRY
 *
 * This is deliberately a code-level constant rather than a database table.
 * Topics drive list filtering, the document default and unlock gating, so a
 * topic must ship through code review like any other schema change instead of
 * being mutated at runtime. Freeform tags were rejected by owner decision;
 * every document belongs to exactly one of these keys.
 */
export const TOPIC_KEYS = [
  'machine-learning',
  'system-design',
  'devops',
  'aws',
  'data',
  'deep-learning',
] as const

export type TopicKey = (typeof TOPIC_KEYS)[number]

/**
 * Record forces a label for every key above: adding a key without a label, or
 * a label without a key, fails to compile rather than surfacing at runtime.
 */
const TOPIC_LABELS: Record<TopicKey, string> = {
  'machine-learning': 'Machine Learning',
  'system-design': 'System Design',
  devops: 'DevOps',
  aws: 'AWS',
  data: 'Data',
  'deep-learning': 'Deep Learning',
}

export const DEFAULT_TOPIC_KEY: TopicKey = 'machine-learning'

/**
 * Ordered display metadata, derived from TOPIC_KEYS so the two lists cannot
 * drift apart.
 */
export const TOPIC_REGISTRY: { key: TopicKey; label: string }[] =
  TOPIC_KEYS.map((key) => ({ key, label: TOPIC_LABELS[key] }))

/**
 * The error message doubles as API documentation: an unknown key in a query
 * or payload comes back listing every allowed topic.
 */
export const TopicSchema = z.enum(TOPIC_KEYS, {
  errorMap: () => ({
    message: `Unknown topic. Allowed topics are: ${TOPIC_KEYS.join(', ')}`,
  }),
})

export type Topic = z.infer<typeof TopicSchema>
