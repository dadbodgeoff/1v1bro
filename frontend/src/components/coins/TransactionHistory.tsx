/**
 * TransactionHistory - Display transaction list.
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../../stores/authStore';
import type { CoinTransaction, TransactionListResponse } from '../../types/coin';
import { formatCoins, getSourceDisplayName } from '../../types/coin';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface TransactionHistoryProps {
  className?: string;
}

export function TransactionHistory({ className = '' }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((s) => s.token);
  const pageSize = 20;

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/coins/transactions?page=${page}&page_size=${pageSize}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      const result: TransactionListResponse = data.data || data;
      setTransactions(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, token]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);


  const totalPages = Math.ceil(total / pageSize);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && transactions.length === 0) {
    return (
      <div className={`space-y-3 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-[var(--color-bg-card)] rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchTransactions}
          className="px-4 py-2 bg-[var(--color-bg-elevated)] rounded-lg hover:bg-[var(--color-bg-card)]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-bg-elevated)] flex items-center justify-center">
          <svg className="w-8 h-8 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-[var(--color-text-secondary)]">No transactions yet</p>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Purchase coins to see your history here</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-2">
        {transactions.map((tx) => (
          <div key={tx.id} className="flex items-center justify-between p-4 bg-[var(--color-bg-card)] rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === 'credit' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                {tx.type === 'credit' ? (
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-medium text-white">{getSourceDisplayName(tx.source)}</p>
                <p className="text-sm text-[var(--color-text-secondary)]">{formatDate(tx.created_at)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-bold ${tx.type === 'credit' ? 'text-emerald-400' : 'text-red-400'}`}>
                {tx.type === 'credit' ? '+' : '-'}{formatCoins(tx.amount)}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">Balance: {formatCoins(tx.balance_after)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded bg-[var(--color-bg-elevated)] disabled:opacity-50">Prev</button>
          <span className="px-3 py-1 text-[var(--color-text-secondary)]">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded bg-[var(--color-bg-elevated)] disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}