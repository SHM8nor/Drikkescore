import { Box, Typography, LinearProgress, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { WHOComparisonData } from '../../types/analytics';
import { getRiskLevelColor, getRiskLevelDescription } from '../../utils/whoGuidelines';

interface WHOComparisonGaugeProps {
  whoData: WHOComparisonData;
}

/**
 * Styled LinearProgress component with custom colors based on risk level
 */
const RiskProgress = styled(LinearProgress, {
  shouldForwardProp: (prop) => prop !== 'riskColor',
})<{ riskColor: string }>(({ riskColor }) => ({
  height: 24,
  borderRadius: 12,
  backgroundColor: 'rgba(0, 0, 0, 0.08)',
  '& .MuiLinearProgress-bar': {
    backgroundColor: riskColor,
    borderRadius: 12,
    transition: 'transform 0.4s ease-in-out, background-color 0.3s ease',
  },
}));

/**
 * WHOComparisonGauge Component
 *
 * Visual gauge showing WHO comparison data with color-coded risk levels.
 * Displays current weekly consumption as a percentage of WHO recommended limits.
 * Uses a linear progress bar with color coding for visual impact.
 *
 * @param whoData - WHO comparison data with risk level and consumption metrics
 */
export default function WHOComparisonGauge({ whoData }: WHOComparisonGaugeProps) {
  const { weeklyGrams, whoLimitGrams, riskLevel, percentageOfLimit } = whoData;

  // Get color based on risk level
  const riskColor = getRiskLevelColor(riskLevel);
  const riskDescription = getRiskLevelDescription(riskLevel);

  // Calculate display percentage (cap at 100% for progress bar, but show actual value)
  const displayPercentage = Math.min(percentageOfLimit, 100);

  // Convert grams to standard drinks for display (1 standard drink ≈ 14g alcohol)
  const currentDrinks = Math.round(weeklyGrams / 14);
  const maxDrinks = Math.round(whoLimitGrams / 14);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        backgroundColor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            WHO-sammenligning
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: riskColor,
            }}
          >
            {percentageOfLimit}%
          </Typography>
        </Box>

        {/* Progress Bar Gauge */}
        <Box sx={{ position: 'relative', mt: 1 }}>
          <RiskProgress
            variant="determinate"
            value={displayPercentage}
            riskColor={riskColor}
          />
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: displayPercentage > 40 ? 'white' : 'text.primary',
                textShadow: displayPercentage > 40 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
              }}
            >
              {currentDrinks} / {maxDrinks} enheter
            </Typography>
          </Box>
        </Box>

        {/* Risk Level Badge */}
        <Box
          sx={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            px: 2,
            py: 1,
            borderRadius: 2,
            backgroundColor: `${riskColor}15`,
            border: `2px solid ${riskColor}`,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: riskColor,
            }}
          >
            {riskDescription}
          </Typography>
        </Box>

        {/* Detailed Stats */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 2,
            mt: 1,
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Ukentlig forbruk
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {weeklyGrams}g
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              WHO-grense
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {whoLimitGrams}g
            </Typography>
          </Box>
        </Box>

        {/* Warning if over limit */}
        {percentageOfLimit > 100 && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              backgroundColor: 'rgba(214, 40, 40, 0.1)',
              border: '1px solid #d62828',
            }}
          >
            <Typography variant="body2" sx={{ color: '#d62828', fontWeight: 500 }}>
              Du ligger {percentageOfLimit - 100}% over WHOs anbefalte grense
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
