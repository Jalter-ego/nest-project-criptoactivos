import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/feedback.dto';


@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  create(@Body() createFeedbackDto: CreateFeedbackDto) {
    console.log(createFeedbackDto);
    
    return this.feedbackService.create(createFeedbackDto);
  }

  @Get('portafolio/:id')
  findByPortafolio(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;

    return this.feedbackService.findByPortafolio(id, pageNumber, limitNumber);
  }

  @Get('portafolio/:id/recent')
  findRecent(@Param('id') id: string) {
    return this.feedbackService.findRecent(id);
  }
}