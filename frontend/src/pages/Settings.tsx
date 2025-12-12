/**
 * Settings page with enterprise-grade UI.
 * Requirements: 3.1, 4.1, 5.1, 6.1, 7.1, 10.1
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../hooks/useSettings';
import { useProfile } from '../hooks/useProfile';
import {
  SettingsSection,
  SettingsToggle,
  SettingsSlider,
  SettingsSelect,
  KeybindInput,
  TwoFactorSetup,
  AccountDangerZone,
} from '../components/settings/enterprise';
import type { PrivacySettingsUpdate } from '../types/profile';
import type { Keybinds, VideoQuality, ColorblindMode, FPSLimit } from '../types/settings';
import { DEFAULT_KEYBINDS } from '../types/settings';
import {
  VIDEO_QUALITY_OPTIONS,
  FPS_LIMIT_OPTIONS,
  COLORBLIND_OPTIONS,
  KEYBIND_ACTIONS,
  getConfigurableKeybinds,
} from '@/config/settings';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { profile, loading: profileLoading, fetchProfile, updatePrivacySettings } = useProfile();
  const {
    settings,
    loading: settingsLoading,
    saving,
    fetchSettings,
    updateNotifications,
    updateAudioDebounced,
    updateVideo,
    updateAccessibilityDebounced,
    updateKeybinds,
    resetKeybinds,
    enable2FA,
    verify2FA,
    disable2FA,
    exportData,
    deleteAccount,
  } = useSettings();

  // Privacy state (from profile)
  const [isPublic, setIsPublic] = useState(true);
  const [acceptFriendRequests, setAcceptFriendRequests] = useState(true);
  const [allowMessages, setAllowMessages] = useState(true);

  // Local keybinds state for conflict detection
  const [localKeybinds, setLocalKeybinds] = useState<Keybinds>(DEFAULT_KEYBINDS);

  useEffect(() => {
    fetchProfile();
    fetchSettings();
  }, [fetchProfile, fetchSettings]);

  useEffect(() => {
    if (profile) {
      setIsPublic(profile.is_public ?? true);
      setAcceptFriendRequests(profile.accept_friend_requests ?? true);
      setAllowMessages(profile.allow_messages ?? true);
    }
  }, [profile]);

  useEffect(() => {
    if (settings?.keybinds) {
      setLocalKeybinds(settings.keybinds);
    }
  }, [settings?.keybinds]);

  const handlePrivacyChange = async (key: keyof PrivacySettingsUpdate, value: boolean) => {
    const updates: PrivacySettingsUpdate = { [key]: value };
    await updatePrivacySettings(updates);
  };

  const handleKeybindChange = async (action: keyof Keybinds, key: string) => {
    const newKeybinds = { ...localKeybinds, [action]: key };
    setLocalKeybinds(newKeybinds);
    await updateKeybinds({ [action]: key });
  };

  const handleResetKeybinds = async () => {
    setLocalKeybinds(DEFAULT_KEYBINDS);
    await resetKeybinds();
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Find keybind conflicts
  const getConflictFor = (action: string): string | undefined => {
    const currentKey = localKeybinds[action as keyof Keybinds];
    for (const [otherAction, otherKey] of Object.entries(localKeybinds)) {
      if (otherAction !== action && otherKey === currentKey) {
        return KEYBIND_ACTIONS.find((a) => a.key === otherAction)?.label;
      }
    }
    return undefined;
  };

  const loading = profileLoading || settingsLoading;

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-[var(--color-text-secondary)] hover:text-white mb-4 flex items-center gap-2 transition-colors min-h-[44px] touch-manipulation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-4xl font-extrabold text-white">Settings</h1>
          <p className="text-[var(--color-text-secondary)] mt-2">
            Customize your experience
          </p>
        </div>

        <div className="space-y-6">
          {/* Privacy Section */}
          <SettingsSection id="privacy" icon="🔒" title="Privacy" description="Control who can see your profile" loading={loading}>
            <SettingsToggle id="is_public" label="Public Profile" description="Allow others to view your profile" checked={isPublic} onChange={(v) => { setIsPublic(v); handlePrivacyChange('is_public', v); }} loading={saving} />
            <SettingsToggle id="accept_friends" label="Accept Friend Requests" description="Receive friend requests from other players" checked={acceptFriendRequests} onChange={(v) => { setAcceptFriendRequests(v); handlePrivacyChange('accept_friend_requests', v); }} loading={saving} />
            <SettingsToggle id="allow_messages" label="Allow Messages" description="Receive direct messages from other players" checked={allowMessages} onChange={(v) => { setAllowMessages(v); handlePrivacyChange('allow_messages', v); }} loading={saving} />
          </SettingsSection>

          {/* Notifications Section */}
          <SettingsSection id="notifications" icon="🔔" title="Notifications" description="Manage your notification preferences" loading={loading}>
            <SettingsToggle id="email_enabled" label="Email Notifications" description="Receive updates via email" checked={settings?.notifications.email_enabled ?? true} onChange={(v) => updateNotifications({ email_enabled: v })} loading={saving} />
            <SettingsToggle id="push_enabled" label="Push Notifications" description="Receive browser push notifications" checked={settings?.notifications.push_enabled ?? true} onChange={(v) => updateNotifications({ push_enabled: v })} loading={saving} />
            <SettingsToggle id="friend_activity" label="Friend Activity" description="Notifications when friends come online" checked={settings?.notifications.friend_activity ?? true} onChange={(v) => updateNotifications({ friend_activity: v })} disabled={!settings?.notifications.email_enabled && !settings?.notifications.push_enabled} loading={saving} />
            <SettingsToggle id="match_updates" label="Match Updates" description="Notifications for match found and results" checked={settings?.notifications.match_updates ?? true} onChange={(v) => updateNotifications({ match_updates: v })} disabled={!settings?.notifications.email_enabled && !settings?.notifications.push_enabled} loading={saving} />
          </SettingsSection>

          {/* Audio Section */}
          <SettingsSection id="audio" icon="🔊" title="Audio" description="Adjust volume levels" loading={loading}>
            <SettingsSlider id="master_volume" label="Master Volume" value={settings?.audio.master ?? 80} min={0} max={100} defaultValue={80} onChange={(v) => updateAudioDebounced({ master: v })} showReset />
            <SettingsSlider id="music_volume" label="Music Volume" value={settings?.audio.music ?? 70} min={0} max={100} defaultValue={70} onChange={(v) => updateAudioDebounced({ music: v })} showReset />
            <SettingsSlider id="sfx_volume" label="Sound Effects" value={settings?.audio.sfx ?? 80} min={0} max={100} defaultValue={80} onChange={(v) => updateAudioDebounced({ sfx: v })} showReset />
            <SettingsSlider id="voice_volume" label="Voice/Announcer" value={settings?.audio.voice ?? 100} min={0} max={100} defaultValue={100} onChange={(v) => updateAudioDebounced({ voice: v })} showReset />
          </SettingsSection>

          {/* Video Section */}
          <SettingsSection id="video" icon="🎮" title="Video" description="Graphics and performance settings" loading={loading}>
            <SettingsSelect id="video_quality" label="Quality Preset" value={settings?.video.quality ?? 'high'} options={VIDEO_QUALITY_OPTIONS} onChange={(v) => updateVideo({ quality: v as VideoQuality })} />
            <SettingsSelect id="fps_limit" label="FPS Limit" value={String(settings?.video.fps_limit ?? 60)} options={FPS_LIMIT_OPTIONS} onChange={(v) => updateVideo({ fps_limit: Number(v) as FPSLimit })} />
            <SettingsToggle id="show_fps" label="Show FPS Counter" description="Display FPS in game" checked={settings?.video.show_fps_counter ?? false} onChange={(v) => updateVideo({ show_fps_counter: v })} loading={saving} />
          </SettingsSection>

          {/* Controls Section */}
          <SettingsSection id="controls" icon="⌨️" title="Controls" description="Customize keyboard shortcuts" loading={loading}>
            {getConfigurableKeybinds().map(({ key, label }) => (
              <KeybindInput key={key} id={`keybind_${key}`} action={label} currentKey={localKeybinds[key as keyof Keybinds]} defaultKey={DEFAULT_KEYBINDS[key as keyof Keybinds]} onCapture={(k) => handleKeybindChange(key as keyof Keybinds, k)} conflictWith={getConflictFor(key)} />
            ))}
            <div className="pt-4">
              <button onClick={handleResetKeybinds} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors min-h-[44px] touch-manipulation">
                Reset All to Defaults
              </button>
            </div>
          </SettingsSection>

          {/* Accessibility Section */}
          <SettingsSection id="accessibility" icon="♿" title="Accessibility" description="Accessibility options" loading={loading}>
            <SettingsSelect id="colorblind_mode" label="Colorblind Mode" value={settings?.accessibility.colorblind_mode ?? 'none'} options={COLORBLIND_OPTIONS} onChange={(v) => updateAccessibilityDebounced({ colorblind_mode: v as ColorblindMode })} />
            <SettingsSlider id="font_scale" label="Font Scale" value={Math.round((settings?.accessibility.font_scale ?? 1.0) * 100)} min={80} max={150} step={10} unit="%" defaultValue={100} onChange={(v) => updateAccessibilityDebounced({ font_scale: v / 100 })} showReset />
            <SettingsToggle id="reduced_motion" label="Reduced Motion" description="Minimize animations" checked={settings?.accessibility.reduced_motion ?? false} onChange={(v) => updateAccessibilityDebounced({ reduced_motion: v })} loading={saving} />
            <SettingsToggle id="high_contrast" label="High Contrast" description="Increase visual contrast" checked={settings?.accessibility.high_contrast ?? false} onChange={(v) => updateAccessibilityDebounced({ high_contrast: v })} loading={saving} />
          </SettingsSection>

          {/* Security Section - 2FA */}
          <SettingsSection id="security" icon="🔐" title="Security" description="Two-factor authentication" loading={loading}>
            <TwoFactorSetup
              isEnabled={profile?.two_factor_enabled ?? false}
              onEnable={enable2FA}
              onVerify={verify2FA}
              onDisable={disable2FA}
              loading={saving}
            />
          </SettingsSection>

          {/* Account Section - Danger Zone */}
          <SettingsSection id="account" icon="👤" title="Account" description="Account management" loading={false}>
            <AccountDangerZone
              onSignOut={handleSignOut}
              onExportData={exportData}
              onDeleteAccount={deleteAccount}
              loading={saving}
            />
          </SettingsSection>
        </div>
      </div>
    </div>
  );
};

export default Settings;
