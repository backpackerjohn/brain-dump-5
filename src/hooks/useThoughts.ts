import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  fetchThoughtsWithCategories,
  updateThoughtStatus,
  removeCategoryFromThought as removeCategoryQuery,
  updateThought as updateThoughtQuery,
  addCategoryToThought as addCategoryQuery
} from '@/integrations/supabase/queries';
import { sanitizeThoughtContent, sanitizeCategoryName } from '@/utils/sanitize';
import { useToast } from '@/hooks/use-toast';
import { ThoughtWithCategories } from '@/types/thought.types';
import { TOAST_MESSAGES } from '@/utils/toast-messages';

export function useThoughts() {
  const [thoughts, setThoughts] = useState<ThoughtWithCategories[]>([]);
  const [archivedThoughts, setArchivedThoughts] = useState<ThoughtWithCategories[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);
  const { toast } = useToast();

  const fetchThoughts = async () => {
    try {
      const { data, error } = await fetchThoughtsWithCategories('active');
      if (error) throw error;
      // Query returns ThoughtWithCategoriesResult, cast to app type
      setThoughts(data as unknown as ThoughtWithCategories[]);
    } catch (error: any) {
      toast(TOAST_MESSAGES.thought.processError(error.message));
    }
  };

  const fetchArchivedThoughts = async () => {
    setIsLoadingArchive(true);
    try {
      const { data, error } = await fetchThoughtsWithCategories('archived');
      if (error) throw error;
      // Query returns ThoughtWithCategoriesResult, cast to app type
      setArchivedThoughts(data as unknown as ThoughtWithCategories[]);
    } catch (error: any) {
      toast(TOAST_MESSAGES.thought.processError(error.message));
    } finally {
      setIsLoadingArchive(false);
    }
  };

  const processThought = async (content: string) => {
    try {
      // Sanitize input before sending to AI
      const sanitizedContent = sanitizeThoughtContent(content);
      
      if (!sanitizedContent.trim()) {
        toast(TOAST_MESSAGES.thought.processError('Content cannot be empty'));
        throw new Error('Content cannot be empty');
      }

      const { data, error } = await supabase.functions.invoke('process-thought', {
        body: { content: sanitizedContent }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      const thoughtCount = data?.thoughts?.length || 0;
      toast(TOAST_MESSAGES.thought.processed(thoughtCount));

      await fetchThoughts();
      return data.thoughts;
    } catch (error: any) {
      console.error('Error processing thought:', error);

      let errorMessage = error.message || 'Failed to process thought';

      if (error.message?.includes('authenticated') || error.message?.includes('authorization')) {
        errorMessage = 'Your session has expired. Please sign in again.';
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection.';
      }

      toast(TOAST_MESSAGES.thought.processError(errorMessage));
      throw error;
    }
  };


  const archiveThought = async (thoughtId: string) => {
    try {
      const { error } = await updateThoughtStatus(thoughtId, 'archived');
      if (error) throw error;
      toast(TOAST_MESSAGES.thought.archived);
      await fetchThoughts();
    } catch (error: any) {
      toast(TOAST_MESSAGES.thought.archiveError(error.message));
    }
  };

  const restoreThought = async (thoughtId: string) => {
    try {
      const { error } = await updateThoughtStatus(thoughtId, 'active');
      if (error) throw error;
      toast(TOAST_MESSAGES.thought.restored);
      await Promise.all([fetchThoughts(), fetchArchivedThoughts()]);
    } catch (error: any) {
      toast(TOAST_MESSAGES.thought.restoreError(error.message));
    }
  };

  const removeCategoryFromThought = async (thoughtId: string, categoryId: string) => {
    try {
      const { error } = await removeCategoryQuery(thoughtId, categoryId);
      if (error) throw error;
      toast(TOAST_MESSAGES.category.removed);
      await fetchThoughts();
    } catch (error: any) {
      toast(TOAST_MESSAGES.category.removeError(error.message));
    }
  };

  const toggleThoughtCompletion = async (thoughtId: string) => {
    try {
      const thought = thoughts.find(t => t.id === thoughtId);
      if (!thought) throw new Error('Thought not found');
      
      const newCompletionState = !thought.is_completed;
      
      const { error } = await updateThoughtQuery(thoughtId, { 
        is_completed: newCompletionState 
      });

      if (error) throw error;
      
      toast(newCompletionState 
        ? TOAST_MESSAGES.thought.completed 
        : TOAST_MESSAGES.thought.uncompleted
      );
      
      await fetchThoughts();
      return newCompletionState;
    } catch (error: any) {
      toast(TOAST_MESSAGES.thought.updateError(error.message));
      throw error;
    }
  };

  const updateThought = async (
    thoughtId: string, 
    updates: { title?: string; snippet?: string | null }
  ) => {
    try {
      // Sanitize all text inputs
      const sanitizedUpdates = {
        ...(updates.title && { title: sanitizeThoughtContent(updates.title) }),
        ...(updates.snippet && { snippet: sanitizeThoughtContent(updates.snippet) })
      };

      const { error } = await updateThoughtQuery(thoughtId, sanitizedUpdates);
      if (error) throw error;
      
      toast(TOAST_MESSAGES.thought.updated);
      await fetchThoughts();
    } catch (error: any) {
      toast(TOAST_MESSAGES.thought.updateError(error.message));
      throw error;
    }
  };

  const addCategoryToThought = async (
    thoughtId: string,
    categoryName: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Sanitize category name
      const sanitizedName = sanitizeCategoryName(categoryName);
      
      if (!sanitizedName) {
        toast(TOAST_MESSAGES.category.addError('Category name cannot be empty'));
        throw new Error('Category name cannot be empty');
      }

      const { error } = await addCategoryQuery(thoughtId, sanitizedName, user.id);
      if (error) throw error;
      
      toast(TOAST_MESSAGES.category.added);
      await fetchThoughts();
    } catch (error: any) {
      toast(TOAST_MESSAGES.category.addError(error.message));
      throw error;
    }
  };

  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await fetchThoughts();
      setIsLoading(false);
    };

    initialize();

    const thoughtsChannel = supabase
      .channel('thoughts-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'thoughts' },
        () => fetchThoughts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(thoughtsChannel);
    };
  }, []);

  return {
    thoughts,
    archivedThoughts,
    isLoading,
    isLoadingArchive,
    processThought,
    archiveThought,
    restoreThought,
    removeCategoryFromThought,
    toggleThoughtCompletion,
    updateThought,
    addCategoryToThought,
    fetchArchivedThoughts
  };
}
