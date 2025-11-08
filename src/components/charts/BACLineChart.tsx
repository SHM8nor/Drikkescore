import { useEffect, useMemo, useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { axisClasses } from "@mui/x-charts/ChartsAxis";
import type { Profile, DrinkEntry } from "../../types/database";
import { prepareLineChartData } from "../../utils/chartHelpers";
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
 * Default color palette for participant lines
 * Colors chosen for good contrast and accessibility
 */
const CHART_COLORS = [
  "#1976d2", // Blue
  "#d32f2f", // Red
  "#388e3c", // Green
  "#f57c00", // Orange
  "#7b1fa2", // Purple
  "#0097a7", // Cyan
  "#c2185b", // Pink
  "#fbc02d", // Yellow
  "#5d4037", // Brown
  "#455a64", // Blue Grey
];

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
  const [chartKey, setChartKey] = useState(0);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);

  const participantColors = useMemo(() => {
    const colors = new Map<string, string>();
    participants.forEach((participant, index) => {
      const color =
        participant.id === currentUserId
          ? "#1976d2"
          : CHART_COLORS[index % CHART_COLORS.length];
      colors.set(participant.id, color);
    });
    return colors;
  }, [participants, currentUserId]);

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
    const series = prepareLineChartData(
      displayParticipants,
      drinks,
      sessionStartTime,
      currentTime
    );

    // Assign colors to participants
    const colors = displayParticipants.map((participant) => {
      return participantColors.get(participant.id) ?? "#1976d2";
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
  ]);

  // Force a re-render when core inputs change so the chart is ready without manual toggling
  useEffect(() => {
    setChartKey((prev) => prev + 1);
  }, [view, participants.length, drinks.length, selectedParticipantId]);

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 300,
          color: "#666",
          fontSize: "14px",
        }}
      >
        Ingen promilledata tilgjengelig ennǿ. Legg til noen enheter for Ǿ se
        grafen!
      </div>
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
      data: alignedData,
      label: s.label,
      color: chartData.colors[index],
      connectNulls: true, // Connect the line even if there are null values
      curve: 'monotoneX' as const, // Smooth curve interpolation (monotone to avoid overshooting)
    };
  });

  const legendItems = participants.map((participant) => ({
    id: participant.id,
    label: participant.display_name,
    color: participantColors.get(participant.id) ?? "#1976d2",
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
        key={chartKey}
        height={360}
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
        margin={{ top: 20, right: 32, bottom: 60, left: 72 }}
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
            transform: "translateX(-10px)",
          },
          "& .MuiLineElement-root": {
            strokeWidth: 2,
          },
          "& .MuiMarkElement-root": {
            scale: "0.8",
            strokeWidth: 2,
          },
          "& .MuiChartsAxis-label": {
            fontSize: "14px",
            fontWeight: 500,
          },
          "& .MuiChartsAxis-tickLabel": {
            fontSize: "12px",
          },
        }}
      />
    </div>
  );
}
