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

          // 2. Verificamos si el portafolio tiene suficiente dinero.
          if (portafolio.cash < totalCost) {
            throw new BadRequestException(
              'Fondos insuficientes para realizar la compra.',
            );
          }

          // 3. Restamos el dinero del portafolio.
          await tx.portafolio.update({
            where: { id: portafolioId },
            data: {
              cash: {
                decrement: totalCost,
              },
            },
          });

          // 4. Actualizamos el Holding. Usamos 'upsert' que es perfecto para esto:
          // - Si el holding existe, actualiza (incrementa) la cantidad.
          // - Si no existe, lo crea.
          await tx.holding.upsert({
            where: {
              portafolioId_activeSymbol: {
                // Así se usa el índice @@unique
                portafolioId,
                activeSymbol,
              },
            },
            update: {
              quantity: {
                increment: amount, // Suma la nueva cantidad a la existente.
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
          // 2. Buscamos el holding para verificar si el usuario posee ese activo.
          const holding = await tx.holding.findUnique({
            where: {
              portafolioId_activeSymbol: {
                portafolioId,
                activeSymbol,
              },
            },
          });

          // 3. Verificamos si tiene suficientes activos para vender.
          if (!holding || holding.quantity < amount) {
            throw new BadRequestException(
              'No posees suficientes activos para realizar la venta.',
            );
          }

          const totalGain = amount * price;

          // 4. Aumentamos el dinero en el portafolio.
          await tx.portafolio.update({
            where: { id: portafolioId },
            data: {
              cash: {
                increment: totalGain, // Suma el dinero de la venta.
              },
            },
          });

          // 5. Restamos la cantidad del activo del holding.
          await tx.holding.update({
            where: {
              portafolioId_activeSymbol: {
                portafolioId,
                activeSymbol,
              },
            },
            data: {
              quantity: {
                decrement: amount, // Resta la cantidad vendida.
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

        // 7. Devolvemos el portafolio actualizado con sus holdings
        const updatedPortafolioWithHoldings = await tx.portafolio.findUnique({
          where: { id: portafolioId },
          include: { holdings: true },
        });

        // Llamamos a una función helper para mantener el código limpio
        await this._createSnapshot(tx, updatedPortafolioWithHoldings);

        // <--- 4. DEVUELVE AMBOS OBJETOS
        return {
          updatedPortafolio: updatedPortafolioWithHoldings,
          newTransaction: createdTransaction,
        };
      });
    // <--- 5. LLAMA A LA IA *DESPUÉS* DE QUE LA DB SE CONFIRMÓ
    // Esto es "fire and forget" (dispara y olvida), no bloquea al usuario.
    console.log(result);
    
    this.notifyAIService(result.updatedPortafolio, result.newTransaction);

    // <--- 6. DEVUELVE LA RESPUESTA ORIGINAL AL FRONTEND
    return result.updatedPortafolio;
  }

  private notifyAIService(portafolio: any, transaction: any) {
    const aiServiceUrl = fastApi + '/analyze-trade';

    try {
      // Asegúrate de tener este método en tu CoinbaseService
      const marketData = this.coinbaseService.getLatestDataMap(); 

      const payload = {
        portafolio,
        transaction,
        marketData,
      };

      const request = this.httpService.post(aiServiceUrl, payload);

      // Usamos lastValueFrom pero con .catch() para que no bloquee
      // la ejecución principal si falla.
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
    portafolio: any, // Tipo debería ser Portafolio & { holdings: Holding[] }
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

    // Guardamos la "foto" en la base de datos
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
