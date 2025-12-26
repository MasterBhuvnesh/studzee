export const getRateLimitConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    general: {
      windowMs: 15 * 60 * 1000,
      max: isProduction ? 100 : 1000,
    },
    strict: {
      windowMs: 5 * 60 * 1000,
      max: isProduction ? 10 : 50,
    },
    notification: {
      windowMs: 10 * 60 * 1000,
      max: isProduction ? 5 : 20,
    },
    tokenRegister: {
      windowMs: 15 * 60 * 1000,
      max: isProduction ? 20 : 100,
    },
  };
};
