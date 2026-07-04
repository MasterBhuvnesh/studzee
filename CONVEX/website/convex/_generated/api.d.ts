/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as authors from "../authors.js";
import type * as blogs from "../blogs.js";
import type * as chat from "../chat.js";
import type * as content_authors from "../content/authors.js";
import type * as content_devops from "../content/devops.js";
import type * as content_index from "../content/index.js";
import type * as content_systemDesign from "../content/systemDesign.js";
import type * as model_billing from "../model/billing.js";
import type * as model_embeddings from "../model/embeddings.js";
import type * as model_notifications from "../model/notifications.js";
import type * as model_users from "../model/users.js";
import type * as nim from "../nim.js";
import type * as notifications from "../notifications.js";
import type * as progress from "../progress.js";
import type * as quiz from "../quiz.js";
import type * as rag from "../rag.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  authors: typeof authors;
  blogs: typeof blogs;
  chat: typeof chat;
  "content/authors": typeof content_authors;
  "content/devops": typeof content_devops;
  "content/index": typeof content_index;
  "content/systemDesign": typeof content_systemDesign;
  "model/billing": typeof model_billing;
  "model/embeddings": typeof model_embeddings;
  "model/notifications": typeof model_notifications;
  "model/users": typeof model_users;
  nim: typeof nim;
  notifications: typeof notifications;
  progress: typeof progress;
  quiz: typeof quiz;
  rag: typeof rag;
  seed: typeof seed;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
