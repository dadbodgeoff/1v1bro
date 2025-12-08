/**
 * Profile card component displaying user profile information.
 * Requirements: 2.1
 */

import React from 'react';
import type { Profile } from '../../types/profile';
import { getAvatarUrl, getBannerUrl } from '../../types/profile';

interface ProfileCardProps {
  profile: Profile;
  isOwnProfile?: boolean;
  onEdit?: () => void;
}

const COUNTRY_FLAGS: Record<string, string> = {
  US: '🇺🇸', GB: '🇬🇧', CA: '🇨🇦', AU: '🇦🇺', DE: '🇩🇪',
  FR: '🇫🇷', JP: '🇯🇵', KR: '🇰🇷', BR: '🇧🇷', MX: '🇲🇽',
};

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  isOwnProfile = false,
  onEdit,
}) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
      {/* Banner */}
      <div
        className="h-32 relative"
        style={{ backgroundColor: profile.banner_color || '#1a1a2e' }}
      >
        {profile.banner_url && (
          <img
            src={getBannerUrl(profile.banner_url, 'large')}
            alt="Profile banner"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {isOwnProfile && onEdit && (
          <button
            onClick={onEdit}
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white px-3 py-1 rounded text-sm"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Avatar and Info */}
      <div className="px-6 pb-6">
        <div className="flex items-end -mt-12 mb-4">
          <img
            src={getAvatarUrl(profile.avatar_url, 'large')}
            alt={profile.display_name}
            className="w-24 h-24 rounded-full border-4 border-gray-800 bg-gray-700"
          />
          <div className="ml-4 mb-2">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {profile.display_name}
              {profile.country && (
                <span title={profile.country}>
                  {COUNTRY_FLAGS[profile.country] || profile.country}
                </span>
              )}
            </h2>
            {profile.title && (
              <span className="text-indigo-400 text-sm">{profile.title}</span>
            )}
          </div>
        </div>

        {/* Level and XP */}
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-indigo-600 px-3 py-1 rounded-full">
            <span className="text-white font-bold">Level {profile.level}</span>
          </div>
          <div className="text-gray-400 text-sm">
            {profile.total_xp.toLocaleString()} XP
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-gray-300 mb-4">{profile.bio}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-700 rounded p-3 text-center">
            <div className="text-2xl font-bold text-white">{profile.games_played}</div>
            <div className="text-gray-400 text-sm">Games Played</div>
          </div>
          <div className="bg-gray-700 rounded p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{profile.games_won}</div>
            <div className="text-gray-400 text-sm">Wins</div>
          </div>
        </div>

        {/* Social Links */}
        {profile.social_links && Object.keys(profile.social_links).length > 0 && (
          <div className="flex gap-3">
            {profile.social_links.twitter && (
              <a
                href={profile.social_links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                Twitter
              </a>
            )}
            {profile.social_links.twitch && (
              <a
                href={profile.social_links.twitch}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300"
              >
                Twitch
              </a>
            )}
            {profile.social_links.youtube && (
              <a
                href={profile.social_links.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:text-red-300"
              >
                YouTube
              </a>
            )}
            {profile.social_links.discord && (
              <span className="text-indigo-400">
                Discord: {profile.social_links.discord}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileCard;
