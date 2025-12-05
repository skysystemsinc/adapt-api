import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { User } from '../../users/entities/user.entity';
import { PaginationQueryDto } from '../../expert-assessment/assessment-sub-section/dto/pagination-query.dto';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('/:applicationId/assessment/:assessmentId')
  create(
    @Param('applicationId') applicationId: string, 
    @Param('assessmentId') assessmentId: string,
    @Body() createReviewDto: CreateReviewDto,
    @Req() req: any,
  ) {
    const user = req.user as User;
    return this.reviewService.create(applicationId, assessmentId, createReviewDto, user.id);
  }

  @Get()
  findAllPaginated(@Query() query: PaginationQueryDto) {
    return this.reviewService.findAllPaginated(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewService.findOne(+id);
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
