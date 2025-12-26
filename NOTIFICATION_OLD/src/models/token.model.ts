/**
 * Token model interface and types
 */

export interface Token {
  /** The Expo push token string */
  token: string;
  /** Timestamp when the token was created */
  createdAt: Date;
}

export interface CreateTokenRequest {
  /** The Expo push token to register */
  token: string;
}

export interface TokenDocument {
  /** The Expo push token string */
  token: string;
  /** Firestore server timestamp */
  createdAt: FirebaseFirestore.FieldValue;
}
