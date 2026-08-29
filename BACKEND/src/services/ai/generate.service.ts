import { Prisma } from '@prisma/client'
import { config, prisma } from '@/config'
import { DocumentModel } from '@/models/document.model'
import {
  DraftKind,
  GeneratedArticleSchema,
  GeneratedChoiceQuestSchema,
  GeneratedDocumentSchema,
  GeneratedFillBlankQuestSchema,
  GeneratedNotesSchema,
  GeneratedNotificationSchema,
  GeneratedQuestCopySchema,
  GeneratedQuizSchema,
  TGenerateContent,
  TGenerateQuest,
} from '@/models/ai.validation'
import { CreateQuestSchema } from '@/models/quest.validation'
import { chatJson } from '@/services/ai/client'
import { TOPIC_REGISTRY } from '@/models/topics'
import {
  contentPrompt,
  notesPrompt,
  notificationPrompt,
  questPrompt,
  quizPrompt,
  SourceDocument,
} from '@/services/ai/prompts'
import { AppError } from '@/types/errors'
import logger from '@/utils/logger'

/**
 * GENERATION
 *
 * Turns a piece of existing material into a pending draft. Nothing here writes
 * to the content collection, the quest table or a device: every function ends
 * at an AiDraft row, and draft.service.ts is the only thing that applies one.
 *
 * The ordering inside each generator is deliberate. The source is loaded and
 * the payload is assembled and validated against the real schema before the
 * row is written, so a draft that reaches the queue is already known to
 * satisfy the admin route it will eventually be applied through. A generator
 * that cannot produce a valid payload fails the request rather than parking a
 * draft the owner would later find unapprovable.
 */

const appError = (
  statusCode: number,
  message: string,
  code?: string
): AppError => {
  const error: AppError = new Error(message)
  error.statusCode = statusCode
  error.code = code
  return error
}

/**
 * Loading a document costs nothing next to a model call, so it happens first
 * and a missing id is a 404 rather than a wasted generation.
 */
const loadDocument = async (contentId: string): Promise<SourceDocument> => {
  const doc = await DocumentModel.findById(contentId).lean()
  if (!doc) {
    throw appError(404, 'Document not found')
  }

  return {
    title: doc.title,
    summary: doc.summary ?? null,
    topic: doc.topic ?? null,
    content: doc.content,
    key_notes: (doc.key_notes as Record<string, string> | undefined) ?? null,
  }
}

const createDraft = async (
  kind: DraftKind,
  sourceId: string | null,
  payload: unknown,
  createdBy: string
) => {
  const draft = await prisma.aiDraft.create({
    data: {
      kind,
      sourceId,
      // Round tripped through JSON so Date instances become the ISO strings
      // the column actually stores. CreateQuestSchema coerces them back on
      // approval, so nothing downstream has to know the difference.
      payload: JSON.parse(JSON.stringify(payload)) as Prisma.InputJsonValue,
      model: config.AI_MODEL,
      createdBy,
    },
  })

  logger.info({ draftId: draft.id, kind, sourceId }, 'AI draft created')
  return draft
}

/**
 * A whole study document, from a title and an optional brief.
 *
 * Three model calls rather than one. Asking for the body, the quiz and the
 * notes together would run past any reasonable token ceiling, and the quiz and
 * notes prompts already exist and read better against a finished body than
 * against a one line brief. The body has to come first; the other two are
 * independent of each other and run together.
 *
 * The operator owns everything with a consequence, exactly as with quests. The
 * title and the topic come from the request, because topic drives list
 * filtering and unlock gating. The model writes prose, tags and questions.
 *
 * Nothing here is fact checked. Unlike every other generator, this one has no
 * source text to be held to, so the reviewer is the only accuracy check there
 * is. That is the whole reason it produces a draft.
 */
export const generateContentDraft = async (
  input: TGenerateContent,
  createdBy: string
) => {
  const topicLabel =
    TOPIC_REGISTRY.find((topic) => topic.key === input.topic)?.label ??
    input.topic

  const article = await chatJson(
    contentPrompt(input.title, topicLabel, input.sections, input.brief),
    GeneratedArticleSchema,
    { temperature: 0.6 }
  )

  const source: SourceDocument = {
    title: input.title,
    topic: topicLabel,
    content: article.content,
  }

  const [quiz, notes] = await Promise.all([
    chatJson(quizPrompt(source, input.quizCount), GeneratedQuizSchema, {
      temperature: 0.3,
    }),
    chatJson(notesPrompt(source), GeneratedNotesSchema, { temperature: 0.4 }),
  ])

  const assembled = {
    title: input.title,
    topic: input.topic,
    content: article.content,
    facts: article.facts,
    tags: article.tags,
    quiz: quiz.quiz,
    summary: notes.summary,
    key_notes: notes.key_notes,
  }

  const parsed = GeneratedDocumentSchema.safeParse(assembled)
  if (!parsed.success) {
    logger.error(
      { issues: parsed.error.flatten() },
      'Assembled document failed validation after generation'
    )
    throw appError(
      502,
      'The generated material did not form a valid document',
      'AI_INVALID_OUTPUT'
    )
  }

  // No sourceId: this document was written from a title, not derived from
  // anything already in the collection.
  return createDraft('document', null, parsed.data, createdBy)
}

/** Quiz questions for an existing document. */
export const generateQuizDraft = async (
  contentId: string,
  count: number,
  createdBy: string
) => {
  const doc = await loadDocument(contentId)
  const generated = await chatJson(
    quizPrompt(doc, count),
    GeneratedQuizSchema,
    { temperature: 0.3 }
  )

  return createDraft('quiz', contentId, generated, createdBy)
}

/** Summary and key notes for an existing document. */
export const generateNotesDraft = async (
  contentId: string,
  createdBy: string
) => {
  const doc = await loadDocument(contentId)
  const generated = await chatJson(notesPrompt(doc), GeneratedNotesSchema, {
    temperature: 0.4,
  })

  return createDraft('key_notes', contentId, generated, createdBy)
}

/**
 * Pass mark when the owner does not set one. Sixty percent rounded up, floored
 * at one, so a three question quest passes at two and a single question quest
 * still has to be answered correctly.
 */
const defaultPassScore = (questionCount: number): number =>
  Math.max(1, Math.ceil(questionCount * 0.6))

/**
 * A quest from a document.
 *
 * The model writes the title, description and questions. Everything with a
 * consequence attached stays with the owner: the type, the gems, the window
 * and the pass mark are all taken from the request. The assembled quest is
 * then parsed by CreateQuestSchema, the same schema POST /admin/quests uses,
 * so approval cannot fail on shape.
 */
export const generateQuestDraft = async (
  input: TGenerateQuest,
  createdBy: string
) => {
  const doc = await loadDocument(input.contentId)
  const prompt = questPrompt(doc, input.type, input.questionCount)

  let title: string
  let description: string
  let questions: unknown[] = []

  // The two graded branches are written out rather than selecting a schema
  // into a variable: the fill_blank and choice question shapes have no common
  // supertype, so a ternary between them widens to a union chatJson cannot be
  // instantiated with.
  if (input.type === 'read_blog') {
    const generated = await chatJson(prompt, GeneratedQuestCopySchema, {
      temperature: 0.5,
    })
    title = generated.title
    description = generated.description
  } else if (input.type === 'fill_blank') {
    const generated = await chatJson(prompt, GeneratedFillBlankQuestSchema, {
      temperature: 0.4,
    })
    title = generated.title
    description = generated.description
    questions = generated.questions
  } else {
    const generated = await chatJson(prompt, GeneratedChoiceQuestSchema, {
      temperature: 0.4,
    })
    title = generated.title
    description = generated.description
    questions = generated.questions
  }

  // The model is asked for questionCount questions but is not trusted to have
  // returned exactly that many, and a pass mark above the count it did return
  // would make the quest impossible to complete.
  const payload =
    input.type === 'read_blog'
      ? undefined
      : {
          passScore: Math.min(
            input.passScore ?? defaultPassScore(questions.length),
            questions.length
          ),
          questions,
        }

  const assembled = {
    title,
    description,
    type: input.type,
    gems: input.gems,
    // Only read_blog carries a contentId, matching the rule in
    // CreateQuestSchema. A graded quest is self contained.
    ...(input.type === 'read_blog' ? { contentId: input.contentId } : {}),
    ...(payload ? { payload } : {}),
    active: true,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
  }

  const parsed = CreateQuestSchema.safeParse(assembled)
  if (!parsed.success) {
    logger.error(
      { issues: parsed.error.flatten() },
      'Assembled quest failed CreateQuestSchema after generation'
    )
    throw appError(
      502,
      'The generated quest did not form a valid quest',
      'AI_INVALID_OUTPUT'
    )
  }

  return createDraft('quest', input.contentId, parsed.data, createdBy)
}

/**
 * Push copy for a document or a quest.
 *
 * The draft carries the deep link target alongside the copy even though
 * nothing consumes it yet: the client registers no notification tap handler,
 * so a data payload would go nowhere. Recording it now means the drafts
 * already in the queue are usable the day that handler lands.
 */
export const generateNotificationDraft = async (
  kind: 'content' | 'quest',
  id: string,
  createdBy: string
) => {
  let subject: { title: string; summary?: string | null }

  if (kind === 'content') {
    const doc = await loadDocument(id)
    subject = { title: doc.title, summary: doc.summary }
  } else {
    const quest = await prisma.quest.findUnique({ where: { id } })
    if (!quest) {
      throw appError(404, 'Quest not found')
    }
    subject = { title: quest.title, summary: quest.description }
  }

  const generated = await chatJson(
    notificationPrompt(kind, subject),
    GeneratedNotificationSchema,
    { temperature: 0.6 }
  )

  return createDraft(
    'notification',
    id,
    { ...generated, target: { kind, id } },
    createdBy
  )
}

/**
 * True when a notification draft already exists for this subject in any state.
 *
 * The nightly job has no other dedupe record: the Notification table logs
 * broadcasts rather than subjects, so without this a restart would redraft
 * everything from the last day. Rejected drafts count, because redrafting
 * something the owner has already turned down is exactly the behaviour this
 * prevents.
 */
export const hasNotificationDraft = async (
  sourceId: string
): Promise<boolean> => {
  const existing = await prisma.aiDraft.findFirst({
    where: { kind: 'notification', sourceId },
    select: { id: true },
  })
  return existing !== null
}
