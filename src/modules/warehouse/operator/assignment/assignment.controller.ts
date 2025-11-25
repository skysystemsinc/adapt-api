import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { User } from 'src/modules/users/entities/user.entity';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@Controller('warehouse/assignment')
@ApiTags('Assignment')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) { }

  @ApiOperation({ summary: 'Assign an assignment to a user' })
  @ApiBody({ type: CreateAssignmentDto })
  @Post('/application/:applicationId')
  async assign(@Body() createAssignmentDto: CreateAssignmentDto,
    @Req() req: any,
    @Param('applicationId') applicationId: string) {
    // JWT payload typically has 'sub' field containing the user ID
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new Error('User ID not found in request. Authentication may have failed.');
    }
    return await this.assignmentService.assign(applicationId, createAssignmentDto, userId as string);
  }

  @Get()
  findAll() {
    return this.assignmentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assignmentService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssignmentDto: UpdateAssignmentDto) {
    return this.assignmentService.update(+id, updateAssignmentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assignmentService.remove(+id);
  }
}
