/**
 * DataTable - Reusable sortable table component
 */

import { useState, useMemo } from 'react'
import type { ReactNode } from 'react'

export interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  width?: string
  render?: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  onRowClick?: (row: T) => void
  selectedKey?: string | number
  emptyMessage?: string
  maxHeight?: string
  compact?: boolean
}

export function DataTable<T extends object>({
  columns,
  data,
  keyField,
  onRowClick,
  selectedKey,
  emptyMessage = 'No data available',
  maxHeight = '400px',
  compact = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const sortedData = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const aVal = a[sortKey as keyof T]
      const bVal = b[sortKey as keyof T]
      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      const cmp = aVal < bVal ? -1 : 1
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const cellPadding = compact ? 'py-1.5 px-2' : 'py-2 px-3'
  const headerPadding = compact ? 'pb-2 px-2' : 'pb-3 px-3'

  return (
    <div className="overflow-x-auto" style={{ maxHeight }}>
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-[#0f0f0f] z-10">
          <tr className="text-neutral-500 border-b border-white/10">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`${headerPadding} text-${col.align || 'left'} font-medium ${
                  col.sortable ? 'cursor-pointer hover:text-white select-none' : ''
                }`}
                style={{ width: col.width }}
                onClick={() => col.sortable && handleSort(String(col.key))}
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <span className="text-orange-400">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-neutral-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row) => {
              const key = row[keyField] as string | number
              const isSelected = selectedKey !== undefined && key === selectedKey
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-white/5 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${isSelected ? 'bg-orange-500/10' : 'hover:bg-white/5'}`}
                >
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={`${cellPadding} text-${col.align || 'left'}`}
                    >
                      {col.render 
                        ? col.render(row) 
                        : String(row[col.key as keyof T] ?? '—')}
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

// Pagination component
interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between pt-4 border-t border-white/10">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-1.5 bg-white/5 rounded text-sm disabled:opacity-50 hover:bg-white/10"
      >
        Previous
      </button>
      <span className="text-sm text-neutral-500">
        Page {page} of {totalPages || 1}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 bg-white/5 rounded text-sm disabled:opacity-50 hover:bg-white/10"
      >
        Next
      </button>
    </div>
  )
}
