/**
 * FriendsList Component
 *
 * Displays a list of accepted friends with options to remove them.
 * Shows empty state when no friends exist.
 */

import { useState } from 'react';
import type { Friend } from '../../types/database';
import PersonIcon from '@mui/icons-material/Person';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import Avatar from '@mui/material/Avatar';

/**
 * Validate and sanitize avatar URL to prevent XSS
 * @param url - The URL to validate
 * @returns Sanitized URL or null if invalid
 */
function sanitizeAvatarUrl(url: string | null): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return url;
  } catch {
    // Invalid URL
    return null;
  }
}

interface FriendsListProps {
  friends: Friend[];
  loading: boolean;
  onRemoveFriend: (friendId: string) => Promise<void>;
}

export function FriendsList({ friends, loading, onRemoveFriend }: FriendsListProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (friendId: string, friendName: string) => {
    if (!confirm(`Er du sikker på at du vil fjerne ${friendName} som venn?`)) {
      return;
    }

    setRemovingId(friendId);
    try {
      await onRemoveFriend(friendId);
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 'var(--spacing-2xl)',
      }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: 'var(--spacing-2xl)',
        background: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(0, 48, 73, 0.1)',
      }}>
        <img
          src="/Napoleonic Ruse.png"
          alt="Napoleon"
          style={{
            width: '140px',
            height: 'auto',
            marginBottom: 'var(--spacing-md)',
            opacity: 0.9,
          }}
        />
        <h3 style={{
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-h5)',
          marginBottom: 'var(--spacing-sm)',
        }}>
          Ingen venner ennå
        </h3>
        <p style={{
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-base)',
        }}>
          Selv Napoleon trengte allierte! Søk etter venner for å bygge ditt drikkeimperium.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-md)',
    }}>
      {friends.map((friend) => {
        // Sanitize avatar URL to prevent XSS
        const safeAvatarUrl = sanitizeAvatarUrl(friend.avatar_url);

        return (
          <div
            key={friend.friend_id}
            style={{
              background: 'rgba(255, 255, 255, 0.7)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-md)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-md)',
              border: '1px solid rgba(0, 48, 73, 0.1)',
              boxShadow: 'var(--shadow-sm)',
              transition: 'all var(--transition-base)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            {/* Avatar - Using MUI Avatar for safe rendering */}
            <Avatar
              src={safeAvatarUrl || undefined}
              alt={friend.display_name}
              sx={{
                width: 48,
                height: 48,
                bgcolor: 'var(--prussian-blue-bg)',
                color: 'var(--prussian-blue)',
              }}
            >
              {!safeAvatarUrl && <PersonIcon sx={{ fontSize: 28 }} />}
            </Avatar>

            {/* Friend Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{
                margin: 0,
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {friend.display_name}
              </h4>
              <p style={{
                margin: 0,
                fontSize: 'var(--font-size-small)',
                color: 'var(--color-text-muted)',
              }}>
                Venner siden {new Date(friend.created_at).toLocaleDateString('nb-NO', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>

            {/* Remove Button */}
            <button
              onClick={() => handleRemove(friend.friend_id, friend.display_name)}
              disabled={removingId === friend.friend_id}
              style={{
                padding: 'var(--spacing-sm) var(--spacing-md)',
                background: 'transparent',
                color: 'var(--fire-engine-red)',
                border: '1px solid var(--fire-engine-red)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-small)',
                fontWeight: 'var(--font-weight-medium)',
                cursor: removingId === friend.friend_id ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)',
                transition: 'all var(--transition-base)',
                opacity: removingId === friend.friend_id ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (removingId !== friend.friend_id) {
                  e.currentTarget.style.background = 'var(--fire-engine-red)';
                  e.currentTarget.style.color = 'var(--color-text-inverse)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--fire-engine-red)';
              }}
            >
              <PersonRemoveIcon sx={{ fontSize: 18 }} />
              {removingId === friend.friend_id ? 'Fjerner...' : 'Fjern'}
            </button>
          </div>
        );
      })}
    </div>
  );
}
