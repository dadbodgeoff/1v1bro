/**
 * CoinSuccess - Purchase success page.
 * Requirements: 3.2, 6.3
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useCoinPurchase } from '../hooks/useCoinPurchase';
import { useBalance } from '../hooks/useBalance';
import { BalanceDisplay } from '../components/coins/BalanceDisplay';
import { formatCoins } from '../types/coin';

export function CoinSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  
  const { verifyPurchase, loading, error } = useCoinPurchase();
  const { refreshBalance, coins } = useBalance();
  
  const [verified, setVerified] = useState(false);
  const [coinsReceived, setCoinsReceived] = useState(0);

  useEffect(() => {
    if (!sessionId) {
      navigate('/coins', { replace: true });
      return;
    }

    const verify = async () => {
      const result = await verifyPurchase(sessionId);
      if (result?.success) {
        setVerified(true);
        setCoinsReceived(result.coins_credited);
        await refreshBalance();
      }
    };

    verify();
  }, [sessionId, verifyPurchase, refreshBalance, navigate]);

  if (!sessionId) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--color-text-secondary)]">Verifying your purchase...</p>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
          <p className="text-[var(--color-text-secondary)] mb-6">{error}</p>
          <Link to="/coins" className="inline-block px-6 py-3 bg-[var(--color-bg-elevated)] rounded-lg hover:bg-[var(--color-bg-card)] transition-colors">
            Return to Coin Shop
          </Link>
        </div>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          {/* Success Animation */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center animate-bounce">
            <svg className="w-10 h-10 text-yellow-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Purchase Complete!</h1>
          
          <div className="text-5xl font-extrabold text-yellow-400 mb-2">
            +{formatCoins(coinsReceived)}
          </div>
          <p className="text-[var(--color-text-secondary)] mb-6">coins added to your account</p>

          {/* New Balance */}
          <div className="mb-8">
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">Your new balance</p>
            <BalanceDisplay balance={coins} size="lg" />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/shop" className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-black font-bold rounded-lg hover:from-yellow-400 hover:to-amber-400 transition-colors">
              Visit Shop
            </Link>
            <Link to="/coins" className="px-6 py-3 bg-[var(--color-bg-elevated)] text-white rounded-lg hover:bg-[var(--color-bg-card)] transition-colors">
              Buy More Coins
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}