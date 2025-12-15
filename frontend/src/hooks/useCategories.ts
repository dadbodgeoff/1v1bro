/**
 * useCategories - Hook for fetching trivia categories.
 * Requirements: 6.1, 8.1
 */

import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '@/utils/constants';
import { useAuthStore } from '@/stores/authStore';

export interface Category {
  slug: string;
  name: string;
  description?: string;
  icon_url?: string;
  question_count: number;
  is_active: boolean;
}

interface UseCategoriesResult {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Default categories as fallback
const DEFAULT_CATEGORIES: Category[] = [
  {
    slug: 'fortnite',
    name: 'Fortnite',
    description: 'Test your Fortnite knowledge',
    question_count: 1000,
    is_active: true,
  },
  {
    slug: 'nfl',
    name: 'NFL Football',
    description: 'NFL trivia questions',
    question_count: 900,
    is_active: true,
  },
];

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_BASE}/questions/categories`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      
      const data = await response.json();
      const cats = data.categories || [];
      setCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError('Failed to load trivia categories');
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    refetch: fetchCategories,
  };
}
