# File Upload Conversion Guide: Binary to Base64

This guide shows how to convert file upload endpoints from binary (multipart/form-data) to base64 (application/json).

## Pattern for Conversion

### 1. Update DTOs
Replace file fields in DTOs:
```typescript
// OLD (Binary)
@ApiProperty({
  type: 'string',
  format: 'binary',
  description: 'File upload',
})
@Exclude()
file?: any;

// NEW (Base64)
import { BaseFileUploadDto } from 'src/common/dto/base-file-upload.dto';

@ApiPropertyOptional({
  type: BaseFileUploadDto,
  description: 'File upload (base64 encoded)',
})
@IsOptional()
file?: BaseFileUploadDto;
```

### 2. Update Controller Imports
Remove FileInterceptor imports:
```typescript
// REMOVE
import { FileInterceptor, FilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { UploadedFile, UploadedFiles } from '@nestjs/common';

// ADD
import { createAndValidateFileFromBase64 } from 'src/common/utils/file-utils';
```

### 3. Update Controller Endpoints

#### Single File Upload:
```typescript
// OLD
@Post('/endpoint')
@UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
@ApiConsumes('multipart/form-data')
async upload(
  @Body() dto: SomeDto,
  @UploadedFile() file: any,
) {
  return this.service.method(dto, file);
}

// NEW
@Post('/endpoint')
@ApiConsumes('application/json')
async upload(
  @Body() dto: SomeDto,
) {
  let file: any = undefined;
  if (dto.file) {
    file = createAndValidateFileFromBase64(
      {
        file: dto.file.file,
        fileName: dto.file.fileName,
        fileSize: dto.file.fileSize,
        mimeType: dto.file.mimeType,
      },
      10 * 1024 * 1024, // max size
    );
  }
  return this.service.method(dto, file);
}
```

#### Multiple Files:
```typescript
// OLD
@UseInterceptors(FilesInterceptor('files', 10, { limits: { fileSize: 10 * 1024 * 1024 } }))
@UploadedFiles() files: any[],

// NEW
// In DTO:
@ApiProperty({ type: [BaseFileUploadDto] })
@IsArray()
@ValidateNested({ each: true })
@Type(() => BaseFileUploadDto)
files: BaseFileUploadDto[];

// In Controller:
const fileObjects = dto.files.map(fileDto => 
  createAndValidateFileFromBase64(
    {
      file: fileDto.file,
      fileName: fileDto.fileName,
      fileSize: fileDto.fileSize,
      mimeType: fileDto.mimeType,
    },
    10 * 1024 * 1024,
  )
);
```

#### FileFieldsInterceptor (Multiple Named Files):
```typescript
// OLD
@UseInterceptors(FileFieldsInterceptor([
  { name: 'file1', maxCount: 1 },
  { name: 'file2', maxCount: 1 },
]))
@UploadedFiles() files: { file1?: any[]; file2?: any[] },

// NEW
// In DTO:
@ApiPropertyOptional({ type: BaseFileUploadDto })
@IsOptional()
file1?: BaseFileUploadDto;

@ApiPropertyOptional({ type: BaseFileUploadDto })
@IsOptional()
file2?: BaseFileUploadDto;

// In Controller:
const file1Obj = dto.file1 ? createAndValidateFileFromBase64(...) : undefined;
const file2Obj = dto.file2 ? createAndValidateFileFromBase64(...) : undefined;
```

## Frontend Conversion

### Update Services
Use the reusable utility:
```typescript
import { prepareFileForUpload, prepareFilesForUpload } from '@/utils/file-utils';

// Single file
const fileData = await prepareFileForUpload(file);
await api.post('/endpoint', { ...otherData, ...fileData });

// Multiple files
const filesData = await prepareFilesForUpload(files);
await api.post('/endpoint', { ...otherData, files: filesData });
```

## Remaining Endpoints to Convert

### warehouse.controller.ts
- [x] POST /operator/application/:id/company-information (create)
- [x] PATCH /operator/application/:applicationId/company-information/:companyInformationId (update)
- [ ] POST /documents/upload
- [ ] POST /operator/application/:applicationId/hr-information (multiple files)
- [ ] POST /operator/application/:applicationId/hr/personal-details (photograph)
- [ ] POST /operator/application/:applicationId/hr/academic-qualifications (certificate)
- [ ] PATCH /operator/application/:applicationId/hr/academic-qualifications/:id (certificate)
- [ ] POST /operator/application/:applicationId/hr/professional-qualifications (certificate)
- [ ] PATCH /operator/application/:applicationId/hr/professional-qualifications/:id (certificate)
- [ ] POST /operator/application/:applicationId/hr/trainings (certificate)
- [ ] PATCH /operator/application/:applicationId/hr/trainings/:id (certificate)
- [ ] POST /operator/application/:applicationId/hr/experience (letter)
- [ ] PATCH /operator/application/:applicationId/hr/experience/:id (letter)
- [ ] POST /operator/application/:applicationId/financial-information/others (document)
- [ ] PATCH /operator/application/:applicationId/financial-information/others/:id (document)
- [ ] POST /operator/application/:applicationId/financial-information/:sectionType (documents)
- [ ] PATCH /operator/application/:applicationId/financial-information/:sectionType/:id (documents)
- [ ] POST /operator/application/:applicationId/applicant-checklist (documents)

### Other Controllers
- [ ] warehouse-location/human-resource.controller.ts (11 endpoints)
- [ ] warehouse-location/weighings.controller.ts (2 endpoints)
- [ ] warehouse-location/warehouse-location-checklist.controller.ts (2 endpoints)
- [ ] inspection-reports.controller.ts (1 endpoint)
- [ ] settings.controller.ts (1 endpoint)
- [ ] setting-requests.controller.ts (1 endpoint)
- [ ] warehouse-admin.controller.ts (1 endpoint)
- [ ] warehouse-operator-location.controller.ts (1 endpoint)

## Notes
- All file uploads now use `application/json` content type
- Files are sent as base64 strings in JSON payloads
- Backend utilities handle validation and conversion automatically
- Existing service methods continue to work (they receive file-like objects)

