import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(createTransactionDto: CreateTransactionDto) {
    console.log(createTransactionDto);  
    await this.prisma.holding.create({
      data: {
        quantity: createTransactionDto.amount,
        activeSymbol: createTransactionDto.activeSymbol,
        portafolioId: createTransactionDto.portafolioId
      }
    })
    return this.prisma.transaction.create({
      data: createTransactionDto,
    });
  }

  findAll() {
    return this.prisma.transaction.findMany();
  }

  findAllByUser(userId: string) {
    return this.prisma.transaction.findMany({
      where:{
        portafolio: {
          userId: userId
        }
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
