/**
 * Profile page with enterprise components.
 * Requirements: 8.1, 10.1, 10.2, 10.3
 * 
 * Features:
 * - Enterprise ProfileHeader with unified Battle Pass progression
 * - StatsDashboard with 6 stats cards
 * - LoadoutPreview showing equipped cosmetics
 * - MatchHistorySection with recent matches
 * - SocialLinkButton row for social connections
 * - ProfileEditorForm with live preview
 * - Responsive layout for all screen sizes
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'
import { useBattlePass } from '../hooks/useBattlePass'
import { useCosmetics } from '../hooks/useCosmetics'
import { useMatchHistory } from '../hooks/useMatchHistory'
import { useAchievements } from '../hooks/useAchievements'
import {
  ProfileHeader,
  ProfileSection,
  StatsDashboard,
  LoadoutPreview,
  MatchHistorySection,
  SocialLinkButton,
  ProfileEditorForm,
  sortAchievements,
  AchievementBadge,
  ProfileErrorBoundary,
  SectionErrorBoundary,
} from '../components/profile/enterprise'
import { EasterEggSecretsSection } from '../components/easter-eggs'
import type { ProfileUpdate } from '../types/profile'

type ViewMode = 'view' | 'edit'

export const Profile: React.FC = () => {
  const navigate = useNavigate()
  const [mode, setMode] = useState<ViewMode>('view')
  
  // Profile data
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    uploadBanner,
  } = useProfile()

  // Battle Pass data for unified progression
  const { progress: battlePassProgress, fetchProgress } = useBattlePass()

  // Inventory data for loadout preview
  const { inventory, loadout, fetchInventory, fetchLoadout } = useCosmetics()

  // Match history data
  const { 
    matches, 
    total: matchesTotal, 
    fetchMatches,
  } = useMatchHistory()

  // Achievements data
  const {
    achievements,
  } = useAchievements()

  useEffect(() => {
    fetchProfile()
    fetchProgress()
    fetchInventory()
    fetchLoadout()
    fetchMatches()
    // Achievements are auto-fetched by the hook
  }, [fetchProfile, fetchProgress, fetchInventory, fetchLoadout, fetchMatches])

  const handleSave = async (updates: ProfileUpdate) => {
    await updateProfile(updates)
    setMode('view')
  }

  const handleCancel = () => {
    setMode('view')
  }

  const handleTierClick = () => {
    navigate('/battlepass')
  }

  const handleCustomizeLoadout = () => {
    navigate('/inventory')
  }

  const handleViewAllMatches = () => {
    // Navigate to match history page with expanded view
    navigate('/profile/matches')
  }

  // Loading state
  if (profileLoading && !profile) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    )
  }

  // Error state
  if (profileError && !profile) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">{profileError}</div>
          <button
            onClick={() => fetchProfile()}
            className="bg-[#6366f1] hover:bg-[#818cf8] text-white px-6 py-2 rounded-lg font-medium transition-colors min-h-[44px] touch-manipulation"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Not found state
  if (!profile) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex items-center justify-center">
        <div className="text-[var(--color-text-muted)] text-xl">Profile not found</div>
      </div>
    )
  }

  // Sort achievements by rarity and date - map to AchievementBadge format
  const sortedAchievements = sortAchievements(
    achievements.map(a => ({
      id: a.id,
      name: a.name,
      description: a.description,
      icon_url: a.icon_url,
      rarity: a.rarity,
      earned_at: new Date().toISOString(), // Default for display
    }))
  ).slice(0, 6)

  return (
    <ProfileErrorBoundary>
      <div className="min-h-screen bg-[var(--color-bg-base)]">
        {/* Back Button - Touch optimized */}
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="text-[var(--color-text-muted)] hover:text-white flex items-center gap-2 transition-colors min-h-[44px] touch-manipulation"
          >
            <span>←</span> Back
          </button>
        </div>

        {/* Profile Header */}
        <ProfileHeader
          profile={profile}
          battlePassProgress={battlePassProgress}
          isOwnProfile={true}
          onEdit={() => setMode('edit')}
          onAvatarClick={() => setMode('edit')}
        />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {mode === 'view' ? (
          <div className="space-y-8">
            {/* Statistics Section */}
            <SectionErrorBoundary>
              <ProfileSection
                title="Statistics"
                subtitle="Your performance at a glance"
                icon={<span className="text-xl">📊</span>}
              >
                <StatsDashboard
                  profile={profile}
                  battlePassProgress={battlePassProgress}
                  onTierClick={handleTierClick}
                />
              </ProfileSection>
            </SectionErrorBoundary>

            {/* Current Loadout Section */}
            <SectionErrorBoundary>
              <ProfileSection
                title="Current Loadout"
                subtitle="Your equipped cosmetics"
                icon={<span className="text-xl">🎨</span>}
              >
                <LoadoutPreview
                  loadout={loadout}
                  inventory={inventory}
                  showCustomizeLink={true}
                  onCustomize={handleCustomizeLoadout}
                />
              </ProfileSection>
            </SectionErrorBoundary>

            {/* Recent Matches Section */}
            <SectionErrorBoundary>
              <ProfileSection
                title="Recent Matches"
                subtitle="Your latest games"
                icon={<span className="text-xl">⚔️</span>}
                badge={matchesTotal > 0 ? matchesTotal : undefined}
                badgeVariant="count"
              >
                <MatchHistorySection
                  matches={matches}
                  total={matchesTotal}
                  onViewAll={handleViewAllMatches}
                />
              </ProfileSection>
            </SectionErrorBoundary>

            {/* Achievements Section */}
            {sortedAchievements.length > 0 && (
              <SectionErrorBoundary>
                <ProfileSection
                  title="Achievements"
                  subtitle="Your accomplishments"
                  icon={<span className="text-xl">🏆</span>}
                  badge={achievements.length > 6 ? `${achievements.length}` : undefined}
                  badgeVariant="count"
                >
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    {sortedAchievements.map((achievement) => (
                      <AchievementBadge
                        key={achievement.id}
                        achievement={achievement}
                      />
                    ))}
                  </div>
                </ProfileSection>
              </SectionErrorBoundary>
            )}

            {/* Easter Eggs / Secrets Section */}
            <SectionErrorBoundary>
              <ProfileSection
                title="Secrets"
                subtitle="Hidden discoveries"
                icon={<span className="text-xl">🥚</span>}
              >
                <EasterEggSecretsSection />
              </ProfileSection>
            </SectionErrorBoundary>

            {/* Social Links Section */}
            {profile.social_links && Object.values(profile.social_links).some(Boolean) && (
              <ProfileSection
                title="Connect"
                subtitle="Find me on social media"
                icon={<span className="text-xl">🔗</span>}
              >
                <div className="flex flex-wrap gap-3">
                  {profile.social_links.twitter && (
                    <SocialLinkButton
                      platform="twitter"
                      value={profile.social_links.twitter}
                    />
                  )}
                  {profile.social_links.twitch && (
                    <SocialLinkButton
                      platform="twitch"
                      value={profile.social_links.twitch}
                    />
                  )}
                  {profile.social_links.youtube && (
                    <SocialLinkButton
                      platform="youtube"
                      value={profile.social_links.youtube}
                    />
                  )}
                  {profile.social_links.discord && (
                    <SocialLinkButton
                      platform="discord"
                      value={profile.social_links.discord}
                    />
                  )}
                </div>
              </ProfileSection>
            )}
          </div>
        ) : (
          /* Edit Mode */
          <ProfileSection
            title="Edit Profile"
            subtitle="Update your profile information"
            icon={<span className="text-xl">✏️</span>}
          >
            <ProfileEditorForm
              profile={profile}
              onSave={handleSave}
              onAvatarUpload={uploadAvatar}
              onBannerUpload={uploadBanner}
              onCancel={handleCancel}
              loading={profileLoading}
            />
          </ProfileSection>
        )}

        {/* Error Display */}
        {profileError && (
          <div className="mt-4 bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
            {profileError}
          </div>
        )}
      </div>
    </div>
    </ProfileErrorBoundary>
  )
}

export default Profile
