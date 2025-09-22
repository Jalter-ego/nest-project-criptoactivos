import { Injectable } from '@nestjs/common';
import { CreatePortafolioDto } from './dto/create-portafolio.dto';
import { UpdatePortafolioDto } from './dto/update-portafolio.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PortafolioService {
  constructor(
    private readonly prismaService: PrismaService,
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
    });
  }

  findOne(id: string) {
    return this.prismaService.portafolio.findUnique({
      where: { id },
    });
  }

  update(id: string, updatePortafolioDto: UpdatePortafolioDto) {
    return `This action updates a #${id} portafolio`;
  }

  remove(id: string) {
    return this.prismaService.portafolio.delete({
      where: { id },
    });
  }
}
