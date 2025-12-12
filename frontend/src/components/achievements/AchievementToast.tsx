/**
 * Achievement Toast Component
 * Requirements: 9.1, 9.2, 9.3, 9.5
 */

import { memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Achievement, AchievementRarity } from '@/types/achievements';
import { RARITY_CONFIG } from '@/types/achievements';

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
  onClick?: () => void;
  autoDismissMs?: number;
}

// Animation classes by rarity
const rarityAnimations: Record<AchievementRarity, string> = {
  common: 'animate-fade-in',
  uncommon: 'animate-pulse-gentle',
  rare: 'animate-glow-blue',
  epic: 'animate-glow-purple',
  legendary: 'animate-celebration',
};

export const AchievementToast = memo(function AchievementToast({
  achievement,
  onDismiss,
  onClick,
  autoDismissMs = 5000,
}: AchievementToastProps) {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);
  const rarityConfig = RARITY_CONFIG[achievement.rarity];

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onDismiss, 300); // Wait for exit animation
    }, autoDismissMs);

    return () => clearTimeout(timer);
  }, [autoDismissMs, onDismiss]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate('/achievements');
    }
    onDismiss();
  };

  return (
    <button
      onClick={handleClick}
      className={`
        fixed bottom-4 right-4 z-50
        max-w-sm w-full p-4 rounded-xl
        bg-gray-900/95 backdrop-blur-md border-2
        ${rarityConfig.borderColor}
        shadow-xl ${rarityConfig.glowColor}
        transition-all duration-300 ease-out
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
        ${rarityAnimations[achievement.rarity]}
        hover:scale-105 cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
        focus:ring-yellow-500
      `}
      style={{
        // Respect reduced motion preference
        animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'none'
          : undefined,
      }}
      aria-label={`Achievement unlocked: ${achievement.name}. Click to view achievements.`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-yellow-400 text-lg">🏆</span>
        <span className="text-yellow-400 font-bold text-sm uppercase tracking-wide">
          Achievement Unlocked!
        </span>
      </div>

      {/* Content */}
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={`
            w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
            ${rarityConfig.bgColor}
          `}
        >
          {achievement.icon_url ? (
            <img
              src={achievement.icon_url}
              alt=""
              className="w-8 h-8 object-contain"
            />
          ) : (
            <span className="text-xl">🏆</span>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white">{achievement.name}</h3>
            <span
              className={`
                text-xs px-2 py-0.5 rounded-full font-medium
                ${rarityConfig.bgColor} ${rarityConfig.color}
              `}
            >
              {rarityConfig.label}
            </span>
          </div>
          <p className="text-sm text-gray-400 line-clamp-1">
            {achievement.description}
          </p>
        </div>

        {/* Coin reward */}
        <div className="flex items-center gap-1 text-yellow-400 font-bold">
          <span>+{achievement.coin_reward}</span>
          <span className="text-lg">🪙</span>
        </div>
      </div>

      {/* Click hint */}
      <p className="text-xs text-gray-500 mt-2 text-center">
        Click to view achievements
      </p>
    </button>
  );
});

export default AchievementToast;
