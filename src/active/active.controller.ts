import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ActiveService } from './active.service';
import { CreateActiveDto } from './dto/create-active.dto';
import { UpdateActiveDto } from './dto/update-active.dto';

@Controller('active')
export class ActiveController {
  constructor(private readonly activeService: ActiveService) {}

  @Post()
  create(@Body() createActiveDto: CreateActiveDto) {
    return this.activeService.create(createActiveDto);
  }

  @Get()
  findAll() {
    return this.activeService.findAll();
  }

  @Get(':symbol')
  findOne(@Param('symbol') symbol: string) {
    return this.activeService.findOne(symbol);
  }

  @Patch(':symbol')
  update(@Param('symbol') symbol: string, @Body() updateActiveDto: UpdateActiveDto) {
    return this.activeService.update(symbol, updateActiveDto);
  }

  @Delete(':symbol')
  remove(@Param('symbol') symbol: string) {
    return this.activeService.remove(symbol);
  }
}
