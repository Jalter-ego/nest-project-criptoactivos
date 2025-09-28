import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateActiveDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    symbol: string;

}
