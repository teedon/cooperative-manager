# Daily Collection System - Complete Implementation Guide

## Overview
The Daily Collection System is a comprehensive multi-tenant feature that enables field agents to record member transactions during field visits, with supervisor approval workflows before posting to member ledgers.

**Implementation Date:** Phase 1-5 (January 2026)  
**Total Code:** 4,900+ lines across backend and mobile

---

## Architecture

### Multi-Tenant Structure
```
Organization (Cooperative/Manager Business)
  ├── Staff (Field Agents & Supervisors)
  │   ├── Permissions (MANAGE_COLLECTIONS, APPROVE_COLLECTIONS, etc.)
  │   └── Group Assignments (Regional/Branch grouping)
  ├── Collection Settings
  │   ├── requireApproval: boolean
  │   ├── autoPostAfterHours: number
  │   └── defaultTransactionTypes: string[]
  └── Daily Collections
      ├── Transactions (contribution, loan_repayment, ajo_payment, etc.)
      └── Approval Workflow (draft → submitted → approved/rejected)
```

### Database Schema (6 New Models)

**Organization**
- Represents either a cooperative or a management business
- Fields: `id`, `name`, `type` (cooperative|manager), `userId`, `cooperativeId`

**Staff**
- Field agents and supervisors within an organization
- Fields: `id`, `organizationId`, `userId`, `role`, `permissions[]`, `isActive`
- Permissions: Array of strings (MANAGE_COLLECTIONS, APPROVE_COLLECTIONS, etc.)

**StaffGroupAssignment**
- Groups staff by region/branch for organized management
- Fields: `id`, `staffId`, `groupName`, `groupType`, `cooperativeId`, `memberId`

**CollectionSettings**
- Organization-level configuration for collection workflows
- Fields: `organizationId`, `requireApproval`, `autoPostAfterHours`, `defaultTransactionTypes[]`

**DailyCollection**
- Container for a field agent's daily transactions
- Fields: `id`, `organizationId`, `staffId`, `collectionDate`, `status`, `totalAmount`, `submittedAt`, `approvedAt`, `approvedBy`, `notes`, `rejectionReason`
- Status flow: `draft` → `submitted` → `approved`/`rejected`

**CollectionTransaction**
- Individual member transaction within a collection
- Fields: `id`, `collectionId`, `cooperativeId`, `memberId`, `type`, `amount`, `paymentMethod`, `reference`, `notes`, `postedToLedger`, `contributionId`, `loanId`, `ajoPaymentId`, `esusuContributionId`, `shareCapitalTransactionId`
- Transaction Types: `contribution`, `loan_repayment`, `ajo_payment`, `esusu_contribution`, `share_purchase`

---

## Backend Implementation

### Phase 2: Staff Management APIs (874 lines)

**OrganizationsService** (`backend/src/organizations/organizations.service.ts`)
- `create()` - Create new organization
- `findAll()` - List user's organizations
- `findOne()` - Get organization details
- `update()` - Update organization info
- `remove()` - Soft delete organization

**StaffService** (`backend/src/organizations/staff.service.ts`)
- `create()` - Add staff member
- `findAll()` - List organization staff
- `findOne()` - Get staff details
- `update()` - Update staff info/permissions
- `remove()` - Soft delete staff
- `findByUserAndOrg()` - Get staff by userId + organizationId
- `findAssignment()` - Get staff's group assignment

**Guards & Decorators**
- `PermissionsGuard` - Check staff permissions
- `CooperativeAccessGuard` - Verify cooperative access
- `@Permissions()` - Decorator for permission requirements
- `@GetStaff()` - Extract staff from request

### Phase 3: Daily Collection Backend (1,091 lines)

**CollectionsService** (`backend/src/organizations/collections.service.ts` - 738 lines)

Key Methods:
```typescript
// Collection Management
create(organizationId, staffId, data) // Create new collection
findAll(organizationId, filters) // List collections with filters
findOne(organizationId, id) // Get collection details
update(organizationId, id, data) // Update collection
remove(organizationId, id) // Soft delete

// Transaction Management  
addTransaction(organizationId, collectionId, data) // Add transaction to collection
updateTransaction(organizationId, transactionId, data) // Update transaction
removeTransaction(organizationId, transactionId) // Delete transaction

// Workflow Actions
submit(organizationId, collectionId) // Submit for approval
approve(organizationId, collectionId, approverId, notes) // Approve collection
reject(organizationId, collectionId, approverId, reason) // Reject collection

// Advanced Features
findPendingApprovals(organizationId) // Get pending collections for supervisor
postTransactions(collectionId) // Post approved transactions to ledger
```

**Transaction Posting Logic:**
- **contribution** → Creates ContributionPayment record
- **loan_repayment** → Creates LoanRepayment record
- **ajo_payment** → Creates AjoPayment record
- **esusu_contribution** → Creates EsusuContribution record
- **share_purchase** → Creates ShareCapitalTransaction record

**CollectionsController** (`backend/src/organizations/collections.controller.ts` - 260 lines)

REST API Endpoints:
```
POST   /organizations/:orgId/collections              - Create collection
GET    /organizations/:orgId/collections              - List collections
GET    /organizations/:orgId/collections/pending      - Pending approvals
GET    /organizations/:orgId/collections/:id          - Get collection
PATCH  /organizations/:orgId/collections/:id          - Update collection
DELETE /organizations/:orgId/collections/:id          - Delete collection

POST   /organizations/:orgId/collections/:id/transactions     - Add transaction
PATCH  /organizations/:orgId/collections/transactions/:txId   - Update transaction
DELETE /organizations/:orgId/collections/transactions/:txId   - Delete transaction

POST   /organizations/:orgId/collections/:id/submit   - Submit for approval
POST   /organizations/:orgId/collections/:id/approve  - Approve collection
POST   /organizations/:orgId/collections/:id/reject   - Reject collection
```

**DTOs** (`backend/src/organizations/dto/collection.dto.ts` - 93 lines)
- `CreateCollectionDto`
- `UpdateCollectionDto`
- `CreateTransactionDto`
- `UpdateTransactionDto`
- `SubmitCollectionDto`
- `ApproveCollectionDto`
- `RejectCollectionDto`

---

## Mobile Implementation

### Phase 4: Mobile Screens (2,031 lines)

**API Client** (`src/api/collectionsApi.ts` - 246 lines)

TypeScript interfaces and API methods:
```typescript
interface DailyCollection {
  id: string;
  organizationId: string;
  staffId: string;
  collectionDate: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  totalAmount: number;
  transactionCount: number;
  // ... more fields
}

interface CollectionTransaction {
  id: string;
  collectionId: string;
  cooperativeId: string;
  memberId: string;
  type: 'contribution' | 'loan_repayment' | 'ajo_payment' | 'esusu_contribution' | 'share_purchase';
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'mobile_money' | 'card' | 'check';
  // ... more fields
}

// API Methods
collectionsApi.createCollection(orgId, data)
collectionsApi.getCollections(orgId, filters)
collectionsApi.getCollection(orgId, id)
collectionsApi.addTransaction(orgId, collectionId, data)
collectionsApi.submitCollection(orgId, id)
collectionsApi.approveCollection(orgId, id, data)
collectionsApi.rejectCollection(orgId, id, data)
// ... 11 total methods
```

**Mobile Screens:**

1. **CollectionsListScreen** (349 lines)
   - Filter tabs: All, Draft, Submitted, Approved, Rejected
   - Pull-to-refresh
   - Status badges with color coding
   - FAB to create new collection
   - Shows transaction count and total amount

2. **CreateCollectionScreen** (127 lines)
   - Date picker for collection date
   - Creates draft collection
   - Auto-navigates to details screen

3. **CollectionDetailsScreen** (551 lines)
   - Collection summary card with status
   - Transaction list with FlatList
   - Add/Edit/Delete transactions (draft only)
   - Submit button for draft collections
   - Shows rejection reason if rejected
   - Real-time calculations

4. **AddTransactionScreen** (268 lines)
   - Transaction type picker (5 types)
   - Cooperative ID input
   - Member ID input
   - Amount input (converted to cents)
   - Payment method picker (5 methods)
   - Reference and notes fields
   - Custom modal pickers (replaced @react-native-picker/picker)

5. **PendingApprovalsScreen** (490 lines)
   - List of pending collections
   - Approve modal with optional notes
   - Reject modal with required reason
   - Real-time refresh after actions
   - Permission-based access

### Phase 5: Navigation Integration

**Routes Added to MainNavigator:**
```typescript
CollectionsList: { organizationId: string }
CreateCollection: { organizationId: string }
CollectionDetails: { organizationId: string; collectionId: string }
AddTransaction: { organizationId: string; collectionId: string }
PendingCollectionApprovals: { organizationId: string }
```

**Entry Points in CooperativeDetailScreen:**
- "Daily Collections" button - Accessible to all staff
- "Approve Collections" button - Visible only to supervisors (canApprovePayments permission)

---

## User Workflows

### Field Agent Workflow

1. **Access Collections**
   - Open cooperative → Tap "Daily Collections"
   - See list of all collections (filter by status)

2. **Create New Collection**
   - Tap FAB (+) button
   - Select collection date
   - Collection created in "draft" status

3. **Add Transactions**
   - Tap collection to open details
   - Tap "+ Add Transaction" button
   - Fill in transaction details:
     - Type (contribution, loan repayment, etc.)
     - Cooperative ID
     - Member ID
     - Amount
     - Payment method
     - Optional: reference, notes
   - Tap "Add Transaction"

4. **Edit/Delete Transactions**
   - While in "draft" status
   - Tap transaction to edit
   - Swipe or tap delete icon to remove

5. **Submit for Approval**
   - Review all transactions
   - Tap "Submit for Approval" button
   - Collection status → "submitted"
   - Can no longer edit

### Supervisor Workflow

1. **Access Pending Approvals**
   - Open cooperative → Tap "Approve Collections"
   - See list of submitted collections

2. **Review Collection**
   - Tap collection to view details
   - Review:
     - Collection date
     - Staff member name
     - Total amount
     - Transaction count
     - Individual transactions

3. **Approve Collection**
   - Tap "Approve" button
   - Optionally add approval notes
   - Confirm approval
   - Collection status → "approved"
   - Transactions posted to member ledgers

4. **Reject Collection**
   - Tap "Reject" button
   - **Required:** Enter rejection reason
   - Confirm rejection
   - Collection status → "rejected"
   - Agent can see reason and edit

---

## Automatic Posting

### Auto-Post Configuration
Collections can be configured to auto-post after a specified number of hours:

```typescript
CollectionSettings {
  requireApproval: true,      // Require supervisor approval
  autoPostAfterHours: 24,     // Auto-approve after 24 hours
}
```

**Behavior:**
- If `requireApproval = false`: Transactions posted immediately
- If `requireApproval = true` and `autoPostAfterHours` set:
  - Collection auto-approved after X hours
  - Transactions automatically posted to ledger
- If `requireApproval = true` and no `autoPostAfterHours`:
  - Requires manual supervisor approval

### Posting Logic per Transaction Type

**1. Contribution**
```typescript
ContributionPayment.create({
  periodId: // resolved from cooperative
  memberId: transaction.memberId,
  amount: transaction.amount,
  paymentDate: collection.collectionDate,
  paymentMethod: transaction.paymentMethod,
  reference: transaction.reference,
  notes: transaction.notes,
  status: 'approved',
})
```

**2. Loan Repayment**
```typescript
LoanRepayment.create({
  loanId: // resolved from member's active loan
  amount: transaction.amount,
  paymentDate: collection.collectionDate,
  paymentMethod: transaction.paymentMethod,
  reference: transaction.reference,
})
```

**3. Ajo Payment**
```typescript
AjoPayment.create({
  ajoId: // resolved from cooperative
  memberId: transaction.memberId,
  amount: transaction.amount,
  paymentDate: collection.collectionDate,
  paymentMethod: transaction.paymentMethod,
})
```

**4. Esusu Contribution**
```typescript
EsusuContribution.create({
  esusuId: // resolved from cooperative
  memberId: transaction.memberId,
  amount: transaction.amount,
  contributionDate: collection.collectionDate,
  paymentMethod: transaction.paymentMethod,
})
```

**5. Share Purchase**
```typescript
ShareCapitalTransaction.create({
  cooperativeId: transaction.cooperativeId,
  memberId: transaction.memberId,
  amount: transaction.amount,
  transactionDate: collection.collectionDate,
  type: 'purchase',
})
```

---

## Permissions System

### Staff Permissions

Defined in `backend/src/organizations/enums/permissions.enum.ts`:

```typescript
export enum StaffPermission {
  // Collection permissions
  MANAGE_COLLECTIONS = 'MANAGE_COLLECTIONS',           // Create/edit collections
  APPROVE_COLLECTIONS = 'APPROVE_COLLECTIONS',         // Approve/reject collections
  VIEW_ALL_COLLECTIONS = 'VIEW_ALL_COLLECTIONS',       // View all staff collections
  VIEW_OWN_COLLECTIONS = 'VIEW_OWN_COLLECTIONS',       // View own collections only
  
  // Transaction permissions
  POST_TRANSACTIONS = 'POST_TRANSACTIONS',             // Manually post to ledger
  EDIT_POSTED_TRANSACTIONS = 'EDIT_POSTED_TRANSACTIONS', // Edit after posting
  
  // Member permissions
  MANAGE_MEMBERS = 'MANAGE_MEMBERS',                   // Add/edit members
  VIEW_MEMBER_DETAILS = 'VIEW_MEMBER_DETAILS',         // View member info
  
  // Organization permissions
  MANAGE_STAFF = 'MANAGE_STAFF',                       // Add/edit staff
  MANAGE_SETTINGS = 'MANAGE_SETTINGS',                 // Change org settings
  VIEW_REPORTS = 'VIEW_REPORTS',                       // Access reports
}
```

### Permission Guards

**Usage Example:**
```typescript
@Controller('organizations/:organizationId/collections')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class CollectionsController {
  
  @Post()
  @Permissions(StaffPermission.MANAGE_COLLECTIONS)
  async create(@Param('organizationId') organizationId: string, ...) {
    // Only staff with MANAGE_COLLECTIONS can create
  }
  
  @Post(':id/approve')
  @Permissions(StaffPermission.APPROVE_COLLECTIONS)
  async approve(@Param('id') id: string, ...) {
    // Only staff with APPROVE_COLLECTIONS can approve
  }
}
```

---

## Technical Details

### State Management
- Collections not in Redux (direct API calls)
- Real-time refresh with pull-to-refresh
- Optimistic UI updates

### Error Handling
- All API calls wrapped in try-catch
- User-friendly error messages via Alert
- Network error recovery

### Data Validation

**Backend (class-validator):**
```typescript
class CreateTransactionDto {
  @IsEnum(['contribution', 'loan_repayment', 'ajo_payment', 'esusu_contribution', 'share_purchase'])
  type: string;

  @IsString()
  cooperativeId: string;

  @IsString()
  memberId: string;

  @IsInt()
  @Min(1)
  amount: number; // in cents

  @IsEnum(['cash', 'bank_transfer', 'mobile_money', 'card', 'check'])
  paymentMethod: string;
}
```

**Mobile:**
- Required field validation
- Amount > 0 validation
- Date validation
- Rejection reason required

### Icons (lucide-react-native)
- List, Plus, User, Wallet - CollectionsListScreen
- Calendar - CreateCollectionScreen
- List, Plus, Trash2, Send - CollectionDetailsScreen
- ChevronDown - AddTransactionScreen
- List, Check, X, User, Wallet - PendingApprovalsScreen

---

## Testing Guide

### Backend Testing

**1. Test Collection Creation**
```bash
curl -X POST http://localhost:3000/organizations/{orgId}/collections \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"collectionDate": "2026-01-16"}'
```

**2. Test Add Transaction**
```bash
curl -X POST http://localhost:3000/organizations/{orgId}/collections/{collectionId}/transactions \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "contribution",
    "cooperativeId": "...",
    "memberId": "...",
    "amount": 5000,
    "paymentMethod": "cash"
  }'
```

**3. Test Submit Collection**
```bash
curl -X POST http://localhost:3000/organizations/{orgId}/collections/{collectionId}/submit \
  -H "Authorization: Bearer {token}"
```

**4. Test Approve Collection**
```bash
curl -X POST http://localhost:3000/organizations/{orgId}/collections/{collectionId}/approve \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"notes": "Approved - all correct"}'
```

### Mobile Testing

**1. Field Agent Flow**
- Login as field agent user
- Navigate to cooperative detail
- Tap "Daily Collections"
- Create new collection
- Add 3-5 transactions of different types
- Submit for approval
- Verify status changes to "submitted"

**2. Supervisor Flow**
- Login as supervisor user
- Navigate to cooperative detail
- Tap "Approve Collections"
- Review submitted collection
- Approve one collection
- Reject another with reason
- Verify field agent sees updates

**3. Edge Cases**
- Try editing submitted collection (should fail)
- Try deleting collection with transactions
- Submit empty collection (should fail)
- Reject without reason (should fail)
- Test with slow network
- Test offline behavior

---

## Configuration

### Collection Settings

Create settings via backend API or direct database:

```sql
INSERT INTO "CollectionSettings" (
  "organizationId",
  "requireApproval",
  "autoPostAfterHours",
  "defaultTransactionTypes"
)
VALUES (
  '{org-id}',
  true,
  24,
  ARRAY['contribution', 'loan_repayment', 'ajo_payment']
);
```

### Staff Setup

Create staff and assign permissions:

```typescript
await staffService.create({
  organizationId: 'org-123',
  userId: 'user-456',
  role: 'field_agent',
  permissions: [
    StaffPermission.MANAGE_COLLECTIONS,
    StaffPermission.VIEW_OWN_COLLECTIONS,
    StaffPermission.VIEW_MEMBER_DETAILS,
  ],
});
```

---

## File Structure

```
backend/
├── prisma/
│   └── schema.prisma (6 new models)
├── src/
│   └── organizations/
│       ├── collections.service.ts (738 lines)
│       ├── collections.controller.ts (260 lines)
│       ├── organizations.service.ts (206 lines)
│       ├── staff.service.ts (432 lines)
│       ├── organizations.controller.ts (90 lines)
│       ├── staff.controller.ts (146 lines)
│       ├── organizations.module.ts
│       ├── dto/
│       │   ├── collection.dto.ts (93 lines)
│       │   ├── organization.dto.ts
│       │   └── staff.dto.ts
│       ├── guards/
│       │   ├── permissions.guard.ts
│       │   └── cooperative-access.guard.ts
│       ├── decorators/
│       │   ├── permissions.decorator.ts
│       │   └── get-staff.decorator.ts
│       └── enums/
│           ├── permissions.enum.ts
│           └── organization-type.enum.ts

src/
├── api/
│   ├── collectionsApi.ts (246 lines)
│   └── index.ts (export)
├── screens/
│   └── collections/
│       ├── CollectionsListScreen.tsx (349 lines)
│       ├── CreateCollectionScreen.tsx (127 lines)
│       ├── CollectionDetailsScreen.tsx (551 lines)
│       ├── AddTransactionScreen.tsx (268 lines)
│       ├── PendingApprovalsScreen.tsx (490 lines)
│       └── index.ts (exports)
└── navigation/
    └── MainNavigator.tsx (updated with routes)
```

---

## Performance Considerations

### Database Indexes
Recommended indexes for optimal performance:

```sql
CREATE INDEX idx_daily_collection_org_date ON "DailyCollection"("organizationId", "collectionDate");
CREATE INDEX idx_daily_collection_staff ON "DailyCollection"("staffId");
CREATE INDEX idx_daily_collection_status ON "DailyCollection"("status");
CREATE INDEX idx_collection_transaction_collection ON "CollectionTransaction"("collectionId");
CREATE INDEX idx_collection_transaction_member ON "CollectionTransaction"("memberId");
CREATE INDEX idx_staff_org_user ON "Staff"("organizationId", "userId");
```

### Query Optimization
- Use `include` to reduce N+1 queries
- Paginate large collection lists
- Filter on indexed columns
- Cache collection settings

### Mobile Optimization
- FlatList for efficient rendering
- Pull-to-refresh for data updates
- Debounce search inputs
- Lazy load transaction details

---

## Future Enhancements

### Suggested Features

1. **Collection Statistics Dashboard**
   - Daily/weekly/monthly summaries
   - Agent performance metrics
   - Average collection amounts
   - Transaction type breakdowns

2. **Push Notifications**
   - Notify supervisors of pending approvals
   - Alert agents when collection rejected
   - Remind about unsubmitted collections

3. **Offline Support**
   - Store collections locally
   - Sync when online
   - Conflict resolution

4. **Bulk Operations**
   - Bulk approve multiple collections
   - Bulk transaction import from CSV
   - Batch posting to ledger

5. **Advanced Reporting**
   - Collection aging report
   - Agent efficiency report
   - Transaction audit trail
   - Export to PDF/Excel

6. **GPS Tracking**
   - Capture location when creating collection
   - Route optimization for field agents
   - Visit verification

7. **Photo Attachments**
   - Attach payment receipts
   - Proof of transaction
   - Image upload to cloud storage

8. **QR Code Scanning**
   - Scan member ID cards
   - Quick payment entry
   - Reduce manual input errors

---

## Troubleshooting

### Common Issues

**1. Collection not submitting**
- Check that collection has at least one transaction
- Verify user has MANAGE_COLLECTIONS permission
- Check network connectivity

**2. Transactions not posting to ledger**
- Verify collection was approved
- Check that cooperative/member IDs exist
- Review backend logs for errors
- Ensure transaction type is valid for cooperative

**3. Permission denied errors**
- Verify user is a staff member in organization
- Check staff permissions array
- Ensure organization is active

**4. Modal pickers not working**
- Verify lucide-react-native is installed
- Check ChevronDown icon import
- Test on both iOS and Android

### Debug Commands

```bash
# Check collections
npx prisma studio

# View backend logs
npm run start:dev

# Check database schema
npx prisma db pull

# Reset database (CAUTION)
npx prisma migrate reset
```

---

## Migration Guide

### From Existing System

If migrating from an existing collection system:

1. **Backup Data**
   ```bash
   pg_dump database_name > backup.sql
   ```

2. **Run Migrations**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

3. **Seed Organizations**
   - Create Organization records from existing Cooperatives
   - Use `type: 'cooperative'`

4. **Migrate Staff**
   - Create Staff records from existing admin users
   - Assign appropriate permissions

5. **Import Historical Collections**
   - Write script to transform old data
   - Set status to 'approved' for historical records
   - Link to existing transactions

---

## Support & Resources

### Documentation
- [Prisma Docs](https://www.prisma.io/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [React Native Docs](https://reactnative.dev/docs)
- [lucide-react-native](https://lucide.dev/guide/packages/lucide-react-native)

### Code References
- Backend: `/backend/src/organizations/`
- Mobile: `/src/screens/collections/`
- API: `/src/api/collectionsApi.ts`
- Navigation: `/src/navigation/MainNavigator.tsx`

### Related Features
- Contribution Plans - Similar payment recording
- Loan Management - Repayment workflow reference
- Expense Management - Approval workflow pattern

---

## Conclusion

The Daily Collection System is now fully implemented and integrated into the cooperative management platform. It provides:

✅ **Complete Backend** - 6 models, 11 REST endpoints, full CRUD operations  
✅ **Mobile App** - 5 screens, 2,031 lines, polished UI  
✅ **Approval Workflow** - Draft → Submit → Approve/Reject  
✅ **Auto-Posting** - Transactions sync to ledgers  
✅ **Multi-Tenant** - Organizations, staff, permissions  
✅ **Production Ready** - Error handling, validation, TypeScript

The system is ready for testing and deployment. Field agents can now efficiently record member transactions during visits, and supervisors have complete oversight and approval control before transactions post to member accounts.
