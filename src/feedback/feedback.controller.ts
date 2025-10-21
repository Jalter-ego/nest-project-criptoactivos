import { Controller, Post, Body, Get, Param } from '@nestjs/common';
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
  findByPortafolio(@Param('id') id: string) {
    return this.feedbackService.findByPortafolio(id);
  }
}