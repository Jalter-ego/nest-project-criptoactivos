/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePortafolioDto } from './dto/create-portafolio.dto';
import { UpdatePortafolioDto } from './dto/update-portafolio.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CoinbaseService } from 'src/events/coinbase/coinbase.service';
import { RiskMetrics } from './entities/riskMetrics.entity';
import { Snapshot } from './entities/snapshot.entity';

@Injectable()
export class PortafolioService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly coinbaseService: CoinbaseService
  ) {}

  async create(createPortafolioDto: CreatePortafolioDto) {
    const portafolio = await this.prismaService.portafolio.findFirst({
      where: {
        name: createPortafolioDto.name,
        userId: createPortafolioDto.userId
      }
    })

    if (portafolio) {
      throw new Error('Ya existe un portafolio con ese nombre para este usuario');
    }

    return this.prismaService.portafolio.create({
      data: createPortafolioDto,
    });
  }

  findAll() {
    return this.prismaService.portafolio.findMany();
  }

  findAllByUser(userId: string) {
    return this.prismaService.portafolio.findMany({
      where: { userId },
      include:{
        holdings: true
      }
    });
  }

  
  async findAllByUserWithPrices(userId: string) {
    const portfolios = await this.prismaService.portafolio.findMany({
      where: { userId },
      include: {
        holdings: true
      },
    });

    // Enriquecer cada portafolio con precios actuales
    const enrichedPortfolios = await Promise.all(
      portfolios.map(async (portfolio) => {
        // Enriquecer holdings con precios actuales
        const enrichedHoldings = portfolio.holdings.map((holding) => {
          const currentPrice = this.coinbaseService.getCurrentPrice(holding.activeSymbol);
          const totalValue = holding.quantity * currentPrice;

          return {
            id: holding.id,
            quantity: holding.quantity,
            activeSymbol: holding.activeSymbol,
            currentPrice: Number(currentPrice.toFixed(2)),
            totalValue: Number(totalValue.toFixed(2)),
          };
        });

        return {
          id: portfolio.id,
          name: portfolio.name,
          cash: portfolio.cash,
          invested: portfolio.invested || 0,
          holdings: enrichedHoldings,
        };
      })
    );

    return enrichedPortfolios;
  }

  async findSnapshots(portafolioId: string) {
    const portafolioExists = await this.prismaService.portafolio.findUnique({
      where: { id: portafolioId },
    });

    if (!portafolioExists) {
      throw new NotFoundException(`Portafolio con ID "${portafolioId}" no encontrado.`);
    }

    return this.prismaService.portafolioSnapshot.findMany({
      where: { portafolioId },
      orderBy: {
        timestamp: 'asc',
      },
    });
  }

  async findOne(id: string) {
    const portafolio = await this.prismaService.portafolio.findUnique({
      where: { id },
      include: {
        holdings: true,
      },
    });

    if (!portafolio) {
      throw new NotFoundException(`Portafolio con ID "${id}" no encontrado.`);
    }
    return portafolio;
  }

  async findOneWithPrices(id: string) {
    const portafolio = await this.prismaService.portafolio.findUnique({
      where: { id },
      include: {
        holdings: true
      },
    });

    if (!portafolio) {
      throw new NotFoundException(`Portafolio con ID "${id}" no encontrado.`);
    }

    // Enriquecer holdings con precios actuales
    const enrichedHoldings = portafolio.holdings.map((holding) => {
      const currentPrice = this.coinbaseService.getCurrentPrice(holding.activeSymbol);
      const totalValue = holding.quantity * currentPrice;

      return {
        id: holding.id,
        quantity: holding.quantity,
        activeSymbol: holding.activeSymbol,
        currentPrice: Number(currentPrice.toFixed(2)),
        totalValue: Number(totalValue.toFixed(2)),
      };
    });

    return {
      id: portafolio.id,
      name: portafolio.name,
      cash: portafolio.cash,
      invested: portafolio.invested || 0,
      createdAt: portafolio.createdAt,
      updatedAt: portafolio.updatedAt,
      holdings: enrichedHoldings,
    };
  }

  async getTotalValue(id: string): Promise<{
    totalValue: number;
  }> {
    const portafolio = await this.prismaService.portafolio.findUnique({
      where: { id },
      include: {
        holdings: true,
      },
    });

    if (!portafolio) {
      throw new NotFoundException(`Portafolio con ID "${id}" no encontrado.`);
    }

    let holdingsValue = 0;

    for (const holding of portafolio.holdings) {
      const currentPrice = this.coinbaseService.getCurrentPrice(
        holding.activeSymbol,
      );
      holdingsValue += holding.quantity * currentPrice;
    }

    const totalValue = portafolio.cash + holdingsValue;

    return {
      totalValue: totalValue,
    };
  }


  async calculateRiskMetrics(id: string): Promise<RiskMetrics> {
    const portafolioExists = await this.prismaService.portafolio.findUnique({
      where: { id },
    });

    if (!portafolioExists) {
      throw new NotFoundException(`Portafolio con ID "${id}" no encontrado.`);
    }

    const snapshots = await this.prismaService.portafolioSnapshot.findMany({
      where: { portafolioId: id },
      orderBy: { timestamp: 'asc' },
    });

    // Si hay menos de 7 snapshots, no podemos calcular métricas confiables
    if (snapshots.length < 7) {
      return {
        sortinoRatio: 0,
        sharpeRatio: 0,
        averageReturn: 0,
        volatility: 0,
        downsideVolatility: 0,
        totalReturn: 0,
        maxDrawdown: 0,
        dataPoints: snapshots.length,
        periodDays: 0,
        riskFreeRate: 0.02,
        message: 'Se necesitan al menos 7 días de datos para calcular métricas confiables.',
      };
    }

    // Calcular retornos diarios
    const dailyReturns = this.calculateDailyReturns(snapshots);

    // Parámetros
    const riskFreeRate = 0.02; // 2% anual
    const riskFreeRateDaily = riskFreeRate / 365; 

    // Calcular métricas básicas
    const averageReturn = this.calculateMean(dailyReturns);
    const volatility = this.calculateStandardDeviation(dailyReturns);
    const totalReturn = this.calculateTotalReturn(snapshots);
    const maxDrawdown = this.calculateMaxDrawdown(snapshots);

    // Calcular downside volatility (solo retornos negativos)
    const negativeReturns = dailyReturns.filter(return_ => return_ < 0);
    const downsideVolatility = negativeReturns.length > 0
      ? this.calculateStandardDeviation(negativeReturns)
      : 0;

    // Calcular ratios
    const sharpeRatio = volatility > 0
      ? (averageReturn - riskFreeRateDaily) / volatility
      : 0;

    const sortinoRatio = downsideVolatility > 0
      ? (averageReturn - riskFreeRateDaily) / downsideVolatility
      : averageReturn >= riskFreeRateDaily ? Infinity : -Infinity;

    // Calcular período en días
    const periodDays = Math.floor(
      (snapshots[snapshots.length - 1].timestamp.getTime() - snapshots[0].timestamp.getTime())
      / (1000 * 60 * 60 * 24)
    );

    const riskMetrics: RiskMetrics = {
      sortinoRatio: Number(sortinoRatio.toFixed(4)),
      sharpeRatio: Number(sharpeRatio.toFixed(4)),
      averageReturn: Number(averageReturn.toFixed(6)),
      volatility: Number(volatility.toFixed(6)),
      downsideVolatility: Number(downsideVolatility.toFixed(6)),
      totalReturn: Number(totalReturn.toFixed(4)),
      maxDrawdown: Number(maxDrawdown.toFixed(4)),
      dataPoints: snapshots.length,
      periodDays,
      riskFreeRate,
    }

    return riskMetrics;
  }

  // Calcular retornos diarios
  private calculateDailyReturns(snapshots: Snapshot[]): number[] {
    const returns: number[] = [];

    for (let i = 1; i < snapshots.length; i++) {
      const currentValue = snapshots[i].value;
      const previousValue = snapshots[i - 1].value;

      if (previousValue > 0) {
        const dailyReturn = (currentValue - previousValue) / previousValue;
        returns.push(dailyReturn);
      }
    }

    return returns;
  }

  // Calcular media aritmética
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  // Calcular desviación estándar
  private calculateStandardDeviation(values: number[]): number {
    if (values.length <= 1) return 0;

    const mean = this.calculateMean(values);
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const variance = this.calculateMean(squaredDifferences);

    return Math.sqrt(variance);
  }

  // Calcular retorno total
  private calculateTotalReturn(snapshots: Snapshot[]): number {
    if (snapshots.length < 2) return 0;

    const initialValue = snapshots[0].value;
    const finalValue = snapshots[snapshots.length - 1].value;

    return (finalValue - initialValue) / initialValue;
  }

  // Calcular máximo drawdown
  private calculateMaxDrawdown(snapshots: Snapshot[]): number {
    if (snapshots.length < 2) return 0;

    let maxDrawdown = 0;
    let peak = snapshots[0].value;

    for (const snapshot of snapshots) {
      if (snapshot.value > peak) {
        peak = snapshot.value;
      }

      const drawdown = (peak - snapshot.value) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }


  async update(id: string, updatePortafolioDto: UpdatePortafolioDto) {
    const portafolioFind = await this.prismaService.portafolio.findUnique({
      where: { id },
    });
    if (!portafolioFind) {
      throw new NotFoundException(`Portafolio con ID "${id}" no encontrado.`);
    }
    return this.prismaService.portafolio.update({
      where: { id },
      data: updatePortafolioDto,
    });
  }

  remove(id: string) {
    return this.prismaService.portafolio.delete({
      where: { id },
    });
  }
}
