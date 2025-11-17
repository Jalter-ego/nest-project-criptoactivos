/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CoinbaseService } from 'src/events/coinbase/coinbase.service';
import { fastApi } from 'src/api';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AiInsightsService {
  constructor(
    private prisma: PrismaService,
    private coinbaseService: CoinbaseService,
    private readonly httpService: HttpService,
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
      const price = this.coinbaseService.getCurrentPrice(
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

    const costFeedbacks = await this.prisma.feedback.findMany({
      where: { portafolioId, type: 'COST_ANALYSIS' },
      orderBy: { createdAt: 'asc' },
    });
    // Mock parse: asume message tiene "$X.XX" – usa regex en prod
    const weeklyCosts = costFeedbacks.reduce(
      (acc, fb) => {
        const year = fb.createdAt.getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const week = Math.ceil((fb.createdAt.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24 * 7));
        const period = `${year}-W${week.toString().padStart(2, '0')}`;
        
        const costMatch = fb.message.match(/\$([\d.]+)/);
        const cost = costMatch ? parseFloat(costMatch[1]) : 0;
        acc[period] = (acc[period] || 0) + cost;
        return acc;
      },
      {} as Record<string, number>,
    );
    
    const costsData = Object.entries(weeklyCosts).map(([period, costs]) => ({
      period,
      costs,
      periodType: 'week' as const,
    }));

    return {
      concentrationData: concentrationPercent,
      costsData,
      totalFeedbacks: costFeedbacks.length,
    };
  }

  async getSugerencia(portafolioId: string, symbol:string) {
    const portafolio = await this.prisma.portafolio.findFirst({
      where:{
        id: portafolioId
      }
    })

    if(!portafolio)
      throw new NotFoundException('portafolio no encontrado')

    const holdingOfActive = await this.prisma.holding.findFirst({
      where: {
        portafolioId: portafolioId,
        activeSymbol: symbol
      }
    })

    const crypto_held = holdingOfActive ? holdingOfActive.quantity : 0.0;

    const aiServiceUrl = fastApi + '/get-recommendation/' + symbol;
    const balance = portafolio.cash;

    const payload = {
      balance,
      crypto_held,
    };

    console.log(payload);
    

    try {
      const request = this.httpService.post(aiServiceUrl, payload);
      const response = await lastValueFrom(request);  
      return response.data; 

    } catch (err) {
      console.error("Error llamando al servicio de IA", err.response?.data || err.message);
      throw new Error('Error al obtener la sugerencia de la IA');
    }

  }
}
