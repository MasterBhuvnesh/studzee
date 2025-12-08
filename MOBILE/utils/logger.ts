// General-purpose logging utility with colored console output
// This module provides a simple logging utility for application-wide messages.

const reset = '\x1b[0m';

const styles = {
  info: '\x1b[48;5;27m\x1b[1;37m', // Blue background, white text
  success: '\x1b[48;5;34m\x1b[1;30m', // Green background, black text
  warn: '\x1b[48;5;220m\x1b[1;30m', // Yellow background, black text
  error: '\x1b[48;5;196m\x1b[1;37m', // Red background, white text
  debug: '\x1b[48;5;236m\x1b[1;37m', // Dark gray background, white text
  trace: '\x1b[48;5;93m\x1b[1;37m', // Purple background, white text
  fatal: '\x1b[48;5;88m\x1b[1;37m', // Dark red background, white text
  log: '\x1b[48;5;244m\x1b[1;37m', // Gray background, white text
};

const logger = {
  /**
   * Log an informational message (blue)
   */
  info: (msg: string) =>
    console.log(`${styles.info} [INFO]    ${reset} ${msg} `),

  /**
   * Log a success message (green)
   */
  success: (msg: string) =>
    console.log(`${styles.success} [SUCCESS] ${reset} ${msg} `),

  /**
   * Log a warning message (yellow)
   */
  warn: (msg: string) =>
    console.log(`${styles.warn} [WARN]    ${reset} ${msg} `),

  /**
   * Log an error message (red)
   */
  error: (msg: string) =>
    console.log(`${styles.error} [ERROR]   ${reset} ${msg} `),

  /**
   * Log a debug message (dark gray)
   */
  debug: (msg: string) =>
    console.log(`${styles.debug} [DEBUG]   ${reset} ${msg} `),

  /**
   * Log a trace message for detailed debugging (purple)
   */
  trace: (msg: string) =>
    console.log(`${styles.trace} [TRACE]   ${reset} ${msg} `),

  /**
   * Log a fatal error message (dark red)
   */
  fatal: (msg: string) =>
    console.log(`${styles.fatal} [FATAL]   ${reset} ${msg} `),

  /**
   * Log a general message (gray)
   */
  log: (msg: string) => console.log(`${styles.log} [LOG]     ${reset} ${msg} `),
};

export default logger;
