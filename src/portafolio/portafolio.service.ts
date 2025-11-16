/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePortafolioDto } from './dto/create-portafolio.dto';
import { UpdatePortafolioDto } from './dto/update-portafolio.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CoinbaseService } from 'src/events/coinbase/coinbase.service';

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

  update(id: string, updatePortafolioDto: UpdatePortafolioDto) {
    const portafolioFind = this.prismaService.portafolio.findUnique({
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
