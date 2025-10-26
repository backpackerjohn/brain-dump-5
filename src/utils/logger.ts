/**
 * Structured logging utility
 * Provides consistent error logging across the application
 * Future: Can integrate with external error tracking (Sentry, LogRocket, etc.)
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Log an error with structured context
 */
export function logError(
  error: unknown,
  context: string,
  metadata?: Record<string, any>
) {
  const errorInfo = {
    level: 'error' as LogLevel,
    timestamp: new Date().toISOString(),
    context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    metadata,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  };

  console.error('[ERROR]', errorInfo);

  // Future: Send to error tracking service
  // if (import.meta.env.PROD) {
  //   sendToSentry(errorInfo);
  // }

  return errorInfo;
}

/**
 * Log a warning with context
 */
export function logWarning(
  message: string,
  context: string,
  metadata?: Record<string, any>
) {
  const warnInfo = {
    level: 'warn' as LogLevel,
    timestamp: new Date().toISOString(),
    context,
    message,
    metadata,
  };

  console.warn('[WARN]', warnInfo);

  return warnInfo;
}

/**
 * Log info message (only in development)
 */
export function logInfo(
  message: string,
  context: string,
  metadata?: Record<string, any>
) {
  if (import.meta.env.DEV) {
    const infoLog = {
      level: 'info' as LogLevel,
      timestamp: new Date().toISOString(),
      context,
      message,
      metadata,
    };

    console.log('[INFO]', infoLog);
  }
}

/**
 * Log debug message (only in development)
 */
export function logDebug(
  message: string,
  context: string,
  metadata?: Record<string, any>
) {
  if (import.meta.env.DEV) {
    const debugLog = {
      level: 'debug' as LogLevel,
      timestamp: new Date().toISOString(),
      context,
      message,
      metadata,
    };

    console.debug('[DEBUG]', debugLog);
  }
}
