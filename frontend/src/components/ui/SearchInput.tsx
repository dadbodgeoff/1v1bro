import { type InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/helpers'

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onClear, ...props }, ref) => {
    return (
      <div className="relative group">
        {/* Search icon */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <input
          ref={ref}
          type="text"
          value={value}
          className={cn(
            'w-full pl-12 pr-10 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl',
            'text-white placeholder-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50',
            'transition-all duration-200',
            'backdrop-blur-sm',
            className
          )}
          {...props}
        />
        
        {/* Clear button */}
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {/* Glow effect on focus */}
        <div className="absolute inset-0 rounded-xl bg-indigo-500/20 opacity-0 group-focus-within:opacity-100 blur-xl transition-opacity pointer-events-none" />
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'
