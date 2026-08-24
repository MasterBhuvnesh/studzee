// Notifications used to live behind the /noti prefix on a separate service.
// That service was merged into the backend, so both now share one base URL.
// The environment override lets a local backend stand in for the Render
// deployment without editing code.
const FALLBACK_BACKEND_API_URL = 'https://studzee-api-latest.onrender.com';

const EXPO_PUBLIC_BACKEND_API_URL =
  process.env.EXPO_PUBLIC_BACKEND_API_URL ?? FALLBACK_BACKEND_API_URL;

export { EXPO_PUBLIC_BACKEND_API_URL };
