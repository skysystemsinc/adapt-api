import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ApiBody, ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HumanResourceService } from './human-resource.service';
import { CreateHumanResourceDto } from './dto/create-human-resource.dto';
import { CreateDeclarationDto } from './declaration/dto/create-declaration.dto';
import { AcademicQualificationService } from './academic-qualification/academic-qualification.service';
import { CreateAcademicQualificationDto } from './academic-qualification/dto/create-academic-qualification.dto';
import { ProfessionalQualificationService } from './professional-qualification/professional-qualification.service';
import { CreateProfessionalQualificationDto } from './professional-qualification/dto/create-professional-qualification.dto';
import { TrainingService } from './training/training.service';
import { CreateTrainingDto } from './training/dto/create-training.dto';
import { ProfessionalExperienceService } from './professional-experience/professional-experience.service';
import { CreateProfessionalExperienceDto } from './professional-experience/dto/create-professional-experience.dto';

@ApiTags('Warehouse Location Human Resources')
@ApiBearerAuth('JWT-auth')
@Controller('warehouse-location')
@UseGuards(JwtAuthGuard)
export class HumanResourceController {
  constructor(
    private readonly humanResourceService: HumanResourceService,
    private readonly academicQualificationService: AcademicQualificationService,
    private readonly professionalQualificationService: ProfessionalQualificationService,
    private readonly trainingService: TrainingService,
    private readonly professionalExperienceService: ProfessionalExperienceService,
  ) {}

  @Get(':id/human-resources')
  @ApiOperation({ summary: 'Get all HR entries for warehouse location' })
  async getHumanResources(
    @Param('id') id: string,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.humanResourceService.findByWarehouseLocationId(id, userId);
  }

  @Post(':id/human-resources/personal-details')
  @ApiOperation({ summary: 'Create HR entry with personal details' })
  @ApiBody({
    type: CreateHumanResourceDto,
    description: 'Personal details data with photograph as base64 string or document ID'
  })
  async createPersonalDetails(
    @Param('id') id: string,
    @Body() createHumanResourceDto: CreateHumanResourceDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.humanResourceService.createPersonalDetails(id, createHumanResourceDto, userId);
  }

  @Patch(':id/human-resources/:hrId/personal-details')
  @ApiOperation({ summary: 'Update personal details for HR entry' })
  @ApiBody({
    type: CreateHumanResourceDto,
    description: 'Personal details data with photograph as base64 string or document ID'
  })
  async updatePersonalDetails(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Body() createHumanResourceDto: CreateHumanResourceDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.humanResourceService.createPersonalDetails(id, createHumanResourceDto, userId, hrId);
  }

  @Post(':id/human-resources/:hrId/declaration')
  @ApiOperation({ summary: 'Create or update declaration for HR entry' })
  async createOrUpdateDeclaration(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Body() createDeclarationDto: CreateDeclarationDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.humanResourceService.createOrUpdateDeclaration(hrId, createDeclarationDto, userId);
  }

  @Post(':id/human-resources/:hrId/academic-qualifications')
  @ApiOperation({ summary: 'Create academic qualification for HR entry' })
  @ApiBody({
    type: CreateAcademicQualificationDto,
    description: 'Academic qualification data with certificate as base64 string or document ID'
  })
  async createAcademicQualification(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Body() createAcademicQualificationDto: CreateAcademicQualificationDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.academicQualificationService.create(hrId, createAcademicQualificationDto, userId);
  }

  @Patch(':id/human-resources/:hrId/academic-qualifications/:qualId')
  @ApiOperation({ summary: 'Update academic qualification' })
  @ApiBody({
    type: CreateAcademicQualificationDto,
    description: 'Academic qualification data with certificate as base64 string or document ID'
  })
  async updateAcademicQualification(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Param('qualId') qualId: string,
    @Body() createAcademicQualificationDto: CreateAcademicQualificationDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.academicQualificationService.update(qualId, hrId, createAcademicQualificationDto, userId);
  }

  @Delete(':id/human-resources/:hrId/academic-qualifications/:qualId')
  @ApiOperation({ summary: 'Delete academic qualification' })
  async deleteAcademicQualification(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Param('qualId') qualId: string,
  ) {
    return this.academicQualificationService.remove(qualId, hrId);
  }

  @Post(':id/human-resources/:hrId/professional-qualifications')
  @ApiOperation({ summary: 'Create professional qualification for HR entry' })
  @ApiBody({
    type: CreateProfessionalQualificationDto,
    description: 'Professional qualification data with certificate as base64 string or document ID'
  })
  async createProfessionalQualification(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Body() createProfessionalQualificationDto: CreateProfessionalQualificationDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.professionalQualificationService.create(hrId, createProfessionalQualificationDto, userId);
  }

  @Patch(':id/human-resources/:hrId/professional-qualifications/:qualId')
  @ApiOperation({ summary: 'Update professional qualification' })
  @ApiBody({
    type: CreateProfessionalQualificationDto,
    description: 'Professional qualification data with certificate as base64 string or document ID'
  })
  async updateProfessionalQualification(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Param('qualId') qualId: string,
    @Body() createProfessionalQualificationDto: CreateProfessionalQualificationDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.professionalQualificationService.update(qualId, hrId, createProfessionalQualificationDto, userId);
  }

  @Delete(':id/human-resources/:hrId/professional-qualifications/:qualId')
  @ApiOperation({ summary: 'Delete professional qualification' })
  async deleteProfessionalQualification(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Param('qualId') qualId: string,
  ) {
    return this.professionalQualificationService.remove(qualId, hrId);
  }

  @Post(':id/human-resources/:hrId/trainings')
  @ApiOperation({ summary: 'Create training for HR entry' })
  @ApiBody({
    type: CreateTrainingDto,
    description: 'Training data with certificate as base64 string or document ID'
  })
  async createTraining(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Body() createTrainingDto: CreateTrainingDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.trainingService.create(hrId, createTrainingDto, userId);
  }

  @Patch(':id/human-resources/:hrId/trainings/:trainingId')
  @ApiOperation({ summary: 'Update training' })
  @ApiBody({
    type: CreateTrainingDto,
    description: 'Training data with certificate as base64 string or document ID'
  })
  async updateTraining(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Param('trainingId') trainingId: string,
    @Body() createTrainingDto: CreateTrainingDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.trainingService.update(trainingId, hrId, createTrainingDto, userId);
  }

  @Delete(':id/human-resources/:hrId/trainings/:trainingId')
  @ApiOperation({ summary: 'Delete training' })
  async deleteTraining(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Param('trainingId') trainingId: string,
  ) {
    return this.trainingService.remove(trainingId, hrId);
  }

  @Post(':id/human-resources/:hrId/professional-experiences')
  @ApiOperation({ summary: 'Create professional experience for HR entry' })
  @ApiBody({
    type: CreateProfessionalExperienceDto,
    description: 'Professional experience data with experience letter as base64 string or document ID'
  })
  async createProfessionalExperience(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Body() createProfessionalExperienceDto: CreateProfessionalExperienceDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.professionalExperienceService.create(hrId, createProfessionalExperienceDto, userId);
  }

  @Patch(':id/human-resources/:hrId/professional-experiences/:expId')
  @ApiOperation({ summary: 'Update professional experience' })
  @ApiBody({
    type: CreateProfessionalExperienceDto,
    description: 'Professional experience data with experience letter as base64 string or document ID'
  })
  async updateProfessionalExperience(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Param('expId') expId: string,
    @Body() createProfessionalExperienceDto: CreateProfessionalExperienceDto,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.professionalExperienceService.update(expId, hrId, createProfessionalExperienceDto, userId);
  }

  @Delete(':id/human-resources/:hrId/professional-experiences/:expId')
  @ApiOperation({ summary: 'Delete professional experience' })
  async deleteProfessionalExperience(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Param('expId') expId: string,
  ) {
    return this.professionalExperienceService.remove(expId, hrId);
  }

  @Delete(':id/human-resources/:hrId')
  @ApiOperation({ summary: 'Delete HR entry and all related data' })
  async deleteHumanResource(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.humanResourceService.deleteHumanResource(hrId, userId);
  }
}
