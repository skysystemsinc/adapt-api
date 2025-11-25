import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { Transform } from "class-transformer";

export class CreateAssessmentSubmissionDto {
    @ApiProperty({ description: 'Assessment or Sub-section ID' })
    @IsString()
    @IsNotEmpty()
    assessmentId: string;

    @ApiProperty({ description: 'Score for this assessment', example: 8.5 })
    @Transform(({ value }) => {
      if (typeof value === 'string') {
        const num = parseFloat(value);
        return isNaN(num) ? value : num;
      }
      return value;
    })
    @IsNumber()
    @IsNotEmpty()
    score: number;

    @ApiProperty({ description: 'Remarks for this assessment' })
    @IsString()
    @IsNotEmpty()
    remarks: string;
}
