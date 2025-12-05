import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query, UseGuards } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { User } from '../../users/entities/user.entity';
import { PaginationQueryDto } from '../../expert-assessment/assessment-sub-section/dto/pagination-query.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Permissions } from '../../rbac/constants/permissions.constants';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('/:applicationId/assessment/:assessmentId')
  @ApiOperation({ summary: 'Create a review' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @RequirePermissions(Permissions.REVIEW_ASSESSMENT, Permissions.REVIEW_FINAL_APPLICATION)
  async create(
    @Param('applicationId') applicationId: string, 
    @Param('assessmentId') assessmentId: string,
    @Body() createReviewDto: CreateReviewDto,
    @Req() req: any,
  ) {
    const user = req.user as User;
    return await this.reviewService.create(applicationId, assessmentId, createReviewDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews' })
  @ApiQuery({ type: PaginationQueryDto })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @RequirePermissions(Permissions.REVIEW_ASSESSMENT, Permissions.REVIEW_FINAL_APPLICATION)
  async findAllPaginated(@Query() query: PaginationQueryDto, @Req() req: any) {
    const user = req.user as User;
    return await this.reviewService.findAllPaginated(query, user.id);
  }

  @Get('/:applicationId/assessment/:assessmentId')
  @ApiOperation({ summary: 'Get a review by ID' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @RequirePermissions(Permissions.REVIEW_ASSESSMENT, Permissions.REVIEW_FINAL_APPLICATION)
  async findOne(
    @Param('applicationId') applicationId: string,
    @Param('assessmentId') assessmentId: string,
    @Req() req: any,
  ) {
    const user = req.user as User;
    return await this.reviewService.findOne(applicationId, assessmentId, user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewService.update(+id, updateReviewDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewService.remove(+id);
  }
}
