const log = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[LOG]:', ...args);
  }
};

const error = (...args: any[]) => {
  console.error('[ERROR]:', ...args);
};

const warn = (...args: any[]) => {
  console.warn('[WARN]:', ...args);
};
export const logger = { log, error, warn };
