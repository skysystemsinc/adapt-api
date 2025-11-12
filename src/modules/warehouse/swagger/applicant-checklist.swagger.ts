/**
 * Swagger schemas for Applicant Checklist API endpoint
 */

export const ApplicantChecklistApiBodySchema = {
  schema: {
    type: 'object',
    properties: {
      data: {
        type: 'string',
        description: 'JSON string containing applicant checklist data',
        example: JSON.stringify({
          humanResources: {
            qcPersonnel: true,
            warehouseSupervisor: true,
            dataEntryOperator: true,
          },
          financialSoundness: {
            auditedFinancialStatements: true,
            positiveNetWorth: true,
            noLoanDefaults: true,
            cleanCreditHistory: true,
            adequateWorkingCapital: true,
            validInsuranceCoverage: true,
            noFinancialFraud: true,
          },
          registrationFee: {},
          declaration: {
            informationTrueComplete: true,
            authorizeVerification: true,
          },
        }),
      },
      qcPersonnelFile: {
        type: 'string',
        format: 'binary',
        description: 'QC Personnel certificate file (PDF, DOC, DOCX, JPG, JPEG, PNG)',
      },
      warehouseSupervisorFile: {
        type: 'string',
        format: 'binary',
        description: 'Warehouse Supervisor certificate file',
      },
      dataEntryOperatorFile: {
        type: 'string',
        format: 'binary',
        description: 'Data Entry Operator certificate file',
      },
      auditedFinancialStatementsFile: {
        type: 'string',
        format: 'binary',
        description: 'Audited Financial Statements file',
      },
      positiveNetWorthFile: {
        type: 'string',
        format: 'binary',
        description: 'Positive Net Worth proof file',
      },
      noLoanDefaultsFile: {
        type: 'string',
        format: 'binary',
        description: 'No Loan Defaults certificate file',
      },
      cleanCreditHistoryFile: {
        type: 'string',
        format: 'binary',
        description: 'CIB Report file',
      },
      adequateWorkingCapitalFile: {
        type: 'string',
        format: 'binary',
        description: 'Adequate Working Capital proof file',
      },
      validInsuranceCoverageFile: {
        type: 'string',
        format: 'binary',
        description: 'Insurance Policies file',
      },
      noFinancialFraudFile: {
        type: 'string',
        format: 'binary',
        description: 'No Financial Fraud declaration file',
      },
      bankPaymentSlip: {
        type: 'string',
        format: 'binary',
        description: 'Bank Payment Slip file',
      },
    },
    required: ['data'],
  },
  description: 'Applicant checklist data with files (certificates, documents, etc.)',
};

export const ApplicantChecklistApiResponseSchema = {
  status: 201,
  description: 'Applicant checklist created/updated successfully',
  schema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        example: 'Applicant checklist saved successfully',
      },
      data: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          humanResources: { type: 'object' },
          financialSoundness: { type: 'object' },
          registrationFee: { type: 'object' },
          declaration: { type: 'object' },
        },
      },
    },
  },
};

export const ApplicantChecklistApiParam = {
  name: 'applicationId',
  type: String,
  description: 'UUID of the warehouse operator application',
  example: '123e4567-e89b-12d3-a456-426614174000',
};

export const ApplicantChecklistApiResponse400 = {
  status: 400,
  description: 'Bad request - Invalid data or file format',
};

export const ApplicantChecklistApiResponse401 = {
  status: 401,
  description: 'Unauthorized - Invalid or missing JWT token',
};

export const ApplicantChecklistApiResponse404 = {
  status: 404,
  description: 'Not found - Application not found',
};

