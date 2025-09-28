import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreatePortafolioDto {
    @IsNotEmpty()
    @IsString()
    name: string;
    @IsNotEmpty()
    @IsNumber()
    cash: number;
    @IsNotEmpty()
    @IsString()
    userId: string;
}
