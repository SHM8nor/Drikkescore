// Analytics-related types for Personal Analytics feature

export interface DrinkPrice {
  id: string;
  user_id: string;
  drink_name: string;
  price_amount: number;
  currency: string;
  volume_ml?: number;
  alcohol_percentage?: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DrinkPriceFormData {
  drink_name: string;
  price_amount: number;
  currency?: string;
  volume_ml?: number;
  alcohol_percentage?: number;
  is_default?: boolean;
}

export interface PeriodStats {
  totalDrinks: number;
  totalSessions: number;
  totalAlcoholGrams: number;
  totalAlcoholBeers: number;
  totalCalories: number;
  totalSpent: number;
  averageBAC: number;
  peakBAC: number;
  averageDrinksPerSession: number;
}

export interface SessionAnalytics {
  session_id: string;
  session_name: string;
  session_date: string;
  drinks_count: number;
  total_alcohol_grams: number;
  peak_bac: number;
  average_bac: number;
  total_calories: number;
  total_spent: number;
  duration_hours: number;
}

export interface AnalyticsData {
  period: '7days' | '30days' | '90days' | 'all';
  stats: PeriodStats;
  sessions: SessionAnalytics[];
  bacTrend: { date: string; averageBAC: number; peakBAC: number }[];
  weeklyConsumption: { week: string; grams: number; beers: number; calories: number }[];
  monthlyConsumption: { month: string; grams: number; beers: number; calories: number }[];
}

export interface WHOComparisonData {
  weeklyGrams: number;
  whoLimitGrams: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  percentageOfLimit: number;
}
