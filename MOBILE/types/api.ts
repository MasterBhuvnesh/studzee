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
  pdfUrl: string;
  uploadedAt: string;
}

/**
 * Response type for /pdfs endpoint
 */
export type PdfsResponse = PaginatedResponse<PdfDocument>;

/**
 * Content summary item from /content endpoint
 */
export interface ContentSummary {
  _id: string;
  id: string;
  title: string;
  summary: string;
}

/**
 * Response type for /content endpoint
 */
export type ContentListResponse = PaginatedResponse<ContentSummary>;

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
 * Full content detail from /content/:id endpoint
 */
export interface ContentDetail {
  _id: string;
  title: string;
  content: string;
  quiz: Quiz;
  facts: string;
  summary: string;
  key_notes: KeyNotes;
  imageUrl: string;
  pdfUrl: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
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
 * Pagination parameters for API requests
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}
