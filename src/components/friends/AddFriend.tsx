/**
 * AddFriend Component
 *
 * Search for users and send friend requests.
 * Shows friendship status (already friends, pending request, etc.)
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { searchUsers, type UserSearchResult } from '../../api';
import { useFriends } from '../../hooks/useFriends';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
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

interface SearchResultItemProps {
  user: UserSearchResult;
  status: 'none' | 'friend' | 'pending_sent' | 'pending_received';
  onSendRequest: (userId: string) => Promise<void>;
  loading: boolean;
}

function SearchResultItem({ user, status, onSendRequest, loading }: SearchResultItemProps) {
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      await onSendRequest(user.id);
    } finally {
      setSending(false);
    }
  };

  // Sanitize avatar URL to prevent XSS
  const safeAvatarUrl = sanitizeAvatarUrl(user.avatar_url);

  return (
    <div
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
        alt={user.display_name}
        sx={{
          width: 40,
          height: 40,
          bgcolor: 'var(--prussian-blue-bg)',
          color: 'var(--prussian-blue)',
        }}
      >
        {!safeAvatarUrl && <PersonIcon sx={{ fontSize: 24 }} />}
      </Avatar>

      {/* User Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link
          to={`/profile/${user.id}`}
          style={{
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <h4 style={{
            margin: 0,
            fontSize: 'var(--font-size-base)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--prussian-blue)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            transition: 'color var(--transition-base)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--orange-wheel)';
            e.currentTarget.style.textDecoration = 'underline';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--prussian-blue)';
            e.currentTarget.style.textDecoration = 'none';
          }}
          >
            {user.display_name}
          </h4>
        </Link>
      </div>

      {/* Action Button */}
      {status === 'friend' && (
        <div style={{
          padding: 'var(--spacing-sm) var(--spacing-md)',
          background: 'var(--color-success)',
          color: 'var(--color-text-inverse)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--font-size-small)',
          fontWeight: 'var(--font-weight-medium)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-xs)',
        }}>
          <CheckCircleIcon sx={{ fontSize: 18 }} />
          Venner
        </div>
      )}

      {status === 'pending_sent' && (
        <div style={{
          padding: 'var(--spacing-sm) var(--spacing-md)',
          background: 'var(--xanthous-bg)',
          color: 'var(--xanthous-dark)',
          border: '1px solid var(--xanthous)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--font-size-small)',
          fontWeight: 'var(--font-weight-medium)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-xs)',
        }}>
          <HourglassEmptyIcon sx={{ fontSize: 18 }} />
          Avventer
        </div>
      )}

      {status === 'pending_received' && (
        <div style={{
          padding: 'var(--spacing-sm) var(--spacing-md)',
          background: 'var(--prussian-blue-bg)',
          color: 'var(--prussian-blue)',
          border: '1px solid var(--prussian-blue)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 'var(--font-size-small)',
          fontWeight: 'var(--font-weight-medium)',
        }}>
          Forespørsel mottatt
        </div>
      )}

      {status === 'none' && (
        <button
          onClick={handleSend}
          disabled={sending || loading}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            background: 'var(--prussian-blue)',
            color: 'var(--color-text-inverse)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--font-size-small)',
            fontWeight: 'var(--font-weight-medium)',
            cursor: sending || loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            transition: 'all var(--transition-base)',
            opacity: sending || loading ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (!sending && !loading) {
              e.currentTarget.style.background = 'var(--prussian-blue-light)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--prussian-blue)';
          }}
        >
          <PersonAddIcon sx={{ fontSize: 18 }} />
          {sending ? 'Sender...' : 'Legg til'}
        </button>
      )}
    </div>
  );
}

export function AddFriend() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { friends, sentRequests, pendingRequests, sendRequest, loading: friendsLoading } = useFriends();

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setError(null);
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const results = await searchUsers(query);
      setSearchResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke søke etter brukere');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Debounced input handler (300ms delay)
  const handleInputChange = (value: string) => {
    setSearchQuery(value);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSendRequest = async (userId: string) => {
    try {
      await sendRequest(userId);
      // Refresh search results to update status
      await handleSearch(searchQuery);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke sende venneforespørsel');
    }
  };

  const getUserStatus = (userId: string): 'none' | 'friend' | 'pending_sent' | 'pending_received' => {
    if (friends.some(f => f.friend_id === userId)) {
      return 'friend';
    }
    if (sentRequests.some(r => r.recipient_id === userId)) {
      return 'pending_sent';
    }
    if (pendingRequests.some(r => r.requester_id === userId)) {
      return 'pending_received';
    }
    return 'none';
  };

  return (
    <div>
      <h3 style={{
        margin: '0 0 var(--spacing-md) 0',
        fontSize: 'var(--font-size-h5)',
        color: 'var(--prussian-blue)',
        fontWeight: 'var(--font-weight-semibold)',
      }}>
        Søk etter venner
      </h3>
      <p style={{
        margin: '0 0 var(--spacing-lg) 0',
        fontSize: 'var(--font-size-small)',
        color: 'var(--color-text-muted)',
      }}>
        Søk etter brukere for å sende venneforespørsler
      </p>

      {/* Search Input */}
      <div style={{
        position: 'relative',
        marginBottom: 'var(--spacing-lg)',
      }}>
        <div style={{
          position: 'absolute',
          left: 'var(--spacing-md)',
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }}>
          <SearchIcon sx={{ color: 'var(--color-text-muted)', fontSize: 20 }} />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Søk etter brukernavn..."
          style={{
            width: '100%',
            padding: 'var(--spacing-md) var(--spacing-md) var(--spacing-md) calc(var(--spacing-md) * 3)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-base)',
            outline: 'none',
            transition: 'all var(--transition-base)',
            background: 'rgba(255, 255, 255, 0.9)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--prussian-blue)';
            e.currentTarget.style.boxShadow = 'var(--input-focus-shadow)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          padding: 'var(--spacing-md)',
          background: 'var(--fire-engine-red-bg)',
          color: 'var(--fire-engine-red)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 'var(--spacing-md)',
          fontSize: 'var(--font-size-small)',
        }}>
          {error}
        </div>
      )}

      {/* Search Results */}
      {searching && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: 'var(--spacing-xl)',
        }}>
          <div className="loading-spinner" />
        </div>
      )}

      {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 'var(--spacing-xl)',
          color: 'var(--color-text-muted)',
        }}>
          Ingen brukere funnet
        </div>
      )}

      {!searching && searchResults.length > 0 && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-md)',
        }}>
          {searchResults.map((user) => (
            <SearchResultItem
              key={user.id}
              user={user}
              status={getUserStatus(user.id)}
              onSendRequest={handleSendRequest}
              loading={friendsLoading}
            />
          ))}
        </div>
      )}

      {searchQuery.length > 0 && searchQuery.length < 2 && (
        <div style={{
          textAlign: 'center',
          padding: 'var(--spacing-xl)',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-small)',
        }}>
          Skriv minst 2 tegn for å søke
        </div>
      )}
    </div>
  );
}
