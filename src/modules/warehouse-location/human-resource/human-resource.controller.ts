import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiBody, ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateHumanResourceDto,
    description: 'Personal details data with optional photograph file'
  })
  @UseInterceptors(
    FileInterceptor('photograph', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  async createPersonalDetails(
    @Param('id') id: string,
    @Body() CreateHumanResourceDto: CreateHumanResourceDto,
    @UploadedFile() photographFile: any,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.humanResourceService.createPersonalDetails(id, CreateHumanResourceDto, userId, photographFile);
  }

  @Patch(':id/human-resources/:hrId/personal-details')
  @ApiOperation({ summary: 'Update personal details for HR entry' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateHumanResourceDto,
    description: 'Personal details data with optional photograph file'
  })
  @UseInterceptors(
    FileInterceptor('photograph', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  async updatePersonalDetails(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Body() CreateHumanResourceDto: CreateHumanResourceDto,
    @UploadedFile() photographFile: any,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.humanResourceService.createPersonalDetails(id, CreateHumanResourceDto, userId, photographFile, hrId);
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateAcademicQualificationDto,
    description: 'Academic qualification data with optional certificate file'
  })
  @UseInterceptors(
    FileInterceptor('academicCertificate', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  async createAcademicQualification(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Body() createAcademicQualificationDto: CreateAcademicQualificationDto,
    @UploadedFile() certificateFile: any,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.academicQualificationService.create(hrId, createAcademicQualificationDto, userId, certificateFile);
  }

  @Patch(':id/human-resources/:hrId/academic-qualifications/:qualId')
  @ApiOperation({ summary: 'Update academic qualification' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateAcademicQualificationDto,
    description: 'Academic qualification data with optional certificate file'
  })
  @UseInterceptors(
    FileInterceptor('academicCertificate', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  async updateAcademicQualification(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Param('qualId') qualId: string,
    @Body() createAcademicQualificationDto: CreateAcademicQualificationDto,
    @UploadedFile() certificateFile: any,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.academicQualificationService.update(qualId, hrId, createAcademicQualificationDto, userId, certificateFile);
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateProfessionalQualificationDto,
    description: 'Professional qualification data with optional certificate file'
  })
  @UseInterceptors(
    FileInterceptor('professionalCertificate', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  async createProfessionalQualification(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Body() createProfessionalQualificationDto: CreateProfessionalQualificationDto,
    @UploadedFile() certificateFile: any,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.professionalQualificationService.create(hrId, createProfessionalQualificationDto, userId, certificateFile);
  }

  @Patch(':id/human-resources/:hrId/professional-qualifications/:qualId')
  @ApiOperation({ summary: 'Update professional qualification' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateProfessionalQualificationDto,
    description: 'Professional qualification data with optional certificate file'
  })
  @UseInterceptors(
    FileInterceptor('professionalCertificate', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  async updateProfessionalQualification(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Param('qualId') qualId: string,
    @Body() createProfessionalQualificationDto: CreateProfessionalQualificationDto,
    @UploadedFile() certificateFile: any,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.professionalQualificationService.update(qualId, hrId, createProfessionalQualificationDto, userId, certificateFile);
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateTrainingDto,
    description: 'Training data with optional certificate file'
  })
  @UseInterceptors(
    FileInterceptor('trainingCertificate', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  async createTraining(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Body() createTrainingDto: CreateTrainingDto,
    @UploadedFile() certificateFile: any,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.trainingService.create(hrId, createTrainingDto, userId, certificateFile);
  }

  @Patch(':id/human-resources/:hrId/trainings/:trainingId')
  @ApiOperation({ summary: 'Update training' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateTrainingDto,
    description: 'Training data with optional certificate file'
  })
  @UseInterceptors(
    FileInterceptor('trainingCertificate', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  async updateTraining(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Param('trainingId') trainingId: string,
    @Body() createTrainingDto: CreateTrainingDto,
    @UploadedFile() certificateFile: any,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.trainingService.update(trainingId, hrId, createTrainingDto, userId, certificateFile);
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
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateProfessionalExperienceDto,
    description: 'Professional experience data with optional experience letter file'
  })
  @UseInterceptors(
    FileInterceptor('experienceLetter', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  async createProfessionalExperience(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Body() createProfessionalExperienceDto: CreateProfessionalExperienceDto,
    @UploadedFile() experienceLetterFile: any,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.professionalExperienceService.create(hrId, createProfessionalExperienceDto, userId, experienceLetterFile);
  }

  @Patch(':id/human-resources/:hrId/professional-experiences/:expId')
  @ApiOperation({ summary: 'Update professional experience' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    type: CreateProfessionalExperienceDto,
    description: 'Professional experience data with optional experience letter file'
  })
  @UseInterceptors(
    FileInterceptor('experienceLetter', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
      },
    }),
  )
  async updateProfessionalExperience(
    @Param('id') id: string,
    @Param('hrId') hrId: string,
    @Param('expId') expId: string,
    @Body() createProfessionalExperienceDto: CreateProfessionalExperienceDto,
    @UploadedFile() experienceLetterFile: any,
    @Request() req: any
  ) {
    const userId = req.user.sub;
    return this.professionalExperienceService.update(expId, hrId, createProfessionalExperienceDto, userId, experienceLetterFile);
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
