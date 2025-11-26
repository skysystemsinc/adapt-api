import { Injectable } from '@nestjs/common';
import { CreateAssessmentSubmissionDto } from './dto/create-assessment-submission.dto';
import { UpdateAssessmentSubmissionDto } from './dto/update-assessment-submission.dto';

@Injectable()
export class AssessmentSubmissionService {
  create(createAssessmentSubmissionDto: CreateAssessmentSubmissionDto) {
    return 'This action adds a new assessmentSubmission';
  }

  findAll() {
    return `This action returns all assessmentSubmission`;
  }

  findOne(id: number) {
    return `This action returns a #${id} assessmentSubmission`;
  }

  update(id: number, updateAssessmentSubmissionDto: UpdateAssessmentSubmissionDto) {
    return `This action updates a #${id} assessmentSubmission`;
  }

  remove(id: number) {
    return `This action removes a #${id} assessmentSubmission`;
  }
}
