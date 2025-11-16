import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePortafolioDto {
  @IsNotEmpty()
  @IsString()
  name: string;
  @IsNotEmpty()
  @IsNumber()
  cash: number;
  @IsOptional()
  @IsNumber()
  invested?: number;
  @IsNotEmpty()
  @IsString()
  userId: string;
}
