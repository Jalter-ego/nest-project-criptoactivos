/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateTransactionDto,
  TransactionType,
} from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CoinbaseService } from 'src/events/coinbase/coinbase.service';
import { Prisma } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { fastApi } from 'src/api';

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coinbaseService: CoinbaseService,
    private readonly httpService: HttpService,
  ) {}

  async create(createTransactionDto: CreateTransactionDto) {
    const { portafolioId, activeSymbol, amount, price, type } =
      createTransactionDto;

    const portafolio = await this.prisma.portafolio.findUnique({
      where: { id: portafolioId },
    });

    if (!portafolio) {
      throw new NotFoundException(
        `Portafolio con ID "${portafolioId}" no encontrado.`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
        if (type === TransactionType.BUY) {
          const totalCost = amount * price;

          if (portafolio.cash < totalCost) {
            throw new BadRequestException(
              'Fondos insuficientes para realizar la compra.',
            );
          }

          await tx.portafolio.update({
            where: { id: portafolioId },
            data: {
              cash: {
                decrement: totalCost,
              },
              invested: {
                increment: totalCost
              }
            },
          });
          await tx.holding.upsert({
            where: {
              portafolioId_activeSymbol: {
                portafolioId,
                activeSymbol,
              },
            },
            update: {
              quantity: {
                increment: amount,
              },
            },
            create: {
              portafolioId,
              activeSymbol,
              quantity: amount,
            },
          });
        }
        // Flujo de Lógica para VENTA (SELL)
        else if (type === TransactionType.SELL) {
          const holding = await tx.holding.findUnique({
            where: {
              portafolioId_activeSymbol: {
                portafolioId,
                activeSymbol,
              },
            },
          });

          if (!holding || holding.quantity < amount) {
            throw new BadRequestException(
              'No posees suficientes activos para realizar la venta.',
            );
          }

          const totalGain = amount * price;

          await tx.portafolio.update({
            where: { id: portafolioId },
            data: {
              cash: {
                increment: totalGain, 
              },
            },
          });

          await tx.holding.update({
            where: {
              portafolioId_activeSymbol: {
                portafolioId,
                activeSymbol,
              },
            },
            data: {
              quantity: {
                decrement: amount, 
              },
            },
          });
        }

        const createdTransaction = await tx.transaction.create({
          data: {
            type,
            amount,
            price,
            activeSymbol,
            portafolioId,
          },
        });

        const updatedPortafolioWithHoldings = await tx.portafolio.findUnique({
          where: { id: portafolioId },
          include: { holdings: true },
        });

        await this._createSnapshot(tx, updatedPortafolioWithHoldings);

        return {
          updatedPortafolio: updatedPortafolioWithHoldings,
          newTransaction: createdTransaction,
        };
      });
    
    this.notifyAIService(result.updatedPortafolio, result.newTransaction);

    return result.updatedPortafolio;
  }

  private notifyAIService(portafolio: any, transaction: any) {
    const aiServiceUrl = fastApi + '/analyze-trade';

    try {
      const marketData = this.coinbaseService.getLatestDataMap(); 

      const payload = {
        portafolio,
        transaction,
        market_data: marketData,
      };

      const request = this.httpService.post(aiServiceUrl, payload);

      lastValueFrom(request).catch((err) => {
        console.error(
          'Error al notificar al servicio de IA:',
          err.response?.data || err.message,
        );
      });
    } catch (error) {
      console.error('Error preparando la data para la IA:', error.message);
    }
  }

  private async _createSnapshot(
    tx: Omit<
      Prisma.TransactionClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
    >,
    portafolio: any,
  ) {
    let holdingsValue = 0;

    // Calculamos el valor de todos los activos que posee el usuario
    for (const holding of portafolio.holdings) {
      const currentPrice = this.coinbaseService.getCurrentPrice(
        holding.activeSymbol,
      );
      holdingsValue += holding.quantity * currentPrice;
    }

    const totalValue = portafolio.cash + holdingsValue;

    await tx.portafolioSnapshot.create({
      data: {
        portafolioId: portafolio.id,
        value: totalValue,
      },
    });
  }

  findAll() {
    return this.prisma.transaction.findMany();
  }

  findAllByPortafolio(portafolioId: string) {
    return this.prisma.transaction.findMany({
      where: {
        portafolio: {
          id: portafolioId,
        },
      },
    });
  }

  findAllByPortafolioAndActive(portafolioId: string, symbol: string) {
    return this.prisma.transaction.findMany({
      where: {
        activeSymbol: symbol,
        portafolio: {
          id: portafolioId,
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.transaction.findUnique({
      where: { id },
    });
  }

  update(id: string, updateTransactionDto: UpdateTransactionDto) {
    return `This action updates a #${id} transaction`;
  }

  remove(id: string) {
    return this.prisma.transaction.delete({
      where: { id },
    });
  }
}
