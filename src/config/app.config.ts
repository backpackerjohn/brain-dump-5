/**
 * Application configuration
 * Centralizes magic numbers and configurable thresholds
 */

export const APP_CONFIG = {
  /**
   * Thought processing configuration
   */
  thoughts: {
    /**
     * Maximum length for thought titles
     */
    maxTitleLength: 200,
    
    /**
     * Maximum length for thought snippets
     */
    maxSnippetLength: 500,
    
    /**
     * Maximum number of thoughts to display in a single view
     */
    maxDisplayCount: 100,
  },

  /**
   * Clustering configuration
   */
  clustering: {
    /**
     * Minimum number of unclustered thoughts required to generate new clusters
     */
    minThoughtsForClustering: 10,
    
    /**
     * Maximum number of thoughts to analyze for clustering at once
     */
    maxThoughtsForClustering: 50,
    
    /**
     * Maximum number of thoughts to analyze for connections
     */
    maxThoughtsForConnections: 20,
    
    /**
     * Maximum number of connections to display
     */
    maxConnectionsToShow: 10,
  },

  /**
   * Category configuration
   */
  categories: {
    /**
     * Maximum length for category names
     */
    maxNameLength: 50,
    
    /**
     * Maximum number of categories to suggest at once
     */
    maxSuggestionsCount: 5,
  },

  /**
   * Cluster configuration
   */
  clusters: {
    /**
     * Maximum length for cluster names
     */
    maxNameLength: 100,
  },

  /**
   * AI/Edge Function configuration
   */
  ai: {
    /**
     * Timeout for AI operations in milliseconds
     */
    defaultTimeout: 30000, // 30 seconds
    
    /**
     * Maximum retries for failed AI operations
     */
    maxRetries: 2,
  },

  /**
   * UI configuration
   */
  ui: {
    /**
     * Toast notification duration in milliseconds
     */
    toastDuration: 3000,
    
    /**
     * Debounce time for search/filter inputs
     */
    searchDebounceMs: 300,
  },
} as const;

/**
 * Feature flags for gradual rollout of new features
 */
export const FEATURE_FLAGS = {
  /**
   * Enable AI-powered connection discovery
   */
  enableConnections: true,
  
  /**
   * Enable automatic clustering
   */
  enableAutoClustering: true,
  
  /**
   * Enable category suggestions
   */
  enableCategorySuggestions: true,
  
  /**
   * Refactor feature flags (toggle during A-grade refactor)
   */
  useEnhancedErrorHandling: false,
  useRateLimiting: false,
  useImprovedTypes: false,
  useEnhancedLoading: false,
} as const;
