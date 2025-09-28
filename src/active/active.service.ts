import { Injectable } from '@nestjs/common';
import { CreateActiveDto } from './dto/create-active.dto';
import { UpdateActiveDto } from './dto/update-active.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ActiveService {
  constructor(
    private readonly prismaService: PrismaService,
  ) {}

  async create(createActiveDto: CreateActiveDto) {
    return this.prismaService.active.create({
      data: createActiveDto,
    });
  }

  findAll() {
    return this.prismaService.active.findMany();
  }

  findOne(symbol: string) {
    return this.prismaService.active.findUnique({
      where: { symbol },
    });
  }

  update(symbol: string, updateActiveDto: UpdateActiveDto) {
    return `This action updates a #${symbol} active`;
  }

  remove(symbol: string) {
    return this.prismaService.active.delete({
      where: { symbol },
    });
  }
}
