import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export class CreateTransactionDto {
  @IsNotEmpty()
  @IsEnum(TransactionType)
  type: TransactionType;
  @IsNotEmpty()
  @IsNumber()
  amount: number;
  @IsNotEmpty()
  @IsNumber()
  price: number;
  @IsNotEmpty()
  @IsString()
  activeSymbol: string;
  @IsNotEmpty()
  @IsString()
  portafolioId: string;
}
