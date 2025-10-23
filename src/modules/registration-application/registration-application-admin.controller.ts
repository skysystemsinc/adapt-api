import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { RegistrationApplicationService } from './registration-application.service';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { UpdateDetailStatusDto } from './dto/update-detail-status.dto';
import { QueryRegistrationApplicationDto } from './dto/query-registration-application.dto';

@Controller('admin/registration-application')
export class RegistrationApplicationAdminController {
  constructor(private readonly registrationApplicationService: RegistrationApplicationService) {}

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

