import { useMemo } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { axisClasses } from "@mui/x-charts/ChartsAxis";
import type { Profile, DrinkEntry } from "../../types/database";
import {
  prepareBarChartData,
  calculateTotalAlcoholGrams,
  convertGramsToBeers,
} from "../../utils/chartHelpers";
import {
  getChartColors,
  getEmptyStateStyles,
  getBarLabelStyles,
  getLegendStyles,
  getTotalValueStyles,
  getChartContainerStyles,
} from "../../utils/chartTheme";

interface AlcoholConsumptionChartProps {
  participants: Profile[];
  drinks: DrinkEntry[];
  view: "per-participant" | "session-total";
  unit: "grams" | "beers";
  currentUserId?: string; // Optional: to match colors with BAC chart
}

/**
 * AlcoholConsumptionChart Component
 *
 * Displays alcohol consumption data using Material UI BarChart.
 * Supports two visualization modes:
 * - per-participant: Shows individual consumption for each participant
 * - session-total: Shows total session consumption as a single bar
 *
 * Units can be toggled between grams of pure alcohol and beer units.
 * 1 beer unit = 13.035g (330ml @ 5% ABV)
 */
export default function AlcoholConsumptionChart({
  participants,
  drinks,
  view,
  unit,
  currentUserId,
}: AlcoholConsumptionChartProps) {
  const theme = useTheme();
  const CHART_COLORS = getChartColors(theme);
  const emptyStateStyles = getEmptyStateStyles(theme);
  const barLabelStyles = getBarLabelStyles(theme);
  const legendStyles = getLegendStyles(theme);
  const totalValueStyles = getTotalValueStyles(theme);
  const containerStyles = getChartContainerStyles(theme);

  // Prepare chart data based on view mode
  const chartData = useMemo(() => {
    if (view === "per-participant") {
      // Use helper function to calculate per-participant data
      const data = prepareBarChartData(participants, drinks, unit);

      // Assign colors to match BAC chart
      return data.map((item, index) => {
        const participant = participants.find(
          (p) => p.display_name === item.participant
        );
        let color: string;

        if (currentUserId && participant?.id === currentUserId) {
          color = theme.palette.primary.main; // Primary color for current user
        } else {
          color = CHART_COLORS[index % CHART_COLORS.length];
        }

        return { ...item, color };
      });
    } else {
      // Calculate total session consumption
      const totalGrams = calculateTotalAlcoholGrams(drinks);
      const value =
        unit === "beers" ? convertGramsToBeers(totalGrams) : totalGrams;

      return [
        {
          participant: "Total",
          value: Math.round(value * 100) / 100,
          color: theme.palette.primary.main,
        },
      ];
    }
  }, [participants, drinks, view, unit, currentUserId, theme, CHART_COLORS]);

  // Format value for display based on unit
  const formatValue = (value: number): string => {
    if (unit === "beers") {
      return value.toFixed(1);
    }
    return value.toFixed(0);
  };

  // Get axis label based on unit
  const yAxisLabel = unit === "beers" ? "Antall enheter" : "Rent alkohol (g)";

  // Handle edge cases
  if (participants.length === 0) {
    return (
      <Box sx={emptyStateStyles}>
        Ingen deltakere i denne økten
      </Box>
    );
  }

  if (drinks.length === 0) {
    return (
      <Box sx={emptyStateStyles}>
        Ingen enheter registrert ennå
      </Box>
    );
  }

  // Prepare data in MUI BarChart format
  const xAxisData = chartData.map((d) => d.participant);

  // Create individual series for each participant to enable different colors
  const series = chartData.map((item, index) => {
    const data = new Array(chartData.length).fill(0);
    data[index] = item.value;

    return {
      data: data,
      label: item.participant,
      color: item.color,
      stack: "total", // Stack them so they appear in same position
      valueFormatter: (value: number | null) => {
        if (value === null || value === 0) return "";
        const formatted = formatValue(value);
        return unit === "beers" ? `${formatted} units` : `${formatted}g`;
      },
    };
  });

  return (
    <Box sx={containerStyles}>
      {/* Custom legend for per-participant view */}
      {view === "per-participant" && (
        <Box sx={legendStyles.container}>
          {chartData.map((item) => (
            <Box
              key={item.participant}
              sx={legendStyles.item}
            >
              <Box
                sx={{
                  ...legendStyles.colorBox,
                  backgroundColor: item.color,
                }}
              />
              <Typography sx={legendStyles.label}>
                {item.participant}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
      {/* Display total value prominently when in session-total view */}
      {view === "session-total" && chartData.length > 0 && (
        <Typography sx={totalValueStyles}>
          {formatValue(chartData[0].value)} {unit === "beers" ? "enheter" : "g"}
        </Typography>
      )}
      <BarChart
        xAxis={[
          {
            scaleType: "band",
            data: xAxisData,
            label: view === "per-participant" ? "Deltaker" : "",
          },
        ]}
        yAxis={[
          {
            label: yAxisLabel,
            valueFormatter: (value: number | null) => {
              if (value === null) return "";
              return formatValue(value);
            },
          },
        ]}
        series={series}
        margin={{
          top: parseInt(theme.spacing(2.5)),
          right: parseInt(theme.spacing(2.5)),
          bottom: parseInt(theme.spacing(7.5)),
          left: parseInt(theme.spacing(10))
        }}
        grid={{ vertical: false, horizontal: true }}
        axisHighlight={{ x: "none", y: "none" }}
        barLabel="value"
        slotProps={{
          barLabel: {
            style: barLabelStyles,
          },
        }}
        slots={{
          legend: () => null,
        }}
        sx={{
          width: "100%",
          height: "100%",
          flex: 1,
          [`& .${axisClasses.left} .${axisClasses.label}`]: {
            transform: `translateX(${theme.spacing(-1.25)})`,
          },
        }}
      />
    </Box>
  );
}
