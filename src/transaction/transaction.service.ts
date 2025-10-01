import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto, TransactionType } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTransactionDto: CreateTransactionDto) {
    const { portafolioId, activeSymbol, amount, price, type } =
      createTransactionDto;

    const portafolio = await this.prisma.portafolio.findUnique({
      where: { id: portafolioId },
    });

    if (!portafolio) {
      throw new NotFoundException(`Portafolio con ID "${portafolioId}" no encontrado.`);
    }

    // Usamos una transacción de Prisma para garantizar la atomicidad.
    // O todo se ejecuta correctamente, o nada cambia en la base de datos.
    return this.prisma.$transaction(async (tx) => {
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

      // 6. (Paso común para ambas) Finalmente, creamos el registro de la transacción.
      // Esto se hace al final para que solo se guarde si todo lo anterior tuvo éxito.
      await tx.transaction.create({
        data: {
          type,
          amount,
          price,
          activeSymbol,
          portafolioId,
        },
      });

      // 7. Devolvemos el portafolio actualizado con sus holdings
      return tx.portafolio.findUnique({
          where: { id: portafolioId },
          include: { holdings: true },
      });
    });
  }

  findAll() {
    return this.prisma.transaction.findMany();
  }

  findAllByUser(userId: string) {
    return this.prisma.transaction.findMany({
      where: {
        portafolio: {
          userId: userId,
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
