import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, SignInDto, SignInGoogle } from './signInDto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  signUp(@Body() registerDto: RegisterDto) {    
    return this.authService.signUp(registerDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: SignInDto) {
    console.log(signInDto);
    
    return this.authService.signIn(signInDto);
  }

  @Post('google')
  googleLogin(@Body() signIn: SignInGoogle) {
    return this.authService.googleLogin(signIn);
  }
}
