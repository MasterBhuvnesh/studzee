import axios, { type AxiosError } from 'axios';

import type {
    ContentDetail,
    ContentListResponse,
    PaginationParams,
    PdfsResponse,
} from '@/types/api';
import logger from '@/utils/logger';

// Backend API configuration
const API_BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_API_URL ||
  'https://studzee-backend.onrender.com';

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
      params: { page, limit },
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
 * @param params - Optional pagination parameters (page, limit)
 * @returns Promise with paginated content list response
 */
export async function getContent(
  params: PaginationParams = {}
): Promise<ContentListResponse> {
  try {
    const { page = 1, limit = 20 } = params;
    logger.info(`Fetching content list - page: ${page}, limit: ${limit}`);

    const response = await axios.get<ContentListResponse>(
      `${API_BASE_URL}/content`,
      {
        params: { page, limit },
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
