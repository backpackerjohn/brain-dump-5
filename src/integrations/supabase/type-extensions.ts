/**
 * Type extensions for Supabase auto-generated types
 * 
 * This file extends the auto-generated types from ./types.ts with fields
 * that exist in the database but are missing from the generated types.
 * 
 * TODO: Regenerate Supabase types when CLI is available to eliminate this file
 */

import { Tables } from './types';

/**
 * Extended Thought type with is_completed field
 * Database has this field but auto-generated types don't include it
 */
export type ThoughtRow = Tables<'thoughts'> & {
  is_completed: boolean;
};

/**
 * Insert type for thoughts (excludes auto-generated fields)
 */
export type ThoughtInsert = Omit<ThoughtRow, 'id' | 'created_at'>;

/**
 * Update type for thoughts (all fields optional except identifiers)
 */
export type ThoughtUpdate = Partial<Omit<ThoughtRow, 'id' | 'user_id' | 'created_at'>>;

/**
 * Extended types for other tables (add as needed)
 */
export type ClusterRow = Tables<'clusters'>;
export type CategoryRow = Tables<'categories'>;
export type ThoughtClusterRow = Tables<'thought_clusters'>;
export type ThoughtCategoryRow = Tables<'thought_categories'>;
