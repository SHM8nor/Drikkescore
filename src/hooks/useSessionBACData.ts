import { useMemo } from 'react';
import { calculateBAC } from '../utils/bacCalculator';
import { useSessionDetail } from './useSessionDetail';
import type { DrinkEntry } from '../types/database';

export interface BACTimeSeriesData {
  userId: string;
  userName: string;
  avatarUrl?: string;
  data: Array<{
    time: string;
    bac: number;
  }>;
  peakBAC: number;
  peakTime: string | null;
}

interface UseSessionBACDataReturn {
  bacData: BACTimeSeriesData[];
  loading: boolean;
  error: string | null;
}

/**
 * Generate time points for BAC calculation throughout the session
 * Returns timestamps at regular intervals from session start to end (or now)
 *
 * @param startTime - Session start time
 * @param endTime - Session end time
 * @param intervalMinutes - Interval between data points in minutes (default: 5)
 * @returns Array of Date objects representing time points
 */
function generateTimePoints(
  startTime: Date,
  endTime: Date,
  intervalMinutes: number = 5,
): Date[] {
  const timePoints: Date[] = [];
  const now = new Date();
  const effectiveEndTime = endTime < now ? endTime : now;

  const startMs = startTime.getTime();
  const endMs = effectiveEndTime.getTime();
  const intervalMs = intervalMinutes * 60 * 1000;

  for (let time = startMs; time <= endMs; time += intervalMs) {
    timePoints.push(new Date(time));
  }

  // Always include the current time if session is ongoing
  if (effectiveEndTime.getTime() === now.getTime() && timePoints.length > 0) {
    const lastPoint = timePoints[timePoints.length - 1];
    if (lastPoint.getTime() !== now.getTime()) {
      timePoints.push(now);
    }
  }

  return timePoints;
}

/**
 * Calculate BAC time-series data for all participants in a session
 * Provides data points at regular intervals for charting BAC over time
 *
 * @param sessionId - The session ID to calculate BAC data for
 * @returns BAC time-series data for each participant
 */
export function useSessionBACData(sessionId: string): UseSessionBACDataReturn {
  const { session, participants, drinks, loading, error } = useSessionDetail(sessionId);

  const bacData = useMemo<BACTimeSeriesData[]>(() => {
    if (!session || !participants.length) {
      return [];
    }

    const sessionStart = new Date(session.start_time);
    const sessionEnd = new Date(session.end_time);

    // Generate time points (every 5 minutes)
    const timePoints = generateTimePoints(sessionStart, sessionEnd, 5);

    // Group drinks by user
    const drinksByUser = new Map<string, DrinkEntry[]>();
    drinks.forEach((drink) => {
      const userDrinks = drinksByUser.get(drink.user_id) || [];
      userDrinks.push(drink);
      drinksByUser.set(drink.user_id, userDrinks);
    });

    // Calculate BAC time-series for each participant
    return participants.map((participant) => {
      const userDrinks = drinksByUser.get(participant.userId) || [];
      let peakBAC = 0;
      let peakTime: string | null = null;

      // Calculate BAC at each time point
      const bacTimeSeries = timePoints.map((timePoint) => {
        const bac = calculateBAC(userDrinks, participant.profile, timePoint);

        // Track peak BAC and when it occurred
        if (bac > peakBAC) {
          peakBAC = bac;
          peakTime = timePoint.toISOString();
        }

        return {
          time: timePoint.toISOString(),
          bac,
        };
      });

      return {
        userId: participant.userId,
        userName: participant.profile.full_name,
        avatarUrl: participant.profile.avatar_url,
        data: bacTimeSeries,
        peakBAC,
        peakTime,
      };
    });
  }, [session, participants, drinks]);

  return {
    bacData,
    loading,
    error,
  };
}

/**
 * Calculate aggregate BAC statistics for a session
 *
 * @param bacData - BAC time-series data from useSessionBACData
 * @returns Aggregate statistics
 */
export function calculateSessionBACStats(bacData: BACTimeSeriesData[]) {
  if (bacData.length === 0) {
    return {
      averagePeakBAC: 0,
      maxPeakBAC: 0,
      totalParticipants: 0,
      participantsOverLimit: 0, // Over 0.8‰ driving limit
    };
  }

  const totalParticipants = bacData.length;
  const peakBACs = bacData.map((d) => d.peakBAC);
  const averagePeakBAC = peakBACs.reduce((sum, bac) => sum + bac, 0) / totalParticipants;
  const maxPeakBAC = Math.max(...peakBACs);
  const participantsOverLimit = bacData.filter((d) => d.peakBAC >= 0.8).length;

  return {
    averagePeakBAC,
    maxPeakBAC,
    totalParticipants,
    participantsOverLimit,
  };
}
