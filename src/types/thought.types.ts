export interface Thought {
  id: string;
  user_id: string;
  content: string;
  title: string;
  snippet: string | null;
  status: 'active' | 'archived';
  is_completed: boolean;
  embedding: number[] | null;
  embedding_failed?: boolean;
  embedding_retry_count?: number;
  last_embedding_attempt?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface ThoughtCategory {
  categories: Category;
}

export interface ThoughtWithCategories extends Thought {
  thought_categories?: ThoughtCategory[];
}

export interface Cluster {
  id: string;
  name: string;
  is_manual?: boolean;
  is_collapsed?: boolean;
  created_at: string;
  updated_at?: string;
  thought_clusters?: Array<{
    thoughts: ThoughtWithCategories;
    is_completed?: boolean;
  }>;
}

export interface Connection {
  id?: string; // Database ID for persistent connections
  thought1_id: string;
  thought2_id: string;
  thought1: {
    title: string;
    categories: string[];
    is_completed: boolean;
  };
  thought2: {
    title: string;
    categories: string[];
    is_completed: boolean;
  };
  title?: string | null; // AI-generated insight title (e.g., "Opportunity: Improve Onboarding")
  description: string; // Previously "reason" - the explanation of connection
  reason?: string; // Deprecated: kept for backward compatibility, use description
  connection_type?: string | null; // 'problem_solution', 'goal_steps', 'cause_effect', 'contradiction', 'other'
  is_dismissed?: boolean; // User can dismiss unhelpful connections
  created_at?: string;
}

// Database row type for connections
export interface ConnectionRow {
  id: string;
  user_id: string;
  thought1_id: string;
  thought2_id: string;
  title: string | null;
  description: string;
  connection_type: string | null;
  is_dismissed: boolean;
  created_at: string;
}

// Metadata for tracking connection analysis
export interface ConnectionMetadata {
  user_id: string;
  last_full_analysis_at: string | null;
  thoughts_analyzed_count: number;
  last_incremental_at: string | null;
  created_at: string;
  updated_at: string;
}
