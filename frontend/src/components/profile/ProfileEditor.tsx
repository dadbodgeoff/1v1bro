/**
 * Profile editor component for editing user profile.
 * Requirements: 2.2-2.8
 */

import React, { useState, useRef } from 'react';
import type { Profile, ProfileUpdate, SocialLinks } from '../../types/profile';

interface ProfileEditorProps {
  profile: Profile;
  onSave: (updates: ProfileUpdate) => Promise<void>;
  onAvatarUpload: (file: File) => Promise<void>;
  onBannerUpload: (file: File) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
];

export const ProfileEditor: React.FC<ProfileEditorProps> = ({
  profile,
  onSave,
  onAvatarUpload,
  onBannerUpload,
  onCancel,
  loading = false,
}) => {
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio || '');
  const [bannerColor, setBannerColor] = useState(profile.banner_color || '#1a1a2e');
  const [title, setTitle] = useState(profile.title || '');
  const [country, setCountry] = useState(profile.country || '');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(profile.social_links || {});
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      display_name: displayName,
      bio: bio || undefined,
      banner_color: bannerColor,
      title: title || undefined,
      country: country || undefined,
      social_links: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onAvatarUpload(file);
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onBannerUpload(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6 space-y-6">
      <h2 className="text-xl font-bold text-white mb-4">Edit Profile</h2>

      {/* Avatar Upload */}
      <div>
        <label className="block text-gray-300 mb-2">Avatar</label>
        <div className="flex items-center gap-4">
          <img
            src={profile.avatar_url || '/default-avatar.png'}
            alt="Avatar"
            className="w-20 h-20 rounded-full bg-gray-700"
          />
          <input
            type="file"
            ref={avatarInputRef}
            onChange={handleAvatarChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            Upload Avatar
          </button>
        </div>
      </div>

      {/* Banner Upload */}
      <div>
        <label className="block text-gray-300 mb-2">Banner</label>
        <div
          className="h-24 rounded overflow-hidden relative mb-2"
          style={{ backgroundColor: bannerColor }}
        >
          {profile.banner_url && (
            <img
              src={profile.banner_url}
              alt="Banner preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </div>
        <div className="flex items-center gap-4">
          <input
            type="file"
            ref={bannerInputRef}
            onChange={handleBannerChange}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            Upload Banner
          </button>
          <input
            type="color"
            value={bannerColor}
            onChange={(e) => setBannerColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer"
            title="Banner Color"
          />
        </div>
      </div>

      {/* Display Name */}
      <div>
        <label className="block text-gray-300 mb-2">Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full bg-gray-700 text-white rounded px-4 py-2"
          maxLength={30}
          required
        />
      </div>

      {/* Bio */}
      <div>
        <label className="block text-gray-300 mb-2">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full bg-gray-700 text-white rounded px-4 py-2 h-24 resize-none"
          maxLength={500}
          placeholder="Tell us about yourself..."
        />
      </div>

      {/* Title */}
      <div>
        <label className="block text-gray-300 mb-2">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-gray-700 text-white rounded px-4 py-2"
          maxLength={50}
          placeholder="e.g., Trivia Master"
        />
      </div>

      {/* Country */}
      <div>
        <label className="block text-gray-300 mb-2">Country</label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full bg-gray-700 text-white rounded px-4 py-2"
        >
          <option value="">Select country...</option>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Social Links */}
      <div>
        <label className="block text-gray-300 mb-2">Social Links</label>
        <div className="space-y-2">
          <input
            type="url"
            value={socialLinks.twitter || ''}
            onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value || undefined })}
            className="w-full bg-gray-700 text-white rounded px-4 py-2"
            placeholder="Twitter URL"
          />
          <input
            type="url"
            value={socialLinks.twitch || ''}
            onChange={(e) => setSocialLinks({ ...socialLinks, twitch: e.target.value || undefined })}
            className="w-full bg-gray-700 text-white rounded px-4 py-2"
            placeholder="Twitch URL"
          />
          <input
            type="url"
            value={socialLinks.youtube || ''}
            onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value || undefined })}
            className="w-full bg-gray-700 text-white rounded px-4 py-2"
            placeholder="YouTube URL"
          />
          <input
            type="text"
            value={socialLinks.discord || ''}
            onChange={(e) => setSocialLinks({ ...socialLinks, discord: e.target.value || undefined })}
            className="w-full bg-gray-700 text-white rounded px-4 py-2"
            placeholder="Discord username"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-bold"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded"
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ProfileEditor;
