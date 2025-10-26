import { 
  sanitizeThoughtContent, 
  sanitizeCategoryName, 
  sanitizeClusterName 
} from '../sanitize';

describe('sanitizeThoughtContent', () => {
  it('strips script tags', () => {
    const result = sanitizeThoughtContent('<script>alert("xss")</script>test');
    expect(result).toBe('test');
  });

  it('strips all HTML tags', () => {
    const result = sanitizeThoughtContent('<div><p>Hello</p></div>');
    expect(result).toBe('Hello');
  });

  it('allows plain text', () => {
    const result = sanitizeThoughtContent('Hello world');
    expect(result).toBe('Hello world');
  });

  it('handles whitespace', () => {
    const result = sanitizeThoughtContent('  test  ');
    expect(result.trim()).toBe('test');
  });

  it('returns empty string for empty input', () => {
    const result = sanitizeThoughtContent('');
    expect(result).toBe('');
  });

  it('returns empty string for whitespace-only input', () => {
    const result = sanitizeThoughtContent('   ');
    expect(result.trim()).toBe('');
  });
});

describe('sanitizeCategoryName', () => {
  it('allows valid category names', () => {
    const result = sanitizeCategoryName('Technology');
    expect(result).toBe('Technology');
  });

  it('strips HTML from categories', () => {
    const result = sanitizeCategoryName('<b>Bold</b>');
    expect(result).toBe('Bold');
  });

  it('enforces 50 character limit', () => {
    const longName = 'a'.repeat(60);
    const result = sanitizeCategoryName(longName);
    expect(result).toHaveLength(50);
  });

  it('trims whitespace', () => {
    const result = sanitizeCategoryName('  test  ');
    expect(result).toBe('test');
  });

  it('returns empty string for empty input', () => {
    const result = sanitizeCategoryName('');
    expect(result).toBe('');
  });

  it('returns empty string for whitespace-only input', () => {
    const result = sanitizeCategoryName('   ');
    expect(result).toBe('');
  });
});

describe('sanitizeClusterName', () => {
  it('allows valid cluster names', () => {
    const result = sanitizeClusterName('My Cluster');
    expect(result).toBe('My Cluster');
  });

  it('strips HTML from cluster names', () => {
    const result = sanitizeClusterName('<i>Italic</i>');
    expect(result).toBe('Italic');
  });

  it('enforces 100 character limit', () => {
    const longName = 'a'.repeat(150);
    const result = sanitizeClusterName(longName);
    expect(result).toHaveLength(100);
  });

  it('trims whitespace', () => {
    const result = sanitizeClusterName('  test  ');
    expect(result).toBe('test');
  });

  it('returns empty string for empty input', () => {
    const result = sanitizeClusterName('');
    expect(result).toBe('');
  });

  it('returns empty string for whitespace-only input', () => {
    const result = sanitizeClusterName('   ');
    expect(result).toBe('');
  });
});
