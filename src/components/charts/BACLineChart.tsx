import { useEffect, useMemo, useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { axisClasses } from "@mui/x-charts/ChartsAxis";
import { useTheme } from "@mui/material/styles";
import { Box } from "@mui/material";
import type { Profile, DrinkEntry } from "../../types/database";
import { prepareLineChartData } from "../../utils/chartHelpers";
import { getChartColors, getEmptyStateStyles } from "../../utils/chartTheme";
import "../../styles/components/bac-line-chart.css";

interface BACLineChartProps {
  participants: Profile[];
  drinks: DrinkEntry[];
  sessionStartTime: Date;
  sessionEndTime: Date;
  currentUserId: string;
  view: "all" | "self";
}

/**
 * BACLineChart Component
 *
 * Displays BAC evolution over time for session participants using MUI LineChart.
 * Shows one colored line per participant with their BAC progression from session start.
 * Uses dense sampling (5-minute intervals) to accurately represent BAC absorption curves
 * and elimination slopes, ensuring peaks and valleys are visible even between drink entries.
 *
 * The x-axis dynamically adjusts: for active sessions, it shows from start to current time
 * (+ 5 min buffer); for completed sessions, it shows the full duration.
 *
 * @param participants - Array of participant profiles
 * @param drinks - Array of all drink entries in the session
 * @param sessionStartTime - Session start timestamp
 * @param sessionEndTime - Session end timestamp (used to determine if session is active)
 * @param currentUserId - ID of the current user (to highlight their line)
 * @param view - Display mode: 'all' shows all participants, 'self' shows only current user
 */
export default function BACLineChart({
  participants,
  drinks,
  sessionStartTime,
  sessionEndTime,
  currentUserId,
  view,
}: BACLineChartProps) {
  const theme = useTheme();
  
  // Memoize chart colors to prevent recreation on every render
  const CHART_COLORS = useMemo(() => getChartColors(theme), [theme]);

  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);

  const participantColors = useMemo(() => {
    const colors = new Map<string, string>();
    participants.forEach((participant, index) => {
      const color =
        participant.id === currentUserId
          ? CHART_COLORS[0]
          : CHART_COLORS[index % CHART_COLORS.length];
      colors.set(participant.id, color);
    });
    return colors;
  }, [participants, currentUserId, CHART_COLORS]);

  // Prepare chart data using memoization for performance
  const chartData = useMemo(() => {
    const currentTime = new Date();

    // Calculate total session duration in minutes
    const sessionDurationMinutes = Math.ceil(
      (sessionEndTime.getTime() - sessionStartTime.getTime()) / (1000 * 60)
    );

    // Calculate x-axis max based on session status
    // For active sessions: show only up to current time + 5 min buffer
    // For completed sessions: show full duration
    const isSessionActive = currentTime < sessionEndTime;
    const minutesSinceStart = Math.ceil(
      (currentTime.getTime() - sessionStartTime.getTime()) / (1000 * 60)
    );
    const xAxisMax = isSessionActive
      ? Math.min(minutesSinceStart + 5, sessionDurationMinutes)
      : sessionDurationMinutes;

    // Filter participants based on view mode + custom selection
    let displayParticipants =
      view === "self"
        ? participants.filter((p) => p.id === currentUserId)
        : participants;

    if (selectedParticipantId && view === "all") {
      const selectedParticipant = participants.find((p) => p.id === selectedParticipantId);
      if (selectedParticipant) {
        displayParticipants = [selectedParticipant];
      }
    }

    // Generate line chart series for each participant
    // Use sessionEndTime for completed sessions to show historical BAC data
    const referenceTime = isSessionActive ? currentTime : sessionEndTime;
    const series = prepareLineChartData(
      displayParticipants,
      drinks,
      sessionStartTime,
      referenceTime
    );

    // Assign colors to participants
    const colors = displayParticipants.map((participant) => {
      return participantColors.get(participant.id) ?? CHART_COLORS[0];
    });

    return { series, colors, xAxisMax };
  }, [
    participants,
    drinks,
    sessionStartTime,
    sessionEndTime,
    currentUserId,
    view,
    selectedParticipantId,
    participantColors,
    CHART_COLORS,
  ]);

  // Reset selection when switching away from "all" view
  useEffect(() => {
    if (view !== "all" && selectedParticipantId) {
      setSelectedParticipantId(null);
    }
  }, [view, selectedParticipantId]);

  // Reset selection if participant list changes and selected participant disappears
  useEffect(() => {
    if (
      selectedParticipantId &&
      !participants.some((participant) => participant.id === selectedParticipantId)
    ) {
      setSelectedParticipantId(null);
    }
  }, [participants, selectedParticipantId]);

  // Handle empty state
  if (chartData.series.length === 0) {
    return (
      <Box sx={getEmptyStateStyles(theme)}>
        Ingen promilledata tilgjengelig ennå. Legg til noen enheter for å se
        grafen!
      </Box>
    );
  }

  // Create x-axis data from all unique x values across all series
  const allXValues = new Set<number>();
  chartData.series.forEach((s) => {
    s.data.forEach((point) => allXValues.add(point.x));
  });
  const xAxisData = Array.from(allXValues).sort((a, b) => a - b);

  // Align each series data to the x-axis
  const seriesConfig = chartData.series.map((s, index) => {
    // Create a map of x -> y for this series
    const dataMap = new Map(s.data.map((point) => [point.x, point.y]));

    // For each x value in the axis, get the corresponding y value or null
    const alignedData = xAxisData.map((x) => dataMap.get(x) ?? null);

    return {
      type: 'line' as const,
      data: alignedData,
      label: s.label,
      color: chartData.colors[index],
      connectNulls: true, // Connect the line even if there are null values
      curve: 'monotoneX' as const, // Smooth curve interpolation (monotone to avoid overshooting)
      showMark: false, // Hide markers - with dense sampling (36+ points) they would clutter the graph
      valueFormatter: (value: number | null) => {
        return value !== null ? `${value.toFixed(3)}‰` : '';
      },
    };
  });

  const legendItems = participants.map((participant) => ({
    id: participant.id,
    label: participant.display_name,
    color: participantColors.get(participant.id) ?? CHART_COLORS[0],
    isSelected: selectedParticipantId === participant.id,
  }));

  const handleLegendClick = (participantId: string) => {
    if (view !== "all") {
      return;
    }
    setSelectedParticipantId((prev) => (prev === participantId ? null : participantId));
  };

  return (
    <div className="bac-line-chart">
      {legendItems.length > 0 && (
        <div className="bac-line-chart__legend" aria-label="Deltakerforklaring">
          {legendItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className="bac-line-chart__legend-item"
              data-selected={item.isSelected}
              data-disabled={view !== "all"}
              onClick={() => handleLegendClick(item.id)}
            >
              <span
                className="bac-line-chart__legend-mark"
                style={{ backgroundColor: item.color }}
              />
              <span className="bac-line-chart__legend-label">{item.label}</span>
            </button>
          ))}
        </div>
      )}
      <LineChart
        height={parseInt(theme.spacing(45))}
        xAxis={[
          {
            data: xAxisData,
            label: "Tid",
            min: 0,
            max: chartData.xAxisMax,
            scaleType: "linear",
            valueFormatter: (value) => {
              // Convert minutes offset to actual time (HH:MM format)
              const timeInMs =
                sessionStartTime.getTime() + (value as number) * 60 * 1000;
              const date = new Date(timeInMs);
              const hours = date.getHours().toString().padStart(2, "0");
              const minutes = date.getMinutes().toString().padStart(2, "0");
              return `${hours}:${minutes}`;
            },
          },
        ]}
        yAxis={[
          {
            label: "Promille",
            min: 0,
          },
        ]}
        series={seriesConfig}
        margin={{
          top: parseInt(theme.spacing(2.5)),
          right: parseInt(theme.spacing(4)),
          bottom: parseInt(theme.spacing(7.5)),
          left: parseInt(theme.spacing(9))
        }}
        grid={{ vertical: false, horizontal: true }}
        axisHighlight={{ x: "none", y: "none" }}
        tooltip={{ trigger: "none" }}
        slotProps={{
          legend: {
            hidden: true,
          },
        }}
        sx={{
          width: "100%",
          height: "100%",
          flex: 1,
          [`& .${axisClasses.left} .${axisClasses.label}`]: {
            transform: `translateX(-${theme.spacing(1.25)})`,
          },
          "& .MuiLineElement-root": {
            strokeWidth: parseInt(theme.spacing(0.25)),
          },
          "& .MuiMarkElement-root": {
            scale: "1.2",
            strokeWidth: parseInt(theme.spacing(0.25)),
            fill: "currentColor",
          },
          "& .MuiChartsAxis-label": {
            fontSize: theme.typography.body2.fontSize,
            fontWeight: theme.typography.fontWeightMedium,
            fill: theme.palette.text.primary,
          },
          "& .MuiChartsAxis-tickLabel": {
            fontSize: theme.typography.caption.fontSize,
            fill: theme.palette.text.secondary,
          },
          "& .MuiChartsGrid-line": {
            stroke: theme.palette.divider,
          },
        }}
      />
    </div>
  );
}
