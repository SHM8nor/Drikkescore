import { useMemo } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { axisClasses } from "@mui/x-charts/ChartsAxis";
import { Box, Typography, useTheme } from "@mui/material";
import type { DrinkEntry, Profile } from "../../types/database";
import {
  getChartColors,
  getChartAxisStyles,
  getChartContainerStyles,
  getEmptyStateStyles,
  getLegendStyles,
} from "../../utils/chartTheme";

interface DrinkingTimelineChartProps {
  drinks: DrinkEntry[];
  participants: Profile[];
  sessionStartTime: Date;
  sessionEndTime: Date;
}

/**
 * Time bucket configuration
 * Default: 30-minute intervals
 */
const BUCKET_DURATION_MINUTES = 30;

interface TimeBucket {
  startMinute: number;
  endMinute: number;
  label: string;
}

interface ParticipantDrinkData {
  participantId: string;
  participantName: string;
  color: string;
  drinkCounts: number[];
}

/**
 * Generate time buckets for the session duration
 */
function generateTimeBuckets(
  sessionStartTime: Date,
  sessionEndTime: Date
): TimeBucket[] {
  const buckets: TimeBucket[] = [];
  const sessionDurationMinutes = Math.ceil(
    (sessionEndTime.getTime() - sessionStartTime.getTime()) / (1000 * 60)
  );

  for (
    let minute = 0;
    minute < sessionDurationMinutes;
    minute += BUCKET_DURATION_MINUTES
  ) {
    const startMinute = minute;
    const endMinute = Math.min(
      minute + BUCKET_DURATION_MINUTES,
      sessionDurationMinutes
    );

    // Calculate actual time for label
    const bucketStartTime = new Date(
      sessionStartTime.getTime() + startMinute * 60 * 1000
    );
    const hours = bucketStartTime.getHours().toString().padStart(2, "0");
    const minutes = bucketStartTime.getMinutes().toString().padStart(2, "0");
    const label = `${hours}:${minutes}`;

    buckets.push({
      startMinute,
      endMinute,
      label,
    });
  }

  return buckets;
}

/**
 * Calculate drink counts per participant per time bucket
 */
function calculateDrinkCounts(
  drinks: DrinkEntry[],
  participants: Profile[],
  timeBuckets: TimeBucket[],
  sessionStartTime: Date,
  chartColors: string[]
): ParticipantDrinkData[] {
  // Create a map of participant ID to their drink counts per bucket
  const participantData = new Map<string, number[]>();

  // Initialize all participants with zero counts
  participants.forEach((participant) => {
    participantData.set(
      participant.id,
      new Array(timeBuckets.length).fill(0)
    );
  });

  // Count drinks per participant per bucket
  drinks.forEach((drink) => {
    const drinkTime = new Date(drink.consumed_at);
    const minutesSinceStart = Math.floor(
      (drinkTime.getTime() - sessionStartTime.getTime()) / (1000 * 60)
    );

    // Find which bucket this drink belongs to
    const bucketIndex = timeBuckets.findIndex(
      (bucket) =>
        minutesSinceStart >= bucket.startMinute &&
        minutesSinceStart < bucket.endMinute
    );

    if (bucketIndex !== -1) {
      const counts = participantData.get(drink.user_id);
      if (counts) {
        counts[bucketIndex]++;
      }
    }
  });

  // Convert map to array and assign colors
  return participants.map((participant, index) => ({
    participantId: participant.id,
    participantName: participant.display_name,
    color: chartColors[index % chartColors.length],
    drinkCounts: participantData.get(participant.id) || [],
  }));
}

/**
 * DrinkingTimelineChart Component
 *
 * Visualizes when drinks were consumed during a drinking session using a stacked bar chart.
 * Each participant gets their own colored bar series, and time is divided into configurable
 * buckets (default 30 minutes).
 *
 * Features:
 * - Time-based x-axis with HH:MM formatting
 * - One bar series per participant with distinct colors from theme
 * - Handles edge cases: no drinks, no participants
 * - Fully responsive layout
 * - Uses MUI theme colors exclusively via chartTheme helpers
 *
 * @param drinks - Array of drink entries with timestamps and user IDs
 * @param participants - Array of participant profiles
 * @param sessionStartTime - Session start timestamp
 * @param sessionEndTime - Session end timestamp
 */
export default function DrinkingTimelineChart({
  drinks,
  participants,
  sessionStartTime,
  sessionEndTime,
}: DrinkingTimelineChartProps) {
  const theme = useTheme();
  const chartColors = getChartColors(theme);
  const axisStyles = getChartAxisStyles(theme);
  const containerStyles = getChartContainerStyles(theme);
  const emptyStateStyles = getEmptyStateStyles(theme);
  const legendStyles = getLegendStyles(theme);

  // Generate time buckets based on session duration
  const timeBuckets = useMemo(
    (): TimeBucket[] => generateTimeBuckets(sessionStartTime, sessionEndTime),
    [sessionStartTime, sessionEndTime]
  );

  // Calculate drink counts per participant per time bucket
  const chartData = useMemo(
    (): ParticipantDrinkData[] =>
      calculateDrinkCounts(
        drinks,
        participants,
        timeBuckets,
        sessionStartTime,
        chartColors
      ),
    [drinks, participants, timeBuckets, sessionStartTime, chartColors]
  );

  // Handle edge case: no drinks
  if (drinks.length === 0) {
    return (
      <Box sx={emptyStateStyles}>
        <Typography variant="body2">
          Ingen enheter registrert i denne sesjonen
        </Typography>
      </Box>
    );
  }

  // Handle edge case: no participants
  if (participants.length === 0) {
    return (
      <Box sx={emptyStateStyles}>
        <Typography variant="body2">Ingen deltakere i denne sesjonen</Typography>
      </Box>
    );
  }

  // Prepare x-axis data (time bucket labels)
  const xAxisData = timeBuckets.map((bucket) => bucket.label);

  // Create series for each participant
  const series = chartData.map((participantData) => ({
    type: "bar" as const,
    data: participantData.drinkCounts,
    label: participantData.participantName,
    color: participantData.color,
    stack: "total", // Stack bars on top of each other
    valueFormatter: (value: number | null) => {
      if (value === null || value === 0) return "";
      return `${value} enhet${value === 1 ? "" : "er"}`;
    },
  }));

  return (
    <Box sx={containerStyles}>
      {/* Custom legend showing all participants */}
      <Box sx={legendStyles.container}>
        {chartData.map((participantData) => (
          <Box key={participantData.participantId} sx={legendStyles.item}>
            <Box
              sx={{
                ...legendStyles.colorBox,
                backgroundColor: participantData.color,
              }}
            />
            <Typography sx={legendStyles.label}>
              {participantData.participantName}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Bar chart */}
      <BarChart
        xAxis={[
          {
            scaleType: "band",
            data: xAxisData,
            label: "Tid",
          },
        ]}
        yAxis={[
          {
            label: "Antall enheter",
            min: 0,
            valueFormatter: (value: number | null) => {
              if (value === null) return "";
              return Math.round(value).toString();
            },
          },
        ]}
        series={series}
        height={parseInt(theme.spacing(45))} // 360px
        margin={{
          top: parseInt(theme.spacing(2.5)), // 20px
          right: parseInt(theme.spacing(2.5)), // 20px
          bottom: parseInt(theme.spacing(7.5)), // 60px
          left: parseInt(theme.spacing(10)), // 80px
        }}
        grid={{ vertical: false, horizontal: true }}
        axisHighlight={{ x: "band", y: "none" }}
        slotProps={{
          legend: {
            hidden: true, // Use custom legend instead
          },
        }}
        sx={{
          width: "100%",
          height: "100%",
          flex: 1,
          [`& .${axisClasses.left} .${axisClasses.label}`]: {
            transform: `translateX(-${theme.spacing(1.25)})`, // -10px
          },
          [`& .${axisClasses.bottom} .${axisClasses.label}`]: {
            transform: `translateY(${theme.spacing(1)})`, // 8px
          },
          "& .MuiChartsAxis-label": {
            fontSize: axisStyles.label.fontSize,
            fontWeight: axisStyles.label.fontWeight,
          },
          "& .MuiChartsAxis-tickLabel": {
            fontSize: axisStyles.tickLabel.fontSize,
          },
        }}
      />
    </Box>
  );
}
