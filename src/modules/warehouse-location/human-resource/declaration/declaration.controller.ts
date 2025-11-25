import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { DeclarationService } from './declaration.service';
import { CreateDeclarationDto } from './dto/create-declaration.dto';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Human Resource Declaration')
@ApiBearerAuth('JWT-auth')
@Controller('warehouse-location/:id/human-resources/:hrId/declaration')
@UseGuards(JwtAuthGuard)
export class DeclarationController {
  constructor(private readonly declarationService: DeclarationService) {}

  @Post()
  @ApiOperation({ summary: 'Create or update declaration for HR entry' })
  createOrUpdate(
    @Param('hrId') hrId: string,
    @Body() createDeclarationDto: CreateDeclarationDto,
  ) {
    return this.declarationService.createOrUpdate(hrId, createDeclarationDto);
  }
}

