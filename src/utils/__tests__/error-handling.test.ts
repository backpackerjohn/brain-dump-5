import { 
  ErrorCategory,
  categorizeError, 
  getUserFriendlyMessage,
  handleError
} from '../error-handling';

describe('categorizeError', () => {
  it('identifies authentication errors', () => {
    const error = new Error('Not authenticated');
    expect(categorizeError(error)).toBe(ErrorCategory.AUTHENTICATION);
  });

  it('identifies auth errors from message', () => {
    const error = new Error('Authorization failed');
    expect(categorizeError(error)).toBe(ErrorCategory.AUTHENTICATION);
  });

  it('identifies network errors', () => {
    const error = new Error('Network error occurred');
    expect(categorizeError(error)).toBe(ErrorCategory.NETWORK);
  });

  it('identifies validation errors', () => {
    const error = new Error('Validation failed');
    expect(categorizeError(error)).toBe(ErrorCategory.VALIDATION);
  });

  it('identifies AI service errors', () => {
    const error = new Error('Gemini API failed');
    expect(categorizeError(error)).toBe(ErrorCategory.AI_SERVICE);
  });

  it('identifies server errors', () => {
    const error = new Error('Internal server error');
    expect(categorizeError(error)).toBe(ErrorCategory.SERVER);
  });

  it('returns UNKNOWN for unrecognized errors', () => {
    const error = new Error('Something weird happened');
    expect(categorizeError(error)).toBe(ErrorCategory.UNKNOWN);
  });

  it('handles non-Error objects', () => {
    expect(categorizeError('string error')).toBe(ErrorCategory.UNKNOWN);
    expect(categorizeError(null)).toBe(ErrorCategory.UNKNOWN);
    expect(categorizeError(undefined)).toBe(ErrorCategory.UNKNOWN);
  });
});

describe('getUserFriendlyMessage', () => {
  it('returns friendly auth message', () => {
    const error = new Error('Not authenticated');
    const message = getUserFriendlyMessage(error);
    expect(message).toBe('Your session has expired. Please sign in again.');
  });

  it('returns friendly network message', () => {
    const error = new Error('Network timeout');
    const message = getUserFriendlyMessage(error);
    expect(message).toBe('Network error. Please check your connection and try again.');
  });

  it('preserves validation error messages', () => {
    const error = new Error('Invalid email format');
    const message = getUserFriendlyMessage(error);
    expect(message).toBe('Invalid email format');
  });

  it('returns friendly AI service message', () => {
    const error = new Error('Gemini API error');
    const message = getUserFriendlyMessage(error);
    expect(message).toBe('AI service temporarily unavailable. Please try again in a moment.');
  });

  it('returns generic message for unknown errors', () => {
    const error = new Error('Weird stuff');
    const message = getUserFriendlyMessage(error);
    expect(message).toBe('Something went wrong. Please try again.');
  });
});

describe('handleError', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs error to console', () => {
    const error = new Error('Test error');
    handleError(error, 'TestContext');
    expect(console.error).toHaveBeenCalled();
  });

  it('returns error details', () => {
    const error = new Error('Network error');
    const result = handleError(error);
    
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('category');
    expect(result).toHaveProperty('shouldRetry');
  });

  it('suggests retry for network errors', () => {
    const error = new Error('Network timeout');
    const result = handleError(error);
    expect(result.shouldRetry).toBe(true);
  });

  it('suggests retry for AI service errors', () => {
    const error = new Error('Gemini API failed');
    const result = handleError(error);
    expect(result.shouldRetry).toBe(true);
  });

  it('does not suggest retry for validation errors', () => {
    const error = new Error('Invalid input');
    const result = handleError(error);
    expect(result.shouldRetry).toBe(false);
  });
});
