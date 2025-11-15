import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FireSafetyService } from './fire-safety.service';
import { CreateFireSafetyDto } from './dto/create-fire-safety.dto';
import { UpdateFireSafetyDto } from './dto/update-fire-safety.dto';

@Controller('fire-safety')
export class FireSafetyController {
  constructor(private readonly fireSafetyService: FireSafetyService) {}

  @Post()
  create(@Body() createFireSafetyDto: CreateFireSafetyDto) {
    return this.fireSafetyService.create(createFireSafetyDto);
  }

  @Get()
  findAll() {
    return this.fireSafetyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fireSafetyService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFireSafetyDto: UpdateFireSafetyDto) {
    return this.fireSafetyService.update(+id, updateFireSafetyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fireSafetyService.remove(+id);
  }
}
