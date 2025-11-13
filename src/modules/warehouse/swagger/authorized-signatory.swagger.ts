/**
 * Swagger schemas for Authorized Signatory API endpoint
 */

export const AuthorizedSignatoryApiBodySchema = {
  schema: {
    type: 'object',
    properties: {
      authorizedSignatoryName: {
        type: 'string',
        description: 'The authorized signatory name',
        example: 'John Doe authorized signatory',
      },
      name: {
        type: 'string',
        description: 'The full name of the authorized signatory',
        example: 'John Doe',
      },
      cnic: {
        type: 'number',
        description: 'The CNIC number of the authorized signatory (13 digits)',
        example: 1231231231231,
      },
      passport: {
        type: 'string',
        description: 'The passport number of the authorized signatory (optional)',
        example: 'AB1234567',
      },
      issuanceDateOfCnic: {
        type: 'string',
        format: 'date',
        description: 'The issuance date of the CNIC (ISO 8601 format)',
        example: '2015-03-15',
      },
      expiryDateOfCnic: {
        type: 'string',
        format: 'date',
        description: 'The expiry date of the CNIC (ISO 8601 format)',
        example: '2025-03-15',
      },
      mailingAddress: {
        type: 'string',
        description: 'The mailing address of the authorized signatory',
        example: '123 Main Street, Block A, Area 5',
      },
      city: {
        type: 'string',
        description: 'The city of the authorized signatory',
        example: 'Karachi',
      },
      country: {
        type: 'string',
        description: 'The country of the authorized signatory',
        example: 'Pakistan',
      },  
      postalCode: {
        type: 'string',
        description: 'The postal code of the authorized signatory',
        example: '75500',
      },
      designation: {
        type: 'string',
        description: 'The designation of the authorized signatory',
        example: 'Manager',
      },
      mobileNumber: {
        type: 'string',
        description: 'The mobile number of the authorized signatory',
        example: '+92 300 1234567',
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'The email address of the authorized signatory',
        example: 'john.doe@example.com',
      },
      landlineNumber: {
        type: 'string',
        description: 'The landline number of the authorized signatory (optional)',
        example: '021345678',
      },
    },
    required: [
      'authorizedSignatoryName',
      'name',
      'cnic',
      'issuanceDateOfCnic',
      'expiryDateOfCnic',
      'mailingAddress',
      'city',
      'country',
      'postalCode',
      'designation',
      'mobileNumber',
      'email',
    ],
  },
  description: 'Authorized signatory information',
};

export const AuthorizedSignatoryApiResponseSchema = {
  status: 201,
  description: 'Authorized signatory created successfully',
  schema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        example: 'Authorized signatory saved successfully',
      },
      authorizedSignatoryId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
      },
      applicationId: {
        type: 'string',
        example: 'WHO-000001',
      },
    },
  },
};

export const AuthorizedSignatoryApiParam = {
  name: 'id',
  type: String,
  description: 'UUID of the warehouse operator application',
  example: '123e4567-e89b-12d3-a456-426614174000',
};

export const AuthorizedSignatoryApiResponse400 = {
  status: 400,
  description: 'Bad request - Invalid data or validation error',
};

export const AuthorizedSignatoryApiResponse401 = {
  status: 401,
  description: 'Unauthorized - Invalid or missing JWT token',
};

export const AuthorizedSignatoryApiResponse404 = {
  status: 404,
  description: 'Not found - Warehouse operator application not found',
};

