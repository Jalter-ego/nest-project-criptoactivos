export class RiskMetrics {
  sortinoRatio: number;
  sharpeRatio: number;
  averageReturn: number;
  volatility: number;
  downsideVolatility: number;
  totalReturn: number;
  maxDrawdown: number;
  dataPoints: number;
  periodDays: number;
  riskFreeRate: number;
  message?: string;
}
