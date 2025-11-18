import { Controller, Post, Body, Res } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Response } from 'express';
import { GenerateReportDto } from './dto/generateReport.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  async generateReport(@Body() body: GenerateReportDto, @Res() res: Response) {
    const { prompt, userId } = body;
    const fileData = await this.reportsService.generateDynamicReport(
      userId,
      prompt,
    );

    res.set({
      'Content-Type': fileData.mimeType,
      'Content-Disposition': `attachment; filename="${fileData.filename}"`,
      'Content-Length': fileData.buffer.length,
      'Cache-Control': 'no-cache',
    });

    res.end(fileData.buffer);
  }
}
