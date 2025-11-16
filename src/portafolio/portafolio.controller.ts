import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PortafolioService } from './portafolio.service';
import { CreatePortafolioDto } from './dto/create-portafolio.dto';
import { UpdatePortafolioDto } from './dto/update-portafolio.dto';

@Controller('portafolio')
export class PortafolioController {
  constructor(private readonly portafolioService: PortafolioService) {}

  @Post()
  create(@Body() createPortafolioDto: CreatePortafolioDto) {
    return this.portafolioService.create(createPortafolioDto);
  }

  @Get()
  findAll() {
    return this.portafolioService.findAll();
  }

  @Get('user/:userId')
  findAllByUser(@Param('userId') userId: string) {
    return this.portafolioService.findAllByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.portafolioService.findOne(id);
  }

  @Get(':id/value')
  getTotalValue(@Param('id') id: string) {
    return this.portafolioService.getTotalValue(id);
  }

  @Get(':id/snapshots')
  findSnapshots(@Param('id') id: string) {
    return this.portafolioService.findSnapshots(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePortafolioDto: UpdatePortafolioDto) {
    return this.portafolioService.update(id, updatePortafolioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.portafolioService.remove(id);
  }
}
