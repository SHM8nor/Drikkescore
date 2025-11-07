export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    profile: (userId?: string | null) => ['auth', 'profile', userId ?? 'anonymous'] as const,
    recap: (userId?: string | null) => ['auth', 'recap', userId ?? 'anonymous'] as const,
  },
  analytics: {
    root: ['analytics'] as const,
    period: (userId?: string | null, period: string = '30days') =>
      ['analytics', userId ?? 'anonymous', period] as const,
  },
  drinkPrices: {
    root: ['drinkPrices'] as const,
    list: (userId?: string | null) => ['drinkPrices', userId ?? 'anonymous'] as const,
  },
  friends: {
    root: ['friends'] as const,
    list: (userId?: string | null) => ['friends', 'list', userId ?? 'anonymous'] as const,
    pending: (userId?: string | null) => ['friends', 'pending', userId ?? 'anonymous'] as const,
    sent: (userId?: string | null) => ['friends', 'sent', userId ?? 'anonymous'] as const,
  },
  sessions: {
    root: ['sessions'] as const,
    active: (userId?: string | null) => ['sessions', 'active', userId ?? 'anonymous'] as const,
    history: (userId?: string | null) => ['sessions', 'history', userId ?? 'anonymous'] as const,
    recap: (userId?: string | null) => ['sessions', 'recap', userId ?? 'anonymous'] as const,
    detail: (sessionId?: string | null) => ['sessions', 'detail', sessionId ?? 'unknown'] as const,
    participants: (sessionId?: string | null) => [
      'sessions',
      'participants',
      sessionId ?? 'unknown',
    ] as const,
    drinks: (sessionId?: string | null) => ['sessions', 'drinks', sessionId ?? 'unknown'] as const,
    admin: ['sessions', 'admin'] as const,
    activeUsers: (sessionId?: string | null) => [
      'sessions',
      'activeUsers',
      sessionId ?? 'unknown',
    ] as const,
  },
};

export type QueryKey = ReturnType<
  | typeof queryKeys.auth.profile
  | typeof queryKeys.auth.recap
  | typeof queryKeys.analytics.period
  | typeof queryKeys.drinkPrices.list
  | typeof queryKeys.friends.list
  | typeof queryKeys.friends.pending
  | typeof queryKeys.friends.sent
  | typeof queryKeys.sessions.active
  | typeof queryKeys.sessions.history
  | typeof queryKeys.sessions.recap
  | typeof queryKeys.sessions.detail
  | typeof queryKeys.sessions.participants
  | typeof queryKeys.sessions.drinks
  | typeof queryKeys.sessions.activeUsers
>;
