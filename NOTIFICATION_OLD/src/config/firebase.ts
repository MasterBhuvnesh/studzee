import admin from 'firebase-admin'; // Changed from * as admin

import getServiceAccount from './serviceAccount';

// Validate required environment variables
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_PRIVATE_KEY_ID',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Get service account configuration
const serviceAccount = getServiceAccount();

// Validate service account object
if (
  !serviceAccount.project_id ||
  !serviceAccount.client_email ||
  !serviceAccount.private_key
) {
  console.error(
    'Invalid service account configuration. Check your environment variables.',
  );
  process.exit(1);
}

try {
  // Initialize Firebase Admin SDK
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    projectId: serviceAccount.project_id,
  });

  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK:', error);
  process.exit(1);
}

const db = admin.firestore();
const messaging = admin.messaging();

export { db, messaging };
export default db;
