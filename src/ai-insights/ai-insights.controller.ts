import { Controller, Get, Param } from '@nestjs/common';
import { AiInsightsService } from './ai-insights.service';

@Controller('ai-insights')
export class AiInsightsController {
  constructor(private readonly aiInsightsService: AiInsightsService) {}

  @Get('portfolio/:id')
  async getInsights(@Param('id') portafolioId: string) {
    return this.aiInsightsService.getPortfolioInsights(portafolioId);
  }
}
