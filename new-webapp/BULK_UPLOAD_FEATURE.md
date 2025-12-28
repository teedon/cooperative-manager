# Bulk Offline Members Upload Feature

## Overview
This feature allows cooperative administrators to upload multiple offline members at once using a CSV file. Offline members are members who don't have access to mobile devices or the app.

## Features Implemented

### 1. CSV Template Download
- Admins can download a pre-formatted CSV template
- Template includes:
  - Required fields: First Name, Last Name
  - Optional fields: Phone, Email, Address
  - Sample data rows for reference

### 2. File Upload
- Drag-and-drop support for CSV files
- Click to browse functionality
- File type validation (CSV only)
- Real-time parsing and validation

### 3. Data Validation
- Required field validation (First Name, Last Name)
- Row-by-row error reporting
- Preview of parsed data before upload
- Error summary with row numbers

### 4. Upload Preview
- Table preview of parsed members (first 10 rows)
- Total count display
- Validation error display
- Confirm before upload

### 5. Success Feedback
- Success animation and message
- Automatic modal close after success
- Toast notification on the main page
- Automatic refresh of member list

## File Structure

```
new-webapp/src/
├── pages/
│   ├── BulkOfflineMembersModal.tsx      # Main modal component
│   └── CooperativeDetailsPage.tsx        # Integration point
└── api/
    └── cooperativeApi.ts                 # API methods (backend integration pending)
```

## Usage

### For Users (Admins)

1. Navigate to Cooperative Details page
2. Click on "Offline Members" button in the Admin Actions section
3. Download the CSV template
4. Fill in member details:
   - **Required**: First Name, Last Name
   - **Optional**: Phone, Email, Address
5. Upload the completed CSV file
6. Review the parsed data and validation errors (if any)
7. Click "Upload Members" to complete

### CSV Template Format

```csv
First Name*,Last Name*,Phone,Email,Address
John,Doe,08012345678,john.doe@example.com,"123 Main Street, Lagos"
Jane,Smith,08098765432,jane.smith@example.com,"456 Oak Avenue, Abuja"
Michael,Johnson,07011223344,,"Plot 789, Victoria Island"
```

**Notes:**
- Fields marked with * are required
- Use quotes for fields containing commas
- Phone numbers should be Nigerian format (e.g., 08012345678)
- Empty optional fields can be left blank

## Backend Integration (TODO)

### Required Endpoint

**POST** `/cooperatives/:id/offline-members/bulk`

**Request Body:**
```json
{
  "members": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "phone": "08012345678",
      "email": "john.doe@example.com",
      "address": "123 Main Street, Lagos"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "addedCount": 1,
    "members": [
      {
        "id": "member-id",
        "cooperativeId": "coop-id",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "08012345678",
        "email": "john.doe@example.com",
        "address": "123 Main Street, Lagos",
        "isOfflineMember": true,
        "status": "active",
        "createdAt": "2025-12-28T00:00:00.000Z"
      }
    ]
  }
}
```

### API Method to Add

Add this to `new-webapp/src/api/cooperativeApi.ts`:

```typescript
interface OfflineMemberData {
  firstName: string
  lastName: string
  phone?: string
  email?: string
  address?: string
}

bulkAddOfflineMembers: async (
  cooperativeId: string,
  members: OfflineMemberData[]
) => {
  const response = await apiClient.post(
    `/cooperatives/${cooperativeId}/offline-members/bulk`,
    { members }
  )
  return response.data
}
```

### Update Modal Component

In `BulkOfflineMembersModal.tsx`, replace the simulated API call (line ~157) with:

```typescript
const response = await cooperativeApi.bulkAddOfflineMembers(cooperativeId, parsedMembers)

if (response.success) {
  setUploadSuccess(true)
  setTimeout(() => {
    onSuccess()
    handleClose()
  }, 2000)
} else {
  throw new Error(response.message || 'Upload failed')
}
```

## Security Considerations

### Backend Implementation
1. **Authentication**: Verify user is authenticated
2. **Authorization**: Check user has admin/moderator role for the cooperative
3. **Validation**: Server-side validation of all fields
4. **Rate Limiting**: Limit bulk uploads to prevent abuse
5. **Duplicate Detection**: Check for duplicate members by name/phone/email
6. **Transaction**: Use database transactions for atomic operations

### Recommended Backend Validation

```typescript
// Pseudo-code for backend validation
- Verify user is admin/moderator of cooperative
- Validate each member:
  - firstName: required, max 50 chars, alphanumeric + spaces
  - lastName: required, max 50 chars, alphanumeric + spaces
  - phone: optional, valid Nigerian phone format
  - email: optional, valid email format
  - address: optional, max 200 chars
- Check for duplicates within the batch
- Check for existing members with same details
- Limit batch size (e.g., max 100 members per upload)
```

## Database Schema

The backend should store offline members with these fields:

```prisma
model Member {
  id              String      @id @default(cuid())
  cooperativeId   String
  userId          String?     // null for offline members
  firstName       String
  lastName        String
  phone           String?
  email           String?
  address         String?
  isOfflineMember Boolean     @default(false)
  status          String      @default("active")
  role            String      @default("member")
  virtualBalance  Float       @default(0)
  joinedAt        DateTime    @default(now())
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  cooperative     Cooperative @relation(fields: [cooperativeId], references: [id])
  user            User?       @relation(fields: [userId], references: [id])
}
```

## Testing Checklist

- [ ] Template download works and contains correct headers
- [ ] File upload validates CSV format
- [ ] Drag-and-drop functionality works
- [ ] Required field validation catches empty names
- [ ] Validation errors display correctly with row numbers
- [ ] Preview table shows correct data
- [ ] Upload button disabled when no valid data
- [ ] Success state displays correctly
- [ ] Modal closes after successful upload
- [ ] Toast notification appears on success
- [ ] Member list refreshes after upload
- [ ] Error handling for network failures
- [ ] Large file handling (100+ rows)

## Future Enhancements

1. **Excel Support**: Add .xlsx file format support
2. **Bulk Edit**: Allow editing offline members in bulk
3. **Import History**: Track all bulk imports with timestamps
4. **Duplicate Detection**: Frontend pre-check for duplicates
5. **Field Mapping**: Allow custom column mapping
6. **Data Export**: Export offline members to CSV
7. **Photo Upload**: Bulk upload with member photos
8. **Auto-formatting**: Auto-format phone numbers
9. **Progress Bar**: Show upload progress for large batches
10. **Undo Feature**: Allow reverting recent bulk uploads

## Support

For issues or questions about this feature, contact the development team or file an issue in the repository.

## Version History

- **v1.0.0** (2025-12-28): Initial implementation with CSV upload and template download
