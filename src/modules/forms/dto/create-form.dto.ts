import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateFormDto {
  @ApiProperty({
    description: 'Form title',
    example: 'Registration Form',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Form description',
    example: 'User registration form with personal details',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Complete form schema from frontend builder',
    example: {
      id: 'registration',
      title: 'Registration Form',
      description: '',
      steps: [
        {
          id: 'step-1',
          title: 'Form Fields',
          fields: [
            {
              type: 'radio',
              label: 'Please select your application type:',
              required: true,
              options: [
                {
                  id: '54200b68',
                  label: 'Individual Application',
                  value: 'individual',
                },
                { id: 'e363a839', label: 'Partnership', value: 'partnership' },
              ],
              id: 'app_type',
            },
            {
              type: 'text',
              label: 'Partner Name',
              required: false,
              id: 'partner_name',
              // Conditional field - only shows when app_type == "partnership"
              conditions: [
                { field: 'app_type', operator: '==', value: 'partnership' },
              ],
            },
            {
              type: 'heading',
              title: 'Enter Details Below:',
              id: '7e9b9176',
            },
            {
              type: 'number',
              label: 'Name of Applicant',
              required: true,
              id: '420b28bd',
              placeholder: '42101-1234567-8',
              validation: { min: 13, max: 15 },
            },
          ],
        },
      ],
    },
  })
  @IsObject()
  @IsNotEmpty()
  /**
   * Form schema with support for conditional fields
   * 
   * Conditions structure (optional):
   * - field: string (ID of the field to check)
   * - operator: '==' | '!=' | 'in' | 'not_in' | '>' | '<' | '>=' | '<='
   * - value: string | number | string[] | number[]
   * 
   * All conditions in the array use AND logic (all must be true)
   * 
   * Supported operators:
   * - == : Equal to
   * - != : Not equal to
   * - in : Value is in array
   * - not_in : Value is not in array
   * - > : Greater than
   * - < : Less than
   * - >= : Greater than or equal
   * - <= : Less than or equal
   */
  schema: Record<string, any>;
}

