/**
 * AccountDangerZone - Account Management Danger Zone
 * 
 * Features:
 * - Sign out button
 * - Export data button with progress
 * - Delete account with confirmation dialog
 * - "Type DELETE to confirm" validation
 * - Password re-entry requirement
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import React, { useState, useCallback } from 'react';

interface AccountDangerZoneProps {
  onSignOut: () => void;
  onExportData: () => Promise<{ status: string; message: string } | null>;
  onDeleteAccount: (password: string, confirmation: string) => Promise<boolean>;
  loading?: boolean;
}

export const AccountDangerZone: React.FC<AccountDangerZoneProps> = ({
  onSignOut,
  onExportData,
  onDeleteAccount,
  loading = false,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExportData = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await onExportData();
      if (result) {
        setExportStatus(result.message);
      } else {
        setError('Failed to request data export');
      }
    } catch (err) {
      setError('Failed to request data export');
    } finally {
      setIsProcessing(false);
    }
  }, [onExportData]);

  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmation !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }
    if (!deletePassword) {
      setError('Please enter your password');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    try {
      const success = await onDeleteAccount(deletePassword, deleteConfirmation);
      if (success) {
        setShowDeleteModal(false);
        // Redirect will happen via onSignOut or parent handling
      } else {
        setError('Failed to delete account. Please verify your password.');
      }
    } catch (err) {
      setError('Failed to delete account');
    } finally {
      setIsProcessing(false);
    }
  }, [deleteConfirmation, deletePassword, onDeleteAccount]);

  const closeModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmation('');
    setDeletePassword('');
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Sign Out */}
      <div className="py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-medium">Sign Out</h4>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Sign out of your account on this device
            </p>
          </div>
          <button
            onClick={onSignOut}
            disabled={loading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Export Data */}
      <div className="py-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-medium">Export Your Data</h4>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Download a copy of all your data
            </p>
          </div>
          <button
            onClick={handleExportData}
            disabled={isProcessing || loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Requesting...' : 'Export Data'}
          </button>
        </div>
        {exportStatus && (
          <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-400">{exportStatus}</p>
          </div>
        )}
      </div>

      {/* Delete Account */}
      <div className="py-4">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-red-400 font-medium">Delete Account</h4>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={loading}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-bg-card)] rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Delete Account</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">This action is irreversible</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[var(--color-text-secondary)]">
                Your account will be scheduled for deletion. You have 30 days to cancel before permanent removal.
              </p>

              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
                  Type <span className="text-red-400 font-mono">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-[var(--color-bg-elevated)] text-white py-2 px-3 rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
                  Enter your password
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[var(--color-bg-elevated)] text-white py-2 px-3 rounded-lg border border-gray-700 focus:border-red-500 focus:outline-none"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={closeModal}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isProcessing || deleteConfirmation !== 'DELETE' || !deletePassword}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountDangerZone;
