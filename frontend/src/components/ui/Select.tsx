/**
 * Select Component - 2025 Design System
 * Requirements: 2.7
 */

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { cn } from '@/utils/helpers'

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  options: SelectOption[]
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  className?: string
  renderOption?: (option: SelectOption) => ReactNode
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  className,
  renderOption,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (isOpen && highlightedIndex >= 0) {
          const option = options[highlightedIndex]
          if (!option.disabled) {
            onChange(option.value)
            setIsOpen(false)
          }
        } else {
          setIsOpen(true)
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex((prev) =>
            prev < options.length - 1 ? prev + 1 : 0
          )
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : options.length - 1
          )
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement
      item?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex, isOpen])

  return (
    <div className={cn('w-full', className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-[#a3a3a3] mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Trigger */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            'w-full h-10 px-4 bg-[#111111] border rounded-lg text-left',
            'flex items-center justify-between gap-2',
            'transition-all duration-200',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1]',
            error
              ? 'border-[#f43f5e]'
              : 'border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)]',
            disabled && 'opacity-50 cursor-not-allowed',
            isOpen && 'ring-2 ring-[#6366f1] border-transparent'
          )}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={selectedOption ? 'text-white' : 'text-[#737373]'}>
            {selectedOption?.label || placeholder}
          </span>
          <svg
            className={cn(
              'w-4 h-4 text-[#737373] transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <ul
            ref={listRef}
            role="listbox"
            className={cn(
              'absolute z-[100] w-full mt-1 py-1 bg-[#1a1a1a] border border-[rgba(255,255,255,0.1)] rounded-lg shadow-xl',
              'max-h-60 overflow-auto',
              'animate-[fadeIn_150ms_ease-out]'
            )}
          >
            {options.map((option, index) => (
              <li
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  if (!option.disabled) {
                    onChange(option.value)
                    setIsOpen(false)
                  }
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={cn(
                  'px-4 py-2 cursor-pointer flex items-center justify-between',
                  'transition-colors duration-100',
                  option.disabled
                    ? 'text-[#525252] cursor-not-allowed'
                    : highlightedIndex === index
                    ? 'bg-white/5 text-white'
                    : 'text-[#a3a3a3] hover:bg-white/5 hover:text-white',
                  option.value === value && 'text-white'
                )}
              >
                {renderOption ? renderOption(option) : option.label}
                {option.value === value && (
                  <svg
                    className="w-4 h-4 text-[#6366f1]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="mt-1.5 text-sm text-[#f43f5e]">{error}</p>}
    </div>
  )
}
