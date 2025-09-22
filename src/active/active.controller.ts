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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateActiveDto: UpdateActiveDto) {
    return this.activeService.update(id, updateActiveDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activeService.remove(id);
  }
}
