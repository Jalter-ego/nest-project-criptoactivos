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

  findOne(id: string) {
    return this.prismaService.active.findUnique({
      where: { id },
    });
  }

  update(id: string, updateActiveDto: UpdateActiveDto) {
    return `This action updates a #${id} active`;
  }

  remove(id: string) {
    return this.prismaService.active.delete({
      where: { id },
    });
  }
}
