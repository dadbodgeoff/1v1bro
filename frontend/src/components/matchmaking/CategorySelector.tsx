/**
 * CategorySelector - Category selection for matchmaking.
 * Requirements: 8.1, 8.2, 8.3
 */

import { motion } from 'framer-motion';
import type { Category } from '@/hooks/useCategories';

interface CategorySelectorProps {
  selectedCategory: string;
  onSelect: (category: string) => void;
  categories: Category[];
  disabled?: boolean;
  isLoading?: boolean;
}

// Default category icons (fallback if no icon_url)
const categoryIcons: Record<string, string> = {
  fortnite: '🎮',
  nfl: '🏈',
};

export function CategorySelector({
  selectedCategory,
  onSelect,
  categories,
  disabled = false,
  isLoading = false,
}: CategorySelectorProps) {
  if (isLoading) {
    return (
      <div className="w-full">
        <h4 className="text-xs font-medium text-neutral-500 mb-2">Select Category</h4>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-white/[0.04] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h4 className="text-xs font-medium text-neutral-500 mb-2">Select Category</h4>
      <div className="grid grid-cols-2 gap-2">
        {categories.map((category) => {
          const isSelected = selectedCategory === category.slug;
          const icon = category.icon_url || categoryIcons[category.slug] || '❓';

          return (
            <motion.button
              key={category.slug}
              onClick={() => !disabled && onSelect(category.slug)}
              disabled={disabled}
              whileHover={!disabled ? { scale: 1.02 } : undefined}
              whileTap={!disabled ? { scale: 0.98 } : undefined}
              className={`
                relative p-3 min-h-[44px] rounded-lg border transition-all duration-200 text-left
                ${isSelected
                  ? 'border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10'
                  : 'border-white/[0.08] bg-white/[0.04] hover:border-white/[0.15]'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1.5 right-1.5 w-4 h-4 bg-[var(--color-accent-primary)] rounded-full flex items-center justify-center"
                >
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </motion.div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-xl">{icon}</span>
                <div>
                  <h5 className={`text-sm font-medium ${isSelected ? 'text-[var(--color-accent-primary)]' : 'text-white'}`}>
                    {category.name}
                  </h5>
                  <p className="text-[10px] text-neutral-500">
                    {category.question_count.toLocaleString()} questions
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default CategorySelector;
