import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { JurisdictionService } from './jurisdiction.service';
import { CreateJurisdictionDto } from './dto/create-jurisdiction.dto';
import { UpdateJurisdictionDto } from './dto/update-jurisdiction.dto';

@Controller('jurisdiction')
export class JurisdictionController {
  constructor(private readonly jurisdictionService: JurisdictionService) {}

  @Post()
  create(@Body() createJurisdictionDto: CreateJurisdictionDto) {
    return this.jurisdictionService.create(createJurisdictionDto);
  }

  @Get()
  findAll() {
    return this.jurisdictionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jurisdictionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateJurisdictionDto: UpdateJurisdictionDto) {
    return this.jurisdictionService.update(+id, updateJurisdictionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jurisdictionService.remove(+id);
  }
}
