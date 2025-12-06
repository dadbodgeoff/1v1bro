import { cn } from '@/utils/helpers'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({ currentPage, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = []
    const showEllipsis = totalPages > 7

    if (!showEllipsis) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    // Always show first page
    pages.push(1)

    if (currentPage > 3) {
      pages.push('ellipsis')
    }

    // Show pages around current
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (!pages.includes(i)) pages.push(i)
    }

    if (currentPage < totalPages - 2) {
      pages.push('ellipsis')
    }

    // Always show last page
    if (!pages.includes(totalPages)) {
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          'p-2 rounded-lg transition-all duration-200',
          currentPage === 1
            ? 'text-slate-600 cursor-not-allowed'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
        )}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Page numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, idx) =>
          page === 'ellipsis' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-slate-500">
              •••
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                'min-w-[40px] h-10 rounded-lg font-medium transition-all duration-200',
                page === currentPage
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              )}
            >
              {page}
            </button>
          )
        )}
      </div>

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          'p-2 rounded-lg transition-all duration-200',
          currentPage === totalPages
            ? 'text-slate-600 cursor-not-allowed'
            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
        )}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
