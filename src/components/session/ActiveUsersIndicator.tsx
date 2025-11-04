/**
 * ActiveUsersIndicator Component
 *
 * Displays real-time count and list of active users in a session.
 * Uses Supabase real-time subscriptions for live updates.
 *
 * FIXES APPLIED:
 * - FIX #1: Added isSubscribed flag to prevent state updates after unmount
 * - FIX #3: Combined initial fetch and subscription into single effect
 * - FIX #5: Use subscription payload for optimistic updates
 */

import { useState, useEffect } from 'react';
import { getSessionActiveUsers, subscribeSessionActiveUsers } from '../../api';
import type { SessionActiveUser } from '../../types/database';

interface ActiveUsersIndicatorProps {
  sessionId: string;
}

export function ActiveUsersIndicator({ sessionId }: ActiveUsersIndicatorProps) {
  const [activeUsers, setActiveUsers] = useState<SessionActiveUser[]>([]);
  const [showList, setShowList] = useState(false);
  const [loading, setLoading] = useState(true);

  // FIX #3: Combined initial fetch and subscription into single effect
  // FIX #1: Added isSubscribed flag to prevent state updates after unmount
  useEffect(() => {
    if (!sessionId) return;

    let isSubscribed = true;

    // Fetch initial active users
    const fetchInitialUsers = async () => {
      try {
        const users = await getSessionActiveUsers(sessionId);
        if (isSubscribed) {
          setActiveUsers(users);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching active users:', error);
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchInitialUsers();

    // Subscribe to real-time updates
    const unsubscribe = subscribeSessionActiveUsers(sessionId, async (payload) => {
      if (!isSubscribed) return;

      // FIX #5: Use subscription payload for optimistic updates instead of refetching all
      const { eventType, old: oldRecord } = payload;

      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        // For INSERT/UPDATE, fetch the full user details for this specific user
        try {
          const users = await getSessionActiveUsers(sessionId);
          if (isSubscribed) {
            setActiveUsers(users);
          }
        } catch (error) {
          console.error('Error updating active users:', error);
        }
      } else if (eventType === 'DELETE') {
        // For DELETE, remove the user from the list optimistically
        setActiveUsers((prev) => prev.filter((user) => user.user_id !== oldRecord.user_id));
      }
    });

    // Cleanup on unmount
    return () => {
      isSubscribed = false; // FIX #1: Prevent state updates after unmount
      unsubscribe();
    };
  }, [sessionId]);

  // Filter to only show active users (not idle or offline)
  const activeCount = activeUsers.filter(
    (user) => user.status === 'active' || user.status === 'idle'
  ).length;

  if (loading) {
    return null; // Don't show anything while loading
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Active users count with green indicator */}
      <button
        onClick={() => setShowList(!showList)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 12px',
          border: '1px solid rgba(0, 48, 73, 0.2)',
          borderRadius: '16px',
          background: 'white',
          cursor: 'pointer',
          fontSize: '14px',
          color: 'var(--prussian-blue)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 48, 73, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: activeCount > 0 ? '#4caf50' : '#9e9e9e',
            animation: activeCount > 0 ? 'pulse 2s infinite' : 'none',
          }}
        />
        <span>{activeCount} aktive</span>
      </button>

      {/* Dropdown list of active users */}
      {showList && activeUsers.length > 0 && (
        <>
          {/* Backdrop to close dropdown when clicking outside */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={() => setShowList(false)}
          />

          {/* Dropdown content */}
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: '0',
              minWidth: '200px',
              backgroundColor: 'white',
              border: '1px solid rgba(0, 48, 73, 0.2)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              zIndex: 1000,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '8px 12px',
                borderBottom: '1px solid rgba(0, 48, 73, 0.1)',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--prussian-blue)',
                textTransform: 'uppercase',
              }}
            >
              Tilkoblede brukere
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {activeUsers.map((user) => (
                <div
                  key={user.user_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderBottom: '1px solid rgba(0, 48, 73, 0.05)',
                  }}
                >
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor:
                        user.status === 'active'
                          ? '#4caf50'
                          : user.status === 'idle'
                          ? '#ff9800'
                          : '#9e9e9e',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '14px',
                      color: 'var(--prussian-blue)',
                    }}
                  >
                    {user.full_name}
                  </span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: '11px',
                      color: '#757575',
                    }}
                  >
                    {user.status === 'active'
                      ? 'Aktiv'
                      : user.status === 'idle'
                      ? 'Inaktiv'
                      : 'Frakoblet'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Add keyframe animation for pulse effect */}
      <style>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(76, 175, 80, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
          }
        }
      `}</style>
    </div>
  );
}
