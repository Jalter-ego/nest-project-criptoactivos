import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor (
    private prismaService:PrismaService
  ){}

  async create(createUserDto: CreateUserDto) {
    const user = await this.findByEmail(createUserDto.email);
    if(user) {
      throw new Error('User already exists');
    }
    return this.prismaService.user.create({
      data: createUserDto
    });
  }

  findAll() {
    return this.prismaService.user.findMany();
  }

  findOne(id: string) {
    return this.prismaService.user.findUnique({
      where: {
        id
      }
    });
  }

  async findByEmail(email: string) {
    return this.prismaService.user.findUnique({
      where: { email },
    });
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  async remove(id: string) {
    const user = await this.findOne(id)
    if(user) {
      return this.prismaService.user.delete({
        where: { id }
      });
    }
    return 'User not found';
  }
}
