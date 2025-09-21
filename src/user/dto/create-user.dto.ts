import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateUserDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsOptional()
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    password: string;
}
