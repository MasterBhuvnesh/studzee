import axios, { type AxiosError } from 'axios';

import type {
  ContentDetail,
  ContentListResponse,
  MyProgress,
  MyProgressResponse,
  PaginationParams,
  PdfsResponse,
  QuizAttemptResponse,
  QuizAttemptResult,
  TodayContentResponse,
  Topic,
  TopicsResponse,
} from '@/types/api';
import { EXPO_PUBLIC_BACKEND_API_URL } from '@/utils/config';
import logger from '@/utils/logger';

// Backend API configuration
const API_BASE_URL = EXPO_PUBLIC_BACKEND_API_URL;

/**
 * Fetches the list of PDF documents with pagination support
 * @param params - Optional pagination parameters (page, limit)
 * @returns Promise with paginated PDF list response
 */
export async function getPdfs(
  params: PaginationParams = {}
): Promise<PdfsResponse> {
  try {
    const { page = 1, limit = 20 } = params;
    logger.info(`Fetching PDFs - page: ${page}, limit: ${limit}`);

    const response = await axios.get<PdfsResponse>(`${API_BASE_URL}/pdfs`, {
      params: {
        page,
        limit,
        sort: 'uploadedAt',
        order: 'desc',
      },
      timeout: 10000, // 10 second timeout
    });

    logger.success(
      `PDFs fetched successfully - ${response.data.data.length} items`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message || axiosError.message;

      logger.error(
        `Failed to fetch PDFs - Status: ${axiosError.response?.status}, Message: ${errorMessage}`
      );

      throw new Error(errorMessage || 'Failed to fetch PDFs');
    }

    logger.error(`Unexpected error fetching PDFs: ${error}`);
    throw error;
  }
}

/**
 * Fetches the list of content summaries with pagination support
 * @param params - Optional pagination parameters (page, limit) and a topic key
 * @returns Promise with paginated content list response
 */
export async function getContent(
  params: PaginationParams & { topic?: string } = {}
): Promise<ContentListResponse> {
  try {
    const { page = 1, limit = 20, topic } = params;
    logger.info(
      `Fetching content list - page: ${page}, limit: ${limit}${topic ? `, topic: ${topic}` : ''}`
    );

    const response = await axios.get<ContentListResponse>(
      `${API_BASE_URL}/content`,
      {
        // The backend rejects unknown topic keys with a 400, so only send
        // the parameter when the caller actually has one.
        params: topic ? { page, limit, topic } : { page, limit },
        timeout: 10000, // 10 second timeout
      }
    );

    logger.success(
      `Content list fetched successfully - ${response.data.data.length} items`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message || axiosError.message;

      logger.error(
        `Failed to fetch content list - Status: ${axiosError.response?.status}, Message: ${errorMessage}`
      );

      throw new Error(errorMessage || 'Failed to fetch content list');
    }

    logger.error(`Unexpected error fetching content list: ${error}`);
    throw error;
  }
}

/**
 * Fetches detailed content by ID (requires authentication)
 * @param id - Content ID to fetch
 * @param authToken - Bearer authentication token from Clerk
 * @returns Promise with full content detail
 */
export async function getContentById(
  id: string,
  authToken: string
): Promise<ContentDetail> {
  try {
    logger.info(`Fetching content detail for ID: ${id}`);

    const response = await axios.get<ContentDetail>(
      `${API_BASE_URL}/content/${id}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        timeout: 10000, // 10 second timeout
      }
    );

    logger.success(`Content detail fetched successfully for ID: ${id}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message || axiosError.message;

      logger.error(
        `Failed to fetch content detail - Status: ${axiosError.response?.status}, Message: ${errorMessage}`
      );

      // Handle specific error codes
      if (axiosError.response?.status === 401) {
        throw new Error('Authentication required. Please sign in.');
      } else if (axiosError.response?.status === 404) {
        throw new Error('Content not found');
      }

      throw new Error(errorMessage || 'Failed to fetch content detail');
    }

    logger.error(`Unexpected error fetching content detail: ${error}`);
    throw error;
  }
}

/**
 * Fetches the fixed topic registry (public endpoint)
 * @returns Promise with every registry entry in display order
 */
export async function getTopics(): Promise<Topic[]> {
  try {
    logger.info('Fetching topic registry');

    const response = await axios.get<TopicsResponse>(
      `${API_BASE_URL}/content/topics`,
      {
        timeout: 10000, // 10 second timeout
      }
    );

    logger.success(
      `Topic registry fetched successfully - ${response.data.data.length} topics`
    );
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message || axiosError.message;

      logger.error(`Failed to fetch topics - Message: ${errorMessage}`);
      throw new Error(errorMessage || 'Failed to fetch topics');
    }

    logger.error(`Unexpected error fetching topics: ${error}`);
    throw error;
  }
}

/**
 * Fetches today's featured content (public endpoint)
 * @returns Promise with today's content response
 */
export async function getTodayContent(): Promise<TodayContentResponse> {
  try {
    logger.info(`Fetching today's content`);

    const response = await axios.get<TodayContentResponse>(
      `${API_BASE_URL}/content/today`,
      {
        timeout: 10000, // 10 second timeout
      }
    );

    logger.success(
      `Today's content fetched successfully - ${response.data.data.length} item(s)`
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message || axiosError.message;

      logger.error(
        `Failed to fetch today's content - Status: ${axiosError.response?.status}, Message: ${errorMessage}`
      );

      throw new Error(errorMessage || "Failed to fetch today's content");
    }

    logger.error(`Unexpected error fetching today's content: ${error}`);
    throw error;
  }
}

/**
 * Fetches the signed-in user's gamification progress (requires authentication)
 * @param authToken - Bearer authentication token from Clerk
 * @returns Promise with points, level, streak, badges and recent attempts
 */
export async function getMyProgress(authToken: string): Promise<MyProgress> {
  try {
    logger.info('Fetching user progress');

    const response = await axios.get<MyProgressResponse>(
      `${API_BASE_URL}/progress/me`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        timeout: 10000, // 10 second timeout
      }
    );

    logger.success(
      `User progress fetched successfully - ${response.data.data.points} points`
    );
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message || axiosError.message;

      logger.error(
        `Failed to fetch user progress - Status: ${axiosError.response?.status}, Message: ${errorMessage}`
      );

      if (axiosError.response?.status === 401) {
        throw new Error('Authentication required. Please sign in.');
      }

      throw new Error(errorMessage || 'Failed to fetch progress');
    }

    logger.error(`Unexpected error fetching user progress: ${error}`);
    throw error;
  }
}

/**
 * Submits a completed quiz attempt so points, streak and badges update
 * (requires authentication)
 * @param authToken - Bearer authentication token from Clerk
 * @param contentId - Content document the quiz belongs to
 * @param responses - Quiz question key mapped to the chosen option index
 * @returns Promise with score, points awarded, updated streak and new badges
 */
export async function submitQuizAttempt(
  authToken: string,
  contentId: string,
  responses: Record<string, number>
): Promise<QuizAttemptResult> {
  try {
    logger.info(`Submitting quiz attempt for content ID: ${contentId}`);

    const response = await axios.post<QuizAttemptResponse>(
      `${API_BASE_URL}/progress/attempts`,
      { contentId, responses },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        timeout: 10000, // 10 second timeout
      }
    );

    logger.success(
      `Quiz attempt submitted successfully - awarded ${response.data.data.pointsAwarded} points`
    );
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosError.response?.data?.message || axiosError.message;

      logger.error(
        `Failed to submit quiz attempt - Status: ${axiosError.response?.status}, Message: ${errorMessage}`
      );

      if (axiosError.response?.status === 401) {
        throw new Error('Authentication required. Please sign in.');
      } else if (axiosError.response?.status === 400) {
        throw new Error(errorMessage || 'Invalid quiz attempt');
      } else if (axiosError.response?.status === 404) {
        throw new Error('Content not found');
      }

      throw new Error(errorMessage || 'Failed to submit quiz attempt');
    }

    logger.error(`Unexpected error submitting quiz attempt: ${error}`);
    throw error;
  }
}
