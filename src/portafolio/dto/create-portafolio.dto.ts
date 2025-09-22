import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreatePortafolioDto {
    @IsNotEmpty()
    @IsString()
    name: string;
    @IsNotEmpty()
    @IsNumber()
    saldo: number;
    @IsNotEmpty()
    @IsString()
    userId: string;
}
