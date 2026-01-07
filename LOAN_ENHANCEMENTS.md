# Loan Type Enhancements Implementation

## Overview
Implemented three major enhancements to the loan management system:
1. **Guarantor System** - Members can select other members as guarantors who must approve before loan proceeds
2. **KYC Document Collection** - Upload and verify documents like bank statements, IDs, etc.
3. **Multiple Approval Workflow** - Require 2+ admin approvals for sensitive loans

## Database Changes

### Schema Updates

#### 1. LoanType Model
Added new fields:
- `requiresKyc` (Boolean) - Toggle KYC requirement
- `kycDocumentTypes` (String/JSON) - Array of required document types
- `requiresMultipleApprovals` (Boolean) - Toggle multiple approval requirement
- `minApprovers` (Int) - Minimum number of approvers required (default: 2)

#### 2. New Models Created

**LoanGuarantor**
```prisma
model LoanGuarantor {
  id                String    @id @default(cuid())
  loanId            String
  loan              Loan      @relation(fields: [loanId], references: [id], onDelete: Cascade)
  guarantorMemberId String
  status            String    @default("pending") // 'pending' | 'approved' | 'rejected'
  respondedAt       DateTime?
  rejectionReason   String?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

**LoanKycDocument**
```prisma
model LoanKycDocument {
  id           String    @id @default(cuid())
  loanId       String
  loan         Loan      @relation(fields: [loanId], references: [id], onDelete: Cascade)
  documentType String    // 'bank_statement' | 'id_card' | 'drivers_license' | 'utility_bill' | 'passport' | 'other'
  documentUrl  String
  fileName     String
  fileSize     Int
  mimeType     String
  status       String    @default("pending") // 'pending' | 'verified' | 'rejected'
  verifiedBy   String?
  verifiedAt   DateTime?
  notes        String?
  uploadedAt   DateTime  @default(now())
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

**LoanApproval**
```prisma
model LoanApproval {
  id             String   @id @default(cuid())
  loanId         String
  loan           Loan     @relation(fields: [loanId], references: [id], onDelete: Cascade)
  approverUserId String
  decision       String   // 'approved' | 'rejected'
  comments       String?
  approvedAt     DateTime @default(now())
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

#### 3. Loan Model Updates
Added relations:
- `guarantors` - LoanGuarantor[]
- `kycDocuments` - LoanKycDocument[]
- `approvals` - LoanApproval[]

## Frontend Changes

### TypeScript Models (`src/models/index.ts`)

#### Updated LoanType Interface
```typescript
export interface LoanType {
  // ... existing fields
  requiresKyc: boolean;
  kycDocumentTypes?: string[];
  requiresMultipleApprovals: boolean;
  minApprovers: number;
}
```

#### New Interfaces
- `LoanGuarantor` - Guarantor information and approval status
- `LoanKycDocument` - KYC document details and verification status
- `LoanApproval` - Individual approval records
- `KycDocumentType` - Type union for document types

#### Updated LoanRequest Interface
Added optional arrays:
- `guarantors?: LoanGuarantor[]`
- `kycDocuments?: LoanKycDocument[]`
- `approvals?: LoanApproval[]`

### UI Changes (`src/screens/loans/LoanTypesScreen.tsx`)

#### New Form Fields
1. **KYC Requirements Section**
   - Toggle switch for "Requires KYC Documents"
   - Multi-select checkboxes for document types:
     - Bank Statement
     - ID Card
     - Driver's License
     - Utility Bill
     - Passport

2. **Multiple Approvals Section**
   - Toggle switch for "Requires Multiple Approvals"
   - Number input for minimum approvers (when enabled)

#### Updated Loan Type Cards
Display badges for:
- Guarantor requirement (e.g., "2 Guarantors")
- KYC requirement ("KYC Required")
- Multiple approvals (e.g., "2 Approvers")

#### New Styles Added
- `formHint` - Helper text for form fields
- `checkboxContainer` - Checkbox row layout
- `checkbox` - Checkbox styling
- `checkboxChecked` - Checked state styling
- `checkmark` - Checkmark icon
- `checkboxLabel` - Checkbox label text

## Implementation Details

### Feature 1: Guarantor System

**How It Works:**
1. Admin configures loan type with `requiresGuarantor: true` and `minGuarantors: N`
2. When member applies for loan, they select N guarantors from other members
3. System creates `LoanGuarantor` records with `status: 'pending'`
4. Guarantors receive notifications and can approve/reject
5. Loan proceeds only when all guarantors approve
6. If any guarantor rejects, loan application fails

**Backend TODO:**
- [ ] Create API endpoint to add guarantors to loan: `POST /api/loans/:id/guarantors`
- [ ] Create API endpoint for guarantors to respond: `POST /api/loans/:loanId/guarantors/:id/respond`
- [ ] Update loan approval logic to check guarantor status
- [ ] Send notifications to guarantors
- [ ] Add guarantor validation (can't guarantee own loan, must be active member)

**Mobile App TODO:**
- [ ] Update LoanRequestScreen to show guarantor selection when required
- [ ] Create member picker component for selecting guarantors
- [ ] Create guarantor approval screen (for members who are guarantors)
- [ ] Show guarantor status in LoanDetailScreen
- [ ] Add notifications for guarantor requests

### Feature 2: KYC Document Collection

**How It Works:**
1. Admin configures loan type with `requiresKyc: true` and selects required document types
2. When member applies, they must upload specified documents
3. System creates `LoanKycDocument` records with `status: 'pending'`
4. Admin verifies documents, changing status to 'verified' or 'rejected'
5. Loan proceeds only when all required documents are verified
6. Documents are stored securely with metadata

**Supported Document Types:**
- `bank_statement` - Bank Statement
- `id_card` - ID Card
- `drivers_license` - Driver's License
- `utility_bill` - Utility Bill
- `passport` - Passport
- `other` - Other documents

**Backend TODO:**
- [ ] Create file upload endpoint: `POST /api/loans/:id/kyc-documents`
- [ ] Integrate with file storage (AWS S3, Cloudinary, or local storage)
- [ ] Create API endpoint to verify/reject documents: `PATCH /api/loans/:loanId/kyc-documents/:id`
- [ ] Update loan approval logic to check document verification status
- [ ] Add file size and type validation
- [ ] Implement secure file access with signed URLs

**Mobile App TODO:**
- [ ] Update LoanRequestScreen to show document upload UI
- [ ] Integrate document picker (react-native-document-picker)
- [ ] Add image/document preview
- [ ] Show upload progress
- [ ] Display document verification status in LoanDetailScreen
- [ ] Allow admin to verify/reject documents from mobile

### Feature 3: Multiple Approval Workflow

**How It Works:**
1. Admin configures loan type with `requiresMultipleApprovals: true` and `minApprovers: N`
2. When loan is submitted, it enters multi-stage approval
3. Multiple admins (with loan approval permission) can review
4. System creates `LoanApproval` records as admins approve/reject
5. Loan proceeds only when N approvals are reached
6. If any admin rejects, loan application fails
7. Admins can see who has already approved

**Backend TODO:**
- [ ] Update loan approval endpoint to support multiple approvals
- [ ] Add endpoint to get approval status: `GET /api/loans/:id/approvals`
- [ ] Prevent same admin from approving twice
- [ ] Update loan status logic to check approval count
- [ ] Send notifications to admins when their approval is needed
- [ ] Add audit trail for all approvals

**Mobile App TODO:**
- [ ] Update LoanDetailScreen to show approval progress
- [ ] Display list of approvers and their decisions
- [ ] Show pending approvers
- [ ] Add visual progress indicator (e.g., "2/3 approvals")
- [ ] Disable approve button for admins who already approved
- [ ] Show comments from approvers

## Migration Steps

### 1. Run Prisma Migration
```bash
cd backend
npx prisma migrate dev --name add_loan_enhancements
npx prisma generate
```

### 2. Update Backend DTOs
Update loan type creation/update DTOs in `backend/src/loans/dto/`:
- Add new fields to CreateLoanTypeDto
- Add new fields to UpdateLoanTypeDto

### 3. Update Backend Services
- Modify loan type service to handle new fields
- Create guarantor service for managing guarantors
- Create KYC document service for file uploads
- Create approval service for multi-stage approvals

### 4. Update Backend Controllers
- Add endpoints for guarantor management
- Add endpoints for KYC document upload/verification
- Add endpoints for approval workflow

### 5. Test in Development
- Create loan types with new features
- Test guarantor workflow end-to-end
- Test KYC document upload and verification
- Test multiple approval workflow

## Security Considerations

1. **Guarantor System**
   - Validate guarantor is an active member
   - Prevent self-guaranteeing
   - Ensure guarantor has proper permissions
   - Rate limit guarantee requests

2. **KYC Documents**
   - Validate file types (only images and PDFs)
   - Limit file sizes (e.g., max 10MB)
   - Scan for malware
   - Store files securely with encryption
   - Use signed URLs with expiration
   - Audit document access

3. **Multiple Approvals**
   - Verify admin has loan approval permission
   - Prevent duplicate approvals
   - Log all approval actions
   - Implement approval timeouts if needed

## Benefits

1. **Risk Management**
   - Guarantor system reduces default risk
   - KYC verification ensures member authenticity
   - Multiple approvals prevent fraudulent loans

2. **Compliance**
   - KYC documents help meet regulatory requirements
   - Audit trail for all approvals
   - Document verification process

3. **Flexibility**
   - Features are toggleable per loan type
   - Different loan types can have different requirements
   - Admins have full control

4. **Transparency**
   - Members see what's required upfront
   - Clear approval process
   - Audit trail for all actions

## Next Steps

1. **Database Migration**
   - Run migration in development
   - Test with sample data
   - Backup before production migration

2. **Backend Implementation**
   - Implement guarantor API endpoints
   - Implement KYC document upload/verification
   - Implement multiple approval workflow
   - Add comprehensive tests

3. **Mobile App Implementation**
   - Build guarantor selection UI
   - Build document upload UI
   - Build approval progress UI
   - Test on iOS and Android

4. **Documentation**
   - User guide for admins
   - User guide for members
   - API documentation
   - Troubleshooting guide

## Testing Checklist

- [ ] Create loan type with guarantor requirement
- [ ] Apply for loan and select guarantors
- [ ] Guarantor approves loan application
- [ ] Guarantor rejects loan application
- [ ] Create loan type with KYC requirement
- [ ] Upload KYC documents
- [ ] Admin verifies documents
- [ ] Admin rejects documents
- [ ] Create loan type with multiple approvals
- [ ] Multiple admins approve loan
- [ ] Admin rejects loan in multi-approval flow
- [ ] Test combinations (guarantor + KYC + multi-approval)
- [ ] Test error handling
- [ ] Test notifications
- [ ] Test permissions
