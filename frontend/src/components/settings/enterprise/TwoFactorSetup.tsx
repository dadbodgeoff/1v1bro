/**
 * TwoFactorSetup - 2FA Setup Wizard Component
 * 
 * Features:
 * - QR code display for authenticator apps
 * - Manual entry code fallback
 * - Verification code input
 * - Recovery codes display
 * - Disable 2FA flow
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import React, { useState, useCallback } from 'react';

interface TwoFactorSetupProps {
  isEnabled: boolean;
  onEnable: () => Promise<{ secret: string; qr_code_url: string; recovery_codes: string[] } | null>;
  onVerify: (code: string) => Promise<boolean>;
  onDisable: (code: string) => Promise<boolean>;
  loading?: boolean;
}

type SetupStep = 'idle' | 'setup' | 'verify' | 'recovery' | 'disable';

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  isEnabled,
  onEnable,
  onVerify,
  onDisable,
  loading = false,
}) => {
  const [step, setStep] = useState<SetupStep>('idle');
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartSetup = useCallback(async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await onEnable();
      if (result) {
        setSecret(result.secret);
        setQrCodeUrl(result.qr_code_url);
        setRecoveryCodes(result.recovery_codes);
        setStep('setup');
      } else {
        setError('Failed to start 2FA setup');
      }
    } catch (_err) {
      setError('Failed to start 2FA setup');
    } finally {
      setIsProcessing(false);
    }
  }, [onEnable]);

  const handleVerify = useCallback(async () => {
    if (verifyCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const success = await onVerify(verifyCode);
      if (success) {
        setStep('recovery');
      } else {
        setError('Invalid verification code');
      }
    } catch (_err) {
      setError('Verification failed');
    } finally {
      setIsProcessing(false);
    }
  }, [verifyCode, onVerify]);

  const handleDisable = useCallback(async () => {
    if (disableCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const success = await onDisable(disableCode);
      if (success) {
        setStep('idle');
        setDisableCode('');
      } else {
        setError('Invalid code');
      }
    } catch (_err) {
      setError('Failed to disable 2FA');
    } finally {
      setIsProcessing(false);
    }
  }, [disableCode, onDisable]);

  const handleComplete = () => {
    setStep('idle');
    setVerifyCode('');
    setSecret('');
    setQrCodeUrl('');
  };

  if (loading) {
    return (
      <div className="py-4 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Idle state - show enable/disable button
  if (step === 'idle') {
    return (
      <div className="py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-white font-medium">Two-Factor Authentication</h4>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {isEnabled ? 'Your account is protected with 2FA' : 'Add an extra layer of security'}
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            isEnabled ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>
        
        {isEnabled ? (
          <button
            onClick={() => setStep('disable')}
            disabled={isProcessing}
            className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 py-2 rounded-lg transition-colors"
          >
            Disable 2FA
          </button>
        ) : (
          <button
            onClick={handleStartSetup}
            disabled={isProcessing}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors"
          >
            {isProcessing ? 'Setting up...' : 'Enable 2FA'}
          </button>
        )}
      </div>
    );
  }

  // Setup step - show QR code
  if (step === 'setup') {
    return (
      <div className="py-4 space-y-4">
        <h4 className="text-white font-medium">Scan QR Code</h4>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
        </p>
        
        <div className="flex justify-center p-4 bg-white rounded-lg">
          <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
        </div>
        
        <div className="bg-[var(--color-bg-elevated)] p-3 rounded-lg">
          <p className="text-xs text-[var(--color-text-secondary)] mb-1">Manual entry code:</p>
          <code className="text-sm text-indigo-400 font-mono break-all">{secret}</code>
        </div>
        
        <button
          onClick={() => setStep('verify')}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors"
        >
          Continue to Verification
        </button>
      </div>
    );
  }

  // Verify step - enter code
  if (step === 'verify') {
    return (
      <div className="py-4 space-y-4">
        <h4 className="text-white font-medium">Verify Setup</h4>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Enter the 6-digit code from your authenticator app
        </p>
        
        <input
          type="text"
          value={verifyCode}
          onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          className="w-full bg-[var(--color-bg-elevated)] text-white text-center text-2xl tracking-widest py-3 rounded-lg border border-gray-700 focus:border-indigo-500 focus:outline-none"
          maxLength={6}
        />
        
        {error && <p className="text-red-400 text-sm">{error}</p>}
        
        <div className="flex gap-3">
          <button
            onClick={() => setStep('setup')}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleVerify}
            disabled={isProcessing || verifyCode.length !== 6}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </div>
    );
  }

  // Recovery codes step
  if (step === 'recovery') {
    return (
      <div className="py-4 space-y-4">
        <h4 className="text-white font-medium">Save Recovery Codes</h4>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Save these codes in a safe place. You can use them to access your account if you lose your authenticator.
        </p>
        
        <div className="bg-[var(--color-bg-elevated)] p-4 rounded-lg grid grid-cols-2 gap-2">
          {recoveryCodes.map((code, i) => (
            <code key={i} className="text-sm text-indigo-400 font-mono">{code}</code>
          ))}
        </div>
        
        <div className="flex items-center gap-2 text-yellow-400 text-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Each code can only be used once</span>
        </div>
        
        <button
          onClick={handleComplete}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition-colors"
        >
          I've Saved My Codes
        </button>
      </div>
    );
  }

  // Disable step
  if (step === 'disable') {
    return (
      <div className="py-4 space-y-4">
        <h4 className="text-white font-medium">Disable 2FA</h4>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Enter your current 2FA code to disable two-factor authentication
        </p>
        
        <input
          type="text"
          value={disableCode}
          onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          className="w-full bg-[var(--color-bg-elevated)] text-white text-center text-2xl tracking-widest py-3 rounded-lg border border-gray-700 focus:border-indigo-500 focus:outline-none"
          maxLength={6}
        />
        
        {error && <p className="text-red-400 text-sm">{error}</p>}
        
        <div className="flex gap-3">
          <button
            onClick={() => { setStep('idle'); setDisableCode(''); setError(null); }}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDisable}
            disabled={isProcessing || disableCode.length !== 6}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {isProcessing ? 'Disabling...' : 'Disable 2FA'}
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default TwoFactorSetup;
