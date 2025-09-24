import { OAuth2Client } from 'google-auth-library';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { RegisterDto, SignInDto, SignInGoogle } from './signInDto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
  ) {}

  async signUp(registerDto: RegisterDto) {
    console.log(registerDto);
    
    const userEmail = await this.prismaService.user.findFirst({
      where: {
        email: registerDto.email,
      },
    });
    if (userEmail) {
      throw new UnauthorizedException('Email ya registrado');
    }
    const userName = await this.prismaService.user.findFirst({
      where: {
        name: registerDto.name,
      },
    });
    if (userName) {
      throw new UnauthorizedException('Nombre de usuario ya registrado');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    await this.prismaService.user.create({
      data: {
        ...registerDto,
        password: hashedPassword,
      },
    });
    return { message: 'Usuario registrado correctamente' };
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.prismaService.user.findFirst({
      where: {
        email: signInDto.email,
      },
    });
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const isMatch = await bcrypt.compare(signInDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Contraseña incorrecta');
    }

    const payload = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
    return { access_token: await this.jwtService.signAsync(payload) };
  }

  async googleLogin(dto: SignInGoogle) {
    console.log(dto);

    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken: dto.token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid token');
    }

    const emailUser = payload.email || '';
    const userFind = await this.prismaService.user.findFirst({
      where: {
        email: emailUser,
      },
    });

    if (!userFind) {
      await this.prismaService.user.create({
        data: {
          email: emailUser,
          name: payload.name || '',
        },
      });
    }

    const person = await this.prismaService.user.findFirst({
      where: {
        email: emailUser,
      },
    });

    const res = {
      user: person,
      picture: payload.picture,
    };

    console.log(res);
    return { access_token: await this.jwtService.signAsync(res) };
  }
}
