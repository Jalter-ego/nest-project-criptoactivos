import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFeedbackDto } from './dto/feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async create(feedbackCreateDto: CreateFeedbackDto) {
    console.log(feedbackCreateDto);
    
    return this.prisma.feedback.create({
      data: {
        portafolioId: feedbackCreateDto.portafolioId,
        message: feedbackCreateDto.message,
        type: feedbackCreateDto.type,
      },
    });
  }

  async findByPortafolio(portafolioId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return this.prisma.feedback.findMany({
      where: { portafolioId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
  }

  async findRecent(portafolioId: string){
    return this.prisma.feedback.findMany({
      where:{ portafolioId },
      orderBy: { createdAt: 'desc'},
      take: 5
    })
  }
}