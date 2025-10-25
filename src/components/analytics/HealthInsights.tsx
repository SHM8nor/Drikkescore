import { Box, Typography, Paper, Divider, Alert } from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import LocalBarIcon from '@mui/icons-material/LocalBar';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import type { WHOComparisonData } from '../../types/analytics';
import type { Gender } from '../../types/database';
import {
  getRiskLevelColor,
  getRiskLevelDescription,
  getHealthRecommendation,
  getRecommendedMaxDrinksPerSession,
} from '../../utils/whoGuidelines';

interface HealthInsightsProps {
  whoData: WHOComparisonData;
  gender: Gender;
}

/**
 * HealthInsights Component
 *
 * Displays health recommendations and actionable insights based on WHO guidelines.
 * Shows risk level assessment, recommended max drinks per session, and personalized
 * health advice to help users make informed decisions about their alcohol consumption.
 *
 * @param whoData - WHO comparison data with risk level and consumption metrics
 * @param gender - User's gender for personalized recommendations
 */
export default function HealthInsights({ whoData, gender }: HealthInsightsProps) {
  const { riskLevel, percentageOfLimit, weeklyGrams, whoLimitGrams } = whoData;

  const riskColor = getRiskLevelColor(riskLevel);
  const riskDescription = getRiskLevelDescription(riskLevel);
  const healthRecommendation = getHealthRecommendation(riskLevel);
  const recommendedMaxDrinks = getRecommendedMaxDrinksPerSession(gender);

  // Calculate how much to reduce consumption if over limit
  const excessGrams = Math.max(0, weeklyGrams - whoLimitGrams);
  const excessDrinks = Math.ceil(excessGrams / 14); // Convert to standard drinks

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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <HealthAndSafetyIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Helseinnsikt
          </Typography>
        </Box>

        <Divider />

        {/* Risk Level Status */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <TrendingUpIcon sx={{ fontSize: 20, color: riskColor }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Ditt risikonivå
            </Typography>
          </Box>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: `${riskColor}15`,
              border: `2px solid ${riskColor}`,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: riskColor,
                mb: 0.5,
              }}
            >
              {riskDescription}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Du er på {percentageOfLimit}% av WHOs ukentlige anbefaling
            </Typography>
          </Box>
        </Box>

        {/* Health Recommendation */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <InfoOutlinedIcon sx={{ fontSize: 20, color: 'info.main' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Anbefaling
            </Typography>
          </Box>
          <Alert
            severity={riskLevel === 'low' ? 'success' : riskLevel === 'moderate' ? 'info' : riskLevel === 'high' ? 'warning' : 'error'}
            sx={{
              '& .MuiAlert-message': {
                width: '100%',
              },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {healthRecommendation}
            </Typography>
          </Alert>
        </Box>

        {/* Recommended Max Drinks Per Session */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <LocalBarIcon sx={{ fontSize: 20, color: 'secondary.main' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Anbefalt maksimum per økt
            </Typography>
          </Box>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: 'rgba(0, 48, 73, 0.05)',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                mb: 0.5,
              }}
            >
              {recommendedMaxDrinks} enheter
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              WHO anbefaler maks {recommendedMaxDrinks} standardenheter per drikkeanledning for {gender === 'male' ? 'menn' : 'kvinner'}
            </Typography>
          </Box>
        </Box>

        {/* Actionable Advice if over limit */}
        {percentageOfLimit > 100 && (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 1.5 }}>
              Hvordan redusere forbruket
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: 'rgba(247, 127, 0, 0.05)',
                border: '1px solid #f77f00',
              }}
            >
              <Typography variant="body2" sx={{ color: 'text.primary', mb: 1.5, fontWeight: 500 }}>
                For å komme innenfor WHOs anbefalinger, bør du redusere med:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#f77f00',
                    }}
                  />
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>
                    <strong>{excessGrams}g</strong> alkohol per uke
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      backgroundColor: '#f77f00',
                    }}
                  />
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>
                    Tilsvarer ca. <strong>{excessDrinks} enheter</strong> mindre per uke
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* Positive reinforcement if within limit */}
        {percentageOfLimit <= 50 && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: 'rgba(4, 120, 87, 0.1)',
              border: '1px solid #047857',
            }}
          >
            <Typography variant="body2" sx={{ color: '#047857', fontWeight: 600, mb: 0.5 }}>
              Bra jobbet!
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Du holder deg godt innenfor helseretningslinjene. Fortsett med moderat inntak.
            </Typography>
          </Box>
        )}

        {/* General Health Tips */}
        <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
            Helsetips
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.813rem', lineHeight: 1.6 }}>
            Ha alkoholfrie dager hver uke. Drikk vann mellom alkoholholdige drikker. Unngå binge drinking.
            Søk hjelp hvis du bekymrer deg over ditt alkoholforbruk.
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
