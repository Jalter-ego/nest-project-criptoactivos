// src/services/ai-insights.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CoinbaseService } from 'src/events/coinbase/coinbase.service';

@Injectable()
export class AiInsightsService {
  constructor(
    private prisma: PrismaService,
    private coinbaseService: CoinbaseService,
  ) {}

  async getPortfolioInsights(portafolioId: string) {
    const portfolio = await this.prisma.portafolio.findUnique({
      where: { id: portafolioId },
      include: { holdings: true },
    });

    if (!portfolio) throw new Error('Portfolio not found');

    // Concentration data
    let totalValue = portfolio.cash;
    const concentrationData: { name: string; value: number }[] = [
      { name: 'Cash', value: portfolio.cash },
    ];
    for (const holding of portfolio.holdings) {
      const price = await this.coinbaseService.getCurrentPrice(
        holding.activeSymbol,
      );
      const value = holding.quantity * price;
      totalValue += value;
      concentrationData.push({ name: holding.activeSymbol, value });
    }

    // Normalize to %
    const concentrationPercent = concentrationData.map((d) => ({
      ...d,
      value: (d.value / totalValue) * 100,
    }));

    // Costs data (agrupa feedbacks COST_ANALYSIS por mes, extrae $ de message o usa campo si agregas)
    const costFeedbacks = await this.prisma.feedback.findMany({
      where: { portafolioId, type: 'COST_ANALYSIS' },
      orderBy: { createdAt: 'asc' },
    });
    // Mock parse: asume message tiene "$X.XX" – usa regex en prod
    const monthlyCosts = costFeedbacks.reduce(
      (acc, fb) => {
        const month = new Date(fb.createdAt).toLocaleDateString('es', {
          month: 'short',
        });
        const costMatch = fb.message.match(/\$([\d.]+)/);
        const cost = costMatch ? parseFloat(costMatch[1]) : 0;
        acc[month] = (acc[month] || 0) + cost;
        return acc;
      },
      {} as Record<string, number>,
    );

    const costsData = Object.entries(monthlyCosts).map(([month, costs]) => ({
      month,
      costs,
    }));

    return {
      concentrationData: concentrationPercent,
      costsData,
      totalFeedbacks: costFeedbacks.length, // Ejemplo
    };
  }
}
