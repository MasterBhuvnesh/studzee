/**
 * Central export point for all type definitions
 */

// Component types
export type {
  ActionCardProps,
  DownloadedCardProps,
  DownloadedItem,
  DownloadedPdfInfoProps,
  OAuthButtonsProps,
  OnboardingScreenProps,
  PdfItem,
  ProfileCardProps,
  ResourceCardProps,
  ResourceItem,
  SettingCardProps,
  SettingItem,
} from './components';

// Icon types
export type { AppIconProps } from './icon';

// Color types
export type { ColorGroup, ColorShade, ColorValue } from './colors';

// Auth types
export type { AuthError, AuthState, OAuthProvider } from './auth';

// API types
export type {
  ApiError,
  ApiSuccess,
  BadgeStatus,
  ContentBlock,
  ContentDetail,
  ContentListResponse,
  ContentSection,
  ContentSummary,
  EarnedBadge,
  KeyNotes,
  MyProgress,
  MyProgressResponse,
  NewBadge,
  PaginatedResponse,
  PaginationMeta,
  PaginationParams,
  PdfDocument,
  PdfUrlObject,
  PdfsResponse,
  ProgressLevel,
  ProgressStreak,
  Quiz,
  QuizAttemptResponse,
  QuizAttemptResult,
  QuizQuestion,
  RecentAttempt,
  Topic,
  TopicsResponse,
} from './api';

// Storage types
export type { DownloadedPdfMetadata } from './storage';

// Upcoming Profile types
export type { UpcomingProfile } from './upcoming.profile';
