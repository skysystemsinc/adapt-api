import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { WeighingsService } from './weighings.service';
import { CreateWeighingDto } from './dto/create-weighing.dto';
import { UpdateWeighingDto } from './dto/update-weighing.dto';

@Controller('weighings')
export class WeighingsController {
  constructor(private readonly weighingsService: WeighingsService) {}

  @Post()
  create(@Body() createWeighingDto: CreateWeighingDto) {
    return this.weighingsService.create(createWeighingDto);
  }

  @Get()
  findAll() {
    return this.weighingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.weighingsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWeighingDto: UpdateWeighingDto) {
    return this.weighingsService.update(+id, updateWeighingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.weighingsService.remove(+id);
  }
}
