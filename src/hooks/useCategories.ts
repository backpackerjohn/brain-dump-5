import { useState, useEffect } from 'react';
import { fetchCategories } from '@/integrations/supabase/queries';
import { useToast } from '@/hooks/use-toast';
import { Category } from '@/types/thought.types';
import { TOAST_MESSAGES } from '@/utils/toast-messages';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const { toast } = useToast();

  const loadCategories = async () => {
    try {
      const { data, error } = await fetchCategories();
      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast(TOAST_MESSAGES.category.fetchError(error.message));
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return {
    categories,
    fetchCategories: loadCategories
  };
}
