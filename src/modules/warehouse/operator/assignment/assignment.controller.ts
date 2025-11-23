import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { AssignmentService } from './assignment.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { User } from 'src/modules/users/entities/user.entity';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';

@Controller('warehouse/assignment')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) { }

  @ApiOperation({ summary: 'Assign an assignment to a user' })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: CreateAssignmentDto })
  @Post('/application/:applicationId')
  assign(@Body() createAssignmentDto: CreateAssignmentDto,
    @Req() req: any,
    @Param('applicationId') applicationId: string) {
    const user = req.user as User;
    return this.assignmentService.assign(applicationId, createAssignmentDto, user.id as string);
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
