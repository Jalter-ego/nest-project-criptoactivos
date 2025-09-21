import { Injectable } from '@nestjs/common';
import { SignInDto, SignInGoogle } from './signInDto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OAuth2Client } from 'google-auth-library';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prismaService: PrismaService,
  ) {}

  async signIn(signInDto: SignInDto) {
    const user = await this.prismaService.user.findFirst({
        where:{
            email: signInDto.email
        }
    });
    if (!user) {
      await this.prismaService.user.create({
        data: signInDto
      });
    }
    const userFind = await this.prismaService.user.findFirst({
        where:{
            email: signInDto.email
        }
    });

    const payload = { user: userFind };
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

    const emailUser = payload.email || ''
    const userFind = await this.prismaService.user.findFirst({
        where:{
            email: emailUser
        }
    });

    if(!userFind){
      await this.prismaService.user.create({
        data: {
          email: emailUser
        }
      })
    }else console.log("si existe el usuario");

    const person = await this.prismaService.user.findFirst({
        where:{
            email: emailUser
        }
    });
    
    const res = {
      user: person,
      picture: payload.picture,
    };

    console.log(res);
    return { access_token: await this.jwtService.signAsync(res) };
  }
}