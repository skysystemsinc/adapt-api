import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsObject } from 'class-validator';

export class CreateRegistrationApplicationDto {
  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The ID of the application type',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  applicationTypeId: string;

  @IsObject()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The form data',
    type: Object,
    example: {
      "applicationName": "Test Company Ltd",
      "borrowerCode": "987654321",
      "eCIB": "test-ecib.pdf",
      "bankAccount": "TEST1234567890",
      "activeFilerStatus": "no",
      "authorizedSignatoryName": "Test User",
      "designation": "Manager",
      "cnicApplicant": "yes",
      "cnicIssuanceDate": "2023-05-20",
      "cnicCopy": "test-cnic.pdf",
      "financialAuthorizationLevel": "Level 2",
      "powerOfAttorney": "test-poa.pdf",
      "mobileNumber": "03331234567",
      "emailId": "test@example.com",
      "bankPaymentSlip": true,
      "bankSlip": "test-slip.pdf",
      "declaration": true
    },
  })
  formData: Record<string, string>;
}
