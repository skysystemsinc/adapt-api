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

  @Get('data/:applicationId')
  async getData(@Param('applicationId') applicationId: string) {
    return await this.assignmentService.getData(applicationId);
  }

  @ApiOperation({ summary: 'Get all assignments for a warehouse operator application' })
  @Get('/application/:applicationId/assignments')
  async getAssignmentsByApplicationId(@Param('applicationId') applicationId: string) {
    return await this.assignmentService.getAssignmentsByApplicationId(applicationId);
  }

  @ApiOperation({ summary: 'Get all assignments for a warehouse location application' })
  @Get('/location/:applicationLocationId/assignments')
  async getAssignmentsByLocationId(@Param('applicationLocationId') applicationLocationId: string) {
    return await this.assignmentService.getAssignmentsByLocationId(applicationLocationId);
  }

  @ApiOperation({ summary: 'Assign an assignment to a user for warehouse operator application' })
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

  @ApiOperation({ summary: 'Assign an assignment to a user for warehouse location application' })
  @ApiBody({ type: CreateAssignmentDto })
  @Post('/location/:applicationLocationId')
  async assignToLocation(@Body() createAssignmentDto: CreateAssignmentDto,
    @Req() req: any,
    @Param('applicationLocationId') applicationLocationId: string) {
    // JWT payload typically has 'sub' field containing the user ID
    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new Error('User ID not found in request. Authentication may have failed.');
    }
    return await this.assignmentService.assignToLocation(applicationLocationId, createAssignmentDto, userId as string);
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
