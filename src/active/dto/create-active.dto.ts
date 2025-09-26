import { IsDate, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { Type } from "class-transformer"; 

export class CreateActiveDto {
    @IsNotEmpty()
    @IsString()
    name: string;

    @IsNotEmpty()
    @IsString()
    symbol: string;

    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    lastUpdate: Date;
}
