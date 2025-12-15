/**
 * EasterEggSecretsSection - Displays discovered easter eggs in Profile page.
 * Requirements: 6.4
 * 
 * Shows discovered easter eggs with silhouettes for undiscovered ones.
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getEasterEggRegistry } from '../../systems/polish/EasterEggRegistry';
import type { EasterEgg, EasterEggDiscovery } from '../../systems/polish/EasterEggRegistry';

// ============================================
// Types
// ============================================

interface EasterEggSecretsSectionProps {
  className?: string;
}

interface EggDisplayProps {
  egg: EasterEgg;
  discovery: EasterEggDiscovery | undefined;
  index: number;
}

// ============================================
// Styles
// ============================================

const containerStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  gap: '16px',
};

const eggCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '16px',
  borderRadius: '12px',
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  transition: 'all 0.2s ease',
};

const discoveredCardStyle: React.CSSProperties = {
  ...eggCardStyle,
  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 140, 0, 0.1) 100%)',
  border: '1px solid rgba(255, 215, 0, 0.3)',
};

const undiscoveredCardStyle: React.CSSProperties = {
  ...eggCardStyle,
  opacity: 0.5,
};

const iconContainerStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '24px',
  marginBottom: '8px',
};

const discoveredIconStyle: React.CSSProperties = {
  ...iconContainerStyle,
  background: 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)',
  boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)',
};

const undiscoveredIconStyle: React.CSSProperties = {
  ...iconContainerStyle,
  background: 'rgba(255, 255, 255, 0.1)',
};

const nameStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#fff',
  textAlign: 'center',
  marginBottom: '4px',
};

const undiscoveredNameStyle: React.CSSProperties = {
  ...nameStyle,
  color: 'rgba(255, 255, 255, 0.5)',
};

const hintStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'rgba(255, 255, 255, 0.5)',
  textAlign: 'center',
  fontStyle: 'italic',
};

const dateStyle: React.CSSProperties = {
  fontSize: '10px',
  color: 'rgba(255, 215, 0, 0.7)',
  marginTop: '4px',
};

const legacyBadgeStyle: React.CSSProperties = {
  fontSize: '9px',
  padding: '2px 6px',
  borderRadius: '4px',
  background: 'rgba(128, 128, 128, 0.3)',
  color: 'rgba(255, 255, 255, 0.6)',
  marginTop: '4px',
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '32px',
  color: 'rgba(255, 255, 255, 0.5)',
};

const progressStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  marginBottom: '16px',
  padding: '12px',
  borderRadius: '8px',
  background: 'rgba(255, 215, 0, 0.1)',
  border: '1px solid rgba(255, 215, 0, 0.2)',
};

const progressTextStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#ffd700',
  fontWeight: 500,
};

// ============================================
// Sub-components
// ============================================

function EggDisplay({ egg, discovery, index }: EggDisplayProps) {
  const isDiscovered = !!discovery;
  
  const formattedDate = useMemo(() => {
    if (!discovery) return null;
    const date = new Date(discovery.discoveredAt);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [discovery]);

  return (
    <motion.div
      style={isDiscovered ? discoveredCardStyle : undiscoveredCardStyle}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isDiscovered ? 1 : 0.5, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={isDiscovered ? { scale: 1.02 } : undefined}
    >
      {/* Icon */}
      <div style={isDiscovered ? discoveredIconStyle : undiscoveredIconStyle}>
        {isDiscovered ? (
          <span role="img" aria-label="discovered">🥚</span>
        ) : (
          <span role="img" aria-label="undiscovered">❓</span>
        )}
      </div>
      
      {/* Name */}
      <div style={isDiscovered ? nameStyle : undiscoveredNameStyle}>
        {isDiscovered ? egg.name : '???'}
      </div>
      
      {/* Hint or Date */}
      {isDiscovered ? (
        <>
          {formattedDate && (
            <div style={dateStyle}>
              Found {formattedDate}
            </div>
          )}
          {discovery?.isLegacy && (
            <div style={legacyBadgeStyle}>
              Legacy
            </div>
          )}
        </>
      ) : (
        <div style={hintStyle}>
          {egg.hint}
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// Main Component
// ============================================

export function EasterEggSecretsSection({ className }: EasterEggSecretsSectionProps) {
  const registry = getEasterEggRegistry();
  const catalog = registry.catalog;
  const discoveries = registry.getDiscoveries();
  
  // Create a map for quick lookup
  const discoveryMap = useMemo(() => {
    const map = new Map<string, EasterEggDiscovery>();
    for (const discovery of discoveries) {
      map.set(discovery.eggId, discovery);
    }
    return map;
  }, [discoveries]);
  
  // Sort eggs: discovered first, then by name
  const sortedEggs = useMemo(() => {
    return [...catalog].sort((a, b) => {
      const aDiscovered = discoveryMap.has(a.id);
      const bDiscovered = discoveryMap.has(b.id);
      
      if (aDiscovered && !bDiscovered) return -1;
      if (!aDiscovered && bDiscovered) return 1;
      
      return a.name.localeCompare(b.name);
    });
  }, [catalog, discoveryMap]);
  
  const discoveredCount = discoveries.length;
  const totalCount = catalog.length;
  const progressPercent = totalCount > 0 ? Math.round((discoveredCount / totalCount) * 100) : 0;

  if (catalog.length === 0) {
    return (
      <div className={className} style={emptyStateStyle}>
        <span role="img" aria-label="magnifying glass" style={{ fontSize: '32px' }}>🔍</span>
        <p style={{ marginTop: '8px' }}>No secrets to discover yet...</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Progress indicator */}
      <div style={progressStyle}>
        <span role="img" aria-label="trophy">🏆</span>
        <span style={progressTextStyle}>
          {discoveredCount} / {totalCount} Secrets Found ({progressPercent}%)
        </span>
      </div>
      
      {/* Eggs grid */}
      <div style={containerStyle}>
        {sortedEggs.map((egg, index) => (
          <EggDisplay
            key={egg.id}
            egg={egg}
            discovery={discoveryMap.get(egg.id)}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

export default EasterEggSecretsSection;
