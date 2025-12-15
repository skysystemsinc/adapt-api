# ClamAV Implementation Plan

This document tracks where ClamAV scanning needs to be integrated across the application.

## ✅ Already Implemented

1. **`UploadsService.uploadFile()`**
   - Location: `src/modules/uploads/uploads.service.ts` (line ~142)
   - Endpoint: `POST /uploads`
   - Status: ✅ Complete
   - Covers: Form file uploads

2. **`SettingsService.uploadSettingFile()`**
   - Location: `src/modules/settings/settings.service.ts` (line ~168)
   - Endpoint: `POST /admin/settings/:key/upload`
   - Status: ✅ Complete
   - Covers: Admin settings file uploads

---

## 🔴 Priority 1: HIGHEST IMPACT (Implement First)

### 1. `WarehouseService.uploadWarehouseDocument()`
- **Location**: `src/modules/warehouse/warehouse.service.ts` (line 4587)
- **Endpoint**: `POST /warehouse/documents/upload`
- **Impact**: ⭐⭐⭐⭐⭐ (Covers ~15+ endpoints)
- **Status**: ✅ **COMPLETE**
- **Module**: `WarehouseModule` - ✅ `ClamAVModule` imported

**Used by:**
- Warehouse document uploads
- HR document uploads (photographs, certificates, training docs, experience letters)
- Financial document uploads (via `FinancialInformationService`)
- Company information uploads (NTC certificates)
- Checklist file uploads
- All warehouse operator application file uploads

**Implementation Steps:**
1. Import `ClamAVModule` in `WarehouseModule`
2. Inject `ClamAVService` in `WarehouseService` constructor
3. Add scanning before `fs.writeFile()` at line 4622
4. Reject upload if infected

**Code Location:**
```typescript
// Around line 4615-4622
// After file validation, before saving:
await this.clamAVService.scanBuffer(file.buffer, file.originalname);
await fs.writeFile(filePath, file.buffer);
```

---

## 🟠 Priority 2: HIGH IMPACT

### 2. `RegistrationApplicationService.uploadAdminDocument()`
- **Location**: `src/modules/registration-application/registration-application.service.ts` (line 584)
- **Endpoint**: `POST /admin/registration/:registrationId/detail/:detailId/upload`
- **Impact**: ⭐⭐⭐⭐
- **Status**: ❌ Not Implemented
- **Module**: `RegistrationApplicationModule` - needs to import `ClamAVModule`

**Used by:**
- Admin document uploads for registration applications

**Implementation Steps:**
1. Import `ClamAVModule` in `RegistrationApplicationModule`
2. Inject `ClamAVService` in `RegistrationApplicationService` constructor
3. Add scanning before encryption at line 640
4. Reject upload if infected

**Code Location:**
```typescript
// Around line 633-640
// After file validation, before encryption:
await this.clamAVService.scanBuffer(file.buffer, file.originalname);
const { encrypted, iv, authTag } = encryptBuffer(file.buffer);
```

### 3. `InspectionReportsService.create()`
- **Location**: `src/modules/inspection-reports/inspection-reports.service.ts` (line 60)
- **Endpoint**: `POST /inspection-reports`
- **Impact**: ⭐⭐⭐⭐
- **Status**: ❌ Not Implemented
- **Module**: `InspectionReportsModule` - needs to import `ClamAVModule`

**Used by:**
- Inspection report file uploads (multiple files + global document)

**Files to Scan:**
- `globalDocumentFile` (required) - line 104
- `files[]` (array) - line 213

**Implementation Steps:**
1. Import `ClamAVModule` in `InspectionReportsModule`
2. Inject `ClamAVService` in `InspectionReportsService` constructor
3. Scan `globalDocumentFile` before saving (line ~104)
4. Scan each file in `files[]` array before saving (line ~213)
5. Reject entire upload if any file is infected

**Code Locations:**
```typescript
// Around line 98-104 (global document)
await this.clamAVService.scanBuffer(globalDocumentFile.buffer, globalDocumentFile.originalname);
await fs.writeFile(globalFilePath, globalDocumentFile.buffer);

// Around line 210-213 (multiple files)
for (const file of files) {
  await this.clamAVService.scanBuffer(file.buffer, file.originalname);
  await fs.writeFile(filePath, file.buffer);
}
```

---

## 🟡 Priority 3: MEDIUM IMPACT (Verify First)

### 4. Warehouse Location Services

These services may use `WarehouseService.uploadWarehouseDocument()` or have their own file save methods. **Verify first** before implementing.

#### 4a. `WeighingsService`
- **Location**: `src/modules/warehouse-location/weighings/weighings.service.ts`
- **Endpoint**: `POST /warehouse-location/:id/weighings`
- **Status**: ⚠️ Needs Verification
- **Check**: Does it use `WarehouseService.uploadWarehouseDocument()` or save files directly?

#### 4b. `HumanResourceService`
- **Location**: `src/modules/warehouse-location/human-resource/human-resource.service.ts`
- **Endpoints**: Multiple HR-related uploads
- **Status**: ⚠️ Needs Verification
- **Check**: Does it use `WarehouseService.uploadWarehouseDocument()` or save files directly?

#### 4c. `WarehouseLocationChecklistService`
- **Location**: `src/modules/warehouse-location/warehouse-location-checklist/warehouse-location-checklist.service.ts`
- **Endpoint**: `POST /warehouse-location/:id/checklist`
- **Status**: ⚠️ Needs Verification
- **Check**: Does it use `WarehouseService.uploadWarehouseDocument()` or save files directly?

#### 4d. Warehouse Location Sub-services
- `AcademicQualificationService`
- `ProfessionalQualificationService`
- `ProfessionalExperienceService`
- `TrainingService`
- **Status**: ⚠️ Needs Verification
- **Check**: Do they use shared methods or save files directly?

---

## 📋 Implementation Checklist

### For Each Service:

- [ ] Import `ClamAVModule` in the service's module
- [ ] Inject `ClamAVService` in the service constructor
- [ ] Add scanning before file save operation
- [ ] Handle infected files (reject with error message)
- [ ] Handle ClamAV unavailable errors (log and decide: block or allow)
- [ ] Test with EICAR test file
- [ ] Test with clean files
- [ ] Update error handling in frontend (if needed)

---

## 🔧 Standard Implementation Pattern

```typescript
// 1. Import in module
import { ClamAVModule } from '../clamav/clamav.module';

@Module({
  imports: [
    // ... existing imports
    ClamAVModule,
  ],
  // ...
})

// 2. Inject in service constructor
constructor(
  // ... existing dependencies
  private readonly clamAVService: ClamAVService,
) {}

// 3. Add scanning before file save
// Scan file with ClamAV before processing
try {
  this.logger.log(`🔍 Scanning file with ClamAV: ${file.originalname}`);
  const scanResult = await this.clamAVService.scanBuffer(
    file.buffer,
    file.originalname,
  );

  if (scanResult.isInfected) {
    this.logger.warn(
      `🚨 Infected file detected: ${file.originalname}, Viruses: ${scanResult.viruses.join(', ')}`,
    );
    throw new BadRequestException(
      `File is infected with malware: ${scanResult.viruses.join(', ')}. Upload rejected.`,
    );
  }

  this.logger.log(`✅ File passed ClamAV scan: ${file.originalname}`);
} catch (error) {
  if (error instanceof BadRequestException) {
    // Always reject infected files, regardless of CLAMAV_SCAN setting
    throw error;
  }
  
  // Handle ClamAV service failures (unavailable, timeout, etc.)
  const isMandatory = this.clamAVService.getScanMandatory();
  
  if (isMandatory) {
    // CLAMAV_SCAN=true: Block upload if scan fails
    this.logger.error(
      `ClamAV scan failed for ${file.originalname}: ${error.message}`,
      error.stack,
    );
    throw new BadRequestException(
      `Virus scanning unavailable: ${error.message}. Upload blocked due to mandatory scanning.`,
    );
  } else {
    // CLAMAV_SCAN=false: Log warning but allow upload (bypass on failure)
    this.logger.warn(
      `ClamAV scan failed for ${file.originalname}: ${error.message}. Bypassing scan and allowing upload.`,
      error.stack,
    );
  }
}

// 4. Continue with existing file save logic
await fs.writeFile(filePath, file.buffer);
```

### Environment Variable: `CLAMAV_SCAN`

- **`CLAMAV_SCAN=true`** (Default): Mandatory scanning
  - If ClamAV fails → Upload is **BLOCKED**
  - Use in production

- **`CLAMAV_SCAN=false`**: Optional scanning
  - If ClamAV fails → Upload is **ALLOWED** (bypass)
  - Use in development or when ClamAV might be unavailable
  - **Important:** Infected files are ALWAYS rejected, regardless of this setting

---

## 📊 Summary Statistics

- **Total File Upload Endpoints**: ~20+
- **Already Implemented**: 3 ✅
- **Priority 1 (Highest Impact)**: 1 ✅ **COMPLETE**
- **Priority 2 (High Impact)**: 2 🟠
- **Priority 3 (Needs Verification)**: ~5-7 🟡
- **Remaining to Implement**: ~7-9 locations

---

## 🎯 Recommended Implementation Order

1. ✅ `WarehouseService.uploadWarehouseDocument()` - **COMPLETE** ✅ (covers most endpoints)
2. 🔄 `RegistrationApplicationService.uploadAdminDocument()` - **NEXT**
3. 🔄 `InspectionReportsService.create()` (scan all files)
4. ⚠️ Verify and implement warehouse location services if needed

---

## 📝 Notes

- All implementations should follow the same pattern for consistency
- Error messages should be clear and include virus names
- Consider making ClamAV unavailable behavior configurable (currently allows uploads, can be changed to block)
- Test each implementation with EICAR test file before marking complete
- Update this document as you complete each implementation

---

## 🔍 How to Verify if a Service Needs Implementation

1. Search for `fs.writeFile` or `writeFile` in the service file
2. Check if it saves file buffers directly
3. If yes, it needs ClamAV scanning
4. If it calls another service method (like `uploadWarehouseDocument()`), check that method instead

---

**Last Updated**: [Current Date]
**Status**: 2/20+ implementations complete (10%)

