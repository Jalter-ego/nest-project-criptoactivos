import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateReportDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}

export interface ReportFilters {
  userId?: string;
  activeSymbol?: string;
  type?: 'BUY' | 'SELL';
  startDate?: string;
  endDate?: string;
  portafolioId?: string;
}

export interface ReportCriteria {
  entity:
    | 'TRANSACTION'
    | 'PORTAFOLIO'
    | 'HOLDING'
    | 'ACTIVE'
    | 'USER'
    | 'FEEDBACK';
  filters: ReportFilters;
  format: 'PDF' | 'EXCEL';
  title?: string;
}

export interface ReportTemplate {
  entity: string;
  columns: Array<{
    header: string;
    key: string;
    width?: number;
    format?: 'currency' | 'date' | 'number';
  }>;
  title: string;
  description?: string;
}
