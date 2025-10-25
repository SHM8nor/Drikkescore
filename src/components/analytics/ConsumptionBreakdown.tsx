import { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Divider,
  Chip,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  LocalPizza as PizzaIcon,
  Fastfood as FastfoodIcon,
  Science as ScienceIcon,
  LocalBar as LocalBarIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { getCalorieFoodComparison } from '../../utils/calorieCalculator';
import { convertGramsToBeers } from '../../utils/chartHelpers';

interface ConsumptionBreakdownProps {
  totalCalories: number;
  totalAlcoholGrams: number;
  periodDays: number;
  drinkTypeBreakdown?: { type: string; count: number; percentage: number }[];
  isLoading?: boolean;
  error?: string | null;
}

/**
 * ConsumptionBreakdown Component
 *
 * Displays detailed consumption analysis including:
 * - Total calories with food comparisons
 * - Calories per day average
 * - Total alcohol in grams and beer units
 * - Drink type breakdown (optional)
 */
export default function ConsumptionBreakdown({
  totalCalories,
  totalAlcoholGrams,
  periodDays,
  drinkTypeBreakdown,
  isLoading = false,
  error = null,
}: ConsumptionBreakdownProps) {
  // Calculate food comparisons
  const foodComparisons = useMemo(() => {
    return getCalorieFoodComparison(totalCalories);
  }, [totalCalories]);

  // Calculate average calories per day
  const caloriesPerDay = useMemo(() => {
    if (periodDays === 0) return 0;
    return Math.round(totalCalories / periodDays);
  }, [totalCalories, periodDays]);

  // Convert alcohol to beer units
  const totalBeerUnits = useMemo(() => {
    return convertGramsToBeers(totalAlcoholGrams);
  }, [totalAlcoholGrams]);

  // Loading state
  if (isLoading) {
    return (
      <Card
        sx={{
          boxShadow: 'var(--shadow-md)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 200,
            }}
          >
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card
        sx={{
          boxShadow: 'var(--shadow-md)',
          borderRadius: 'var(--radius-md)',
          borderLeft: '4px solid var(--fire-engine-red)',
        }}
      >
        <CardContent>
          <Typography
            sx={{
              color: 'var(--fire-engine-red)',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            {error}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        boxShadow: 'var(--shadow-md)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <CardContent>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--color-text-primary)',
            marginBottom: 2,
          }}
        >
          Forbruksanalyse
        </Typography>

        <Grid container spacing={3}>
          {/* Calorie Section */}
          <Grid size={{ xs: 12 }}>
            <Box
              sx={{
                backgroundColor: 'var(--orange-wheel-bg)',
                borderRadius: 'var(--radius-md)',
                padding: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <RestaurantIcon
                  sx={{ color: 'var(--orange-wheel)', fontSize: 20 }}
                />
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Totalt kaloriinntak
                </Typography>
              </Box>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--orange-wheel)',
                  marginBottom: 1,
                }}
              >
                {totalCalories.toLocaleString('nb-NO')} kcal
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: 'var(--color-text-secondary)',
                  fontSize: '13px',
                  marginBottom: 1.5,
                }}
              >
                Gjennomsnitt: {caloriesPerDay} kcal per dag
              </Typography>

              <Divider sx={{ marginY: 1.5 }} />

              <Typography
                variant="body2"
                sx={{
                  color: 'var(--color-text-secondary)',
                  fontSize: '13px',
                  fontWeight: 'var(--font-weight-medium)',
                  marginBottom: 1,
                }}
              >
                Dette tilsvarer:
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FastfoodIcon sx={{ fontSize: 18, color: 'var(--orange-wheel)' }} />
                  <Typography
                    variant="body2"
                    sx={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}
                  >
                    <strong>{foodComparisons.hamburgers}</strong> hamburgere
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PizzaIcon sx={{ fontSize: 18, color: 'var(--orange-wheel)' }} />
                  <Typography
                    variant="body2"
                    sx={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}
                  >
                    <strong>{foodComparisons.pizzaSlices}</strong> pizzabiter
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RestaurantIcon sx={{ fontSize: 18, color: 'var(--orange-wheel)' }} />
                  <Typography
                    variant="body2"
                    sx={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}
                  >
                    <strong>{foodComparisons.chocolateBars}</strong> sjokolader
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Alcohol Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                backgroundColor: 'var(--prussian-blue-bg)',
                borderRadius: 'var(--radius-md)',
                padding: 2,
                height: '100%',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ScienceIcon
                  sx={{ color: 'var(--prussian-blue)', fontSize: 20 }}
                />
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Rent alkohol
                </Typography>
              </Box>

              <Typography
                variant="h5"
                sx={{
                  fontWeight: 'var(--font-weight-bold)',
                  color: 'var(--prussian-blue)',
                }}
              >
                {totalAlcoholGrams.toFixed(1)} g
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  color: 'var(--color-text-muted)',
                  fontSize: '12px',
                  marginTop: 0.5,
                }}
              >
                Totalt rent alkohol konsumert
              </Typography>
            </Box>
          </Grid>

          {/* Beer Units Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                backgroundColor: 'var(--xanthous-bg)',
                borderRadius: 'var(--radius-md)',
                padding: 2,
                height: '100%',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LocalBarIcon
                  sx={{ color: 'var(--xanthous-dark)', fontSize: 20 }}
                />
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Alkoholenheter
                </Typography>
              </Box>

              <Tooltip
                title="1 enhet = 13.035g rent alkohol (1 flaske 5% øl på 330ml)"
                placement="top"
                arrow
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 'var(--font-weight-bold)',
                    color: 'var(--xanthous-dark)',
                    cursor: 'help',
                  }}
                >
                  {totalBeerUnits.toFixed(1)} enheter
                </Typography>
              </Tooltip>

              <Typography
                variant="body2"
                sx={{
                  color: 'var(--color-text-muted)',
                  fontSize: '12px',
                  marginTop: 0.5,
                }}
              >
                Basert på standardenhet
              </Typography>
            </Box>
          </Grid>

          {/* Drink Type Breakdown (Optional) */}
          {drinkTypeBreakdown && drinkTypeBreakdown.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ marginY: 1 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <TrendingUpIcon
                  sx={{ color: 'var(--color-text-secondary)', fontSize: 20 }}
                />
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Drikkefordeling
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                {drinkTypeBreakdown.map((drink, index) => (
                  <Chip
                    key={index}
                    label={`${drink.type}: ${drink.count} (${drink.percentage}%)`}
                    size="small"
                    sx={{
                      backgroundColor: 'var(--vanilla)',
                      color: 'var(--color-text-primary)',
                      fontWeight: 'var(--font-weight-medium)',
                      fontSize: '12px',
                    }}
                  />
                ))}
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Educational Note */}
        <Box
          sx={{
            marginTop: 2,
            padding: 1.5,
            backgroundColor: 'var(--vanilla-light)',
            borderRadius: 'var(--radius-sm)',
            borderLeft: '3px solid var(--prussian-blue)',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
            }}
          >
            💡 <strong>Visste du at:</strong> Kroppen prioriterer å brenne alkohol
            fremfor andre næringsstoffer, noe som kan påvirke fettnedbrytningen.
            Alkoholkalorier gir ingen ernæringsverdi.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
