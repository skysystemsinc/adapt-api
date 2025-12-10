import { Controller, Get, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { RegistrationApplicationService } from './registration-application.service';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { UpdateDetailStatusDto } from './dto/update-detail-status.dto';
import { QueryRegistrationApplicationDto } from './dto/query-registration-application.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from '../rbac/constants/permissions.constants';
import { RequirePermissions } from 'src/common/decorators/require-permissions.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Registration Application Admin')
@Controller('admin/registration-application')
export class RegistrationApplicationAdminController {
  constructor(private readonly registrationApplicationService: RegistrationApplicationService) {}

  @Get('/roles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all registration application roles for assignment' })
  findAllRegistrationApplicationRoles(
    @Req() req: any,
  ) {
    const userId = req.user.id;
    return this.registrationApplicationService.findAllRegistrationApplicationRoles(userId);
  }

  @Get()
  findAll(@Query() query: QueryRegistrationApplicationDto) {
    return this.registrationApplicationService.findAllPaginated(query);
  }

  @Get('pending')
  findPending() {
    return this.registrationApplicationService.findPendingApplications();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.registrationApplicationService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permissions.REVIEW_KYC_APPROVAL)
  @Patch(':id/status')
  updateApplicationStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateApplicationStatusDto,
  ) {
    return this.registrationApplicationService.updateApplicationStatus(id, updateStatusDto);
  }

  @Patch(':id/details/:detailId/status')
  updateDetailStatus(
    @Param('id') applicationId: string,
    @Param('detailId') detailId: string,
    @Body() updateDetailStatusDto: UpdateDetailStatusDto,
  ) {
    return this.registrationApplicationService.updateDetailStatus(applicationId, detailId, updateDetailStatusDto);
  }

}

