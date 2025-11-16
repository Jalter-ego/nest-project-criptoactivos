import { IsNotEmpty, IsString } from 'class-validator';

export class UpdatePortafolioDto{
    @IsString()
    @IsNotEmpty()
    name?: string;
}
