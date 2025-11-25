import { Injectable } from '@nestjs/common';
import { CreateAssessmentDocumentDto } from './dto/create-assessment-document.dto';
import { UpdateAssessmentDocumentDto } from './dto/update-assessment-document.dto';

@Injectable()
export class AssessmentDocumentsService {
  create(createAssessmentDocumentDto: CreateAssessmentDocumentDto) {
    return 'This action adds a new assessmentDocument';
  }

  findAll() {
    return `This action returns all assessmentDocuments`;
  }

  findOne(id: number) {
    return `This action returns a #${id} assessmentDocument`;
  }

  update(id: number, updateAssessmentDocumentDto: UpdateAssessmentDocumentDto) {
    return `This action updates a #${id} assessmentDocument`;
  }

  remove(id: number) {
    return `This action removes a #${id} assessmentDocument`;
  }
}
