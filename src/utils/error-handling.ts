/**
 * Centralized error handling utilities
 * Provides consistent error handling and user-friendly error messages
 */

/**
 * Error categories for better error handling
 */
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  NETWORK = 'network',
  VALIDATION = 'validation',
  SERVER = 'server',
  AI_SERVICE = 'ai_service',
  UNKNOWN = 'unknown',
}

/**
 * Categorize an error based on its message and properties
 */
export function categorizeError(error: unknown): ErrorCategory {
  if (!(error instanceof Error)) {
    return ErrorCategory.UNKNOWN;
  }

  const message = error.message.toLowerCase();

  // Authentication errors
  if (message.includes('authenticated') || 
      message.includes('authorization') || 
      message.includes('auth') ||
      message.includes('not authenticated')) {
    return ErrorCategory.AUTHENTICATION;
  }

  // Network errors
  if (message.includes('network') || 
      message.includes('fetch') || 
      message.includes('connection') ||
      message.includes('timeout')) {
    return ErrorCategory.NETWORK;
  }

  // Validation errors
  if (message.includes('validation') || 
      message.includes('invalid') || 
      message.includes('required') ||
      message.includes('cannot be empty')) {
    return ErrorCategory.VALIDATION;
  }

  // AI Service errors
  if (message.includes('gemini') || 
      message.includes('api_key') ||
      message.includes('ai')) {
    return ErrorCategory.AI_SERVICE;
  }

  // Server errors
  if (message.includes('server') || 
      message.includes('internal') ||
      message.includes('database')) {
    return ErrorCategory.SERVER;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Get a user-friendly error message based on the error category
 */
export function getUserFriendlyMessage(error: unknown): string {
  const category = categorizeError(error);
  const originalMessage = error instanceof Error ? error.message : 'An error occurred';

  switch (category) {
    case ErrorCategory.AUTHENTICATION:
      return 'Your session has expired. Please sign in again.';
    
    case ErrorCategory.NETWORK:
      return 'Network error. Please check your connection and try again.';
    
    case ErrorCategory.VALIDATION:
      // For validation errors, use the original message as it's usually specific
      return originalMessage;
    
    case ErrorCategory.AI_SERVICE:
      return 'AI service temporarily unavailable. Please try again in a moment.';
    
    case ErrorCategory.SERVER:
      return 'Server error. Our team has been notified. Please try again later.';
    
    case ErrorCategory.UNKNOWN:
    default:
      return 'Something went wrong. Please try again.';
  }
}

/**
 * Standard error handler for async operations
 * Logs the error and returns a user-friendly message
 */
export function handleError(error: unknown, context?: string): {
  message: string;
  category: ErrorCategory;
  shouldRetry: boolean;
} {
  // Log the error for debugging
  if (context) {
    console.error(`[${context}] Error:`, error);
  } else {
    console.error('Error:', error);
  }

  // Log stack trace if available
  if (error instanceof Error && error.stack) {
    console.error('Stack:', error.stack);
  }

  const category = categorizeError(error);
  const message = getUserFriendlyMessage(error);

  // Determine if operation should be retried
  const shouldRetry = category === ErrorCategory.NETWORK || 
                      category === ErrorCategory.AI_SERVICE ||
                      category === ErrorCategory.SERVER;

  return {
    message,
    category,
    shouldRetry,
  };
}

/**
 * Wrap an async function with error handling
 * Useful for consistent error handling across operations
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      const { message, category } = handleError(error, context);
      
      // Re-throw with enhanced error information
      const enhancedError = new Error(message);
      (enhancedError as any).originalError = error;
      (enhancedError as any).category = category;
      (enhancedError as any).context = context;
      
      throw enhancedError;
    }
  };
}
