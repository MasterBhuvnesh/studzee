// Dev helper for logging the raw Clerk session JWT. Commented out on
// 25-08-2026 at the owner's request; uncomment along with its button in
// app/(tabs)/profile.tsx when needed again.
//
// import { useAuth } from '@clerk/clerk-expo';
// import logger from './logger';
//
// export const useLogTokenDev = () => {
//   const { getToken } = useAuth();
//
//   const logToken = async () => {
//     if (process.env.NODE_ENV !== 'production') {
//       const token = await getToken();
//       logger.trace('Clerk JWT Token: ' + token);
//     }
//   };
//
//   return logToken;
// };
