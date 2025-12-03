import { Controller, Get, Post, Body, Patch, Param, Delete, Req } from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { User } from 'src/modules/users/entities/user.entity';

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
  findAll() {
    return this.reviewService.findAll();
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
