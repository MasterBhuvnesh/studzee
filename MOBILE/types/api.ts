/**
 * API type definitions for Studzee backend
 * Base URL: https://studzee-backend.onrender.com
 */

/**
 * Pagination metadata returned with list endpoints
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * PDF document item from /pdfs endpoint
 */
export interface PdfDocument {
  documentId: string;
  title: string;
  pdfName: string;
  pdfUrl: string;
  uploadedAt: string;
  size: number;
}

/**
 * Response type for /pdfs endpoint
 */
export type PdfsResponse = PaginatedResponse<PdfDocument>;

/**
 * PDF URL object structure in content detail
 */
export interface PdfUrlObject {
  name: string;
  url: string;
  uploadedAt: string;
  size: number;
}

/**
 * Content summary item from /content endpoint
 */
export interface ContentSummary {
  _id: string;
  id: string;
  title: string;
  summary: string;
  createdAt: string;
  /** Registry key of the subject area, present since the backend projects it */
  topic: string;
  /** Freeform tags, two to five per document, projected on the list endpoint */
  tags: string[];
}

/**
 * Entry of the fixed topic registry served by /content/topics
 */
export interface Topic {
  key: string;
  label: string;
}

/**
 * Question in a quest payload, sanitized by the backend: no answers
 */
export interface QuestQuestion {
  key: string;
  que: string;
  options?: string[];
}

/**
 * Quest from /quests, in window for the caller
 */
export interface QuestSummary {
  id: string;
  title: string;
  description: string;
  /** mcq | scq | fill_blank | read_blog */
  type: string;
  gems: number;
  contentId: string | null;
  passScore: number;
  questions: QuestQuestion[];
  startsAt: string;
  endsAt: string;
  completed: boolean;
}

/**
 * Response type for /quests endpoint
 */
export interface QuestsResponse {
  success: boolean;
  data: QuestSummary[];
}

/**
 * Result of POST /quests/:id/complete
 */
export interface QuestCompletionResult {
  alreadyCompleted?: boolean;
  passed?: boolean;
  score?: number;
  total?: number;
  gemsAwarded?: number;
}

/**
 * Active day map for one year, the data behind the streak heatmap
 */
export interface MyActivity {
  year: number;
  /** UTC day keys with activity, ascending, YYYY-MM-DD */
  activeDays: string[];
  totalActive: number;
}

export type MyActivityResponse = ApiSuccess<MyActivity>;

/**
 * Response type for /content/topics endpoint
 */
export interface TopicsResponse {
  data: Topic[];
}

/**
 * Response type for /content endpoint
 */
export type ContentListResponse = PaginatedResponse<ContentSummary>;

/**
 * Metadata for today's content endpoint
 */
export interface TodayContentMeta {
  date: string;
  total: number;
}

/**
 * Response type for /content/today endpoint
 */
export interface TodayContentResponse {
  data: ContentSummary[];
  meta: TodayContentMeta;
}

/**
 * Quiz question structure in content detail
 */
export interface QuizQuestion {
  que: string;
  ans: string;
  options: string[];
}

/**
 * Quiz object with numbered questions
 */
export interface Quiz {
  [key: string]: QuizQuestion;
}

/**
 * Key notes structure in content detail
 */
export interface KeyNotes {
  [key: string]: string;
}

/**
 * Structured content block types for rich lesson rendering
 */
export type ContentBlock =
  | { type: 'text'; value: string }
  | { type: 'list'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'formula'; value: string }
  | { type: 'code'; value: string };

/**
 * Content section wrapper returned by backend
 */
export interface ContentSection {
  title: string;
  content: ContentBlock[];
}

/**
 * Full content detail from /content/:id endpoint
 */
export interface ContentDetail {
  _id: string;
  title: string;
  content: ContentSection[];
  quiz: Quiz;
  facts: string;
  summary: string;
  key_notes: KeyNotes;
  imageUrl: string;
  pdfUrl: PdfUrlObject[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  /** Freeform tags, two to five per document */
  tags: string[];
}

/**
 * API Error response structure
 */
export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

/**
 * Success envelope used by the gamification endpoints
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

/**
 * Level descriptor in progress responses
 */
export interface ProgressLevel {
  key: string;
  label: string;
  minPoints: number;
  /** Remote artwork; absent entries fall back to the bundled placeholder */
  imageUrl?: string;
}

/**
 * Streak counters returned by the progress endpoints
 */
export interface ProgressStreak {
  current: number;
  longest: number;
}

/**
 * Awarded badge entry from /progress/me
 */
export interface EarnedBadge {
  key: string;
  label: string;
  description: string;
  awardedAt: string;
}

/**
 * Badge entry with its award state from /progress/me allBadges
 */
export interface BadgeStatus {
  key: string;
  label: string;
  description: string;
  threshold: number;
  awarded: boolean;
  /** Remote artwork; absent entries fall back to the bundled placeholder */
  imageUrl?: string;
}

/**
 * Recent quiz attempt row from /progress/me
 */
export interface RecentAttempt {
  contentId: string;
  title: string;
  score: number;
  total: number;
  createdAt: string;
}

/**
 * Payload inside GET /progress/me responses
 */
export interface MyProgress {
  points: number;
  level: ProgressLevel | null;
  nextLevel: ProgressLevel | null;
  streak: ProgressStreak;
  activeDays: number;
  badges: EarnedBadge[];
  allBadges: BadgeStatus[];
  /** The whole level ladder, ascending. The current rung is `level`. */
  allLevels: ProgressLevel[];
  recentAttempts: RecentAttempt[];
}

/**
 * Full GET /progress/me response
 */
export type MyProgressResponse = ApiSuccess<MyProgress>;

/**
 * Newly unlocked badge in a quiz attempt response
 */
export interface NewBadge {
  key: string;
  label: string;
  description: string;
}

/**
 * Payload inside POST /progress/attempts responses
 */
export interface QuizAttemptResult {
  contentId: string;
  score: number;
  total: number;
  pointsAwarded: number;
  totalPoints: number;
  streak: ProgressStreak;
  newBadges: NewBadge[];
}

/**
 * Full POST /progress/attempts response
 */
export type QuizAttemptResponse = ApiSuccess<QuizAttemptResult>;

/**
 * Pagination parameters for API requests
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}
