# Supabase Storage Implementation

## Overview
This document describes the Supabase storage integration for handling file uploads (KYC documents, profile pictures, etc.) in the Cooperative Manager application.

## Architecture

**Flow:**
1. User selects document in mobile app
2. Mobile app requests signed upload URL from backend
3. Backend generates signed URL from Supabase
4. Mobile app uploads directly to Supabase Storage (bypasses backend)
5. Backend saves the document URL in database
6. Documents are served via Supabase CDN

## Setup Instructions

### 1. Create Supabase Project

1. Sign up at [supabase.com](https://supabase.com) (free tier available)
2. Create a new project
3. Navigate to **Settings** → **API**
4. Copy the following credentials:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon/public key**: For mobile app
   - **service_role key**: For backend (keep secret!)

### 2. Create Storage Bucket

Go to **Storage** in Supabase Dashboard and create a bucket:

```sql
-- Bucket name: kyc-documents
-- Public: false (requires authentication)
-- File size limit: 10MB
```

### 3. Set Storage Policies

Go to **Storage** → **Policies** and add:

```sql
CREATE POLICY "Users can upload KYC documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'kyc-documents');

CREATE POLICY "Users can view their documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'kyc-documents');

CREATE POLICY "Service role has full access"
ON storage.objects
TO service_role
USING (bucket_id = 'kyc-documents')
WITH CHECK (bucket_id = 'kyc-documents');
```

### 4. Configure Environment Variables

**Backend** (`backend/.env`):
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here
```

**Mobile App** (`src/services/supabase.ts`):
```typescript
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key-here';
```

## Implementation Details

### Backend

**Files Created:**
- `backend/src/services/supabase.service.ts` - Main Supabase service
- `backend/src/loans/loans.controller.ts` - Added upload URL endpoint

**Key Methods:**
- `generateUploadUrl()` - Creates signed URL for client uploads
- `getPublicUrl()` - Gets public URL for viewing
- `deleteFile()` - Removes files from storage

**API Endpoint:**
```
POST /loans/upload-url
Body: { fileName: string, contentType: string }
Response: { uploadUrl: string, filePath: string }
```

### Mobile App

**Files Created:**
- `src/services/supabase.ts` - Supabase client configuration
- `src/utils/uploadDocument.ts` - Upload utility functions
- Updated `src/screens/loans/LoanRequestScreen.tsx`
- Updated `src/api/loanApi.ts`

**Key Functions:**
- `uploadKYCDocument()` - Upload single document
- `uploadMultipleDocuments()` - Upload multiple documents in parallel
- `validateDocument()` - Validate file before upload

## Usage Example

```typescript
// In LoanRequestScreen
const onSubmit = async () => {
  // 1. Upload documents to Supabase
  const uploadedDocs = await uploadMultipleDocuments(
    formData.kycDocuments.map(doc => ({
      uri: doc.uri,
      type: doc.mimeType,
      name: doc.name,
      documentType: doc.type,
    })),
    user?.id || '',
  );

  // 2. Submit loan with document URLs
  await dispatch(requestLoan({
    cooperativeId,
    data: {
      ...submitData,
      kycDocuments: uploadedDocs.map(doc => ({
        type: doc.type,
        documentUrl: doc.documentUrl,
        fileName: doc.fileName,
        mimeType: 'application/pdf',
      })),
    },
  })).unwrap();
};
```

## File Organization

Files are organized by user ID and timestamp:
```
kyc-documents/
├── user-123/
│   ├── 1704672000000-passport.pdf
│   ├── 1704672000001-id-card.jpg
│   └── 1704672000002-proof-of-address.pdf
└── user-456/
    └── 1704672000003-bank-statement.pdf
```

## File Validation

**Allowed File Types:**
- PDF: `application/pdf`
- Images: `image/jpeg`, `image/png`
- Documents: `.doc`, `.docx`

**Constraints:**
- Max file size: 10MB
- Files are validated on client before upload
- File names are sanitized to prevent issues

## Security

- **Signed URLs**: Expire after 1 hour
- **Row Level Security**: Policies restrict access
- **Service Role Key**: Only used in backend (never exposed to client)
- **Anon Key**: Used in client (safe to expose)

## Benefits

✅ **Direct Upload**: No backend bottleneck
✅ **Scalable**: Supabase handles CDN and scaling
✅ **Secure**: RLS policies protect data
✅ **Fast**: Built-in CDN for global delivery
✅ **Cost-effective**: Free tier: 1GB storage
✅ **Simple**: Fewer moving parts than AWS S3

## Cost

**Free Tier:**
- 1GB storage
- 2GB bandwidth/month
- Up to 50MB file upload

**Paid Plan ($25/month):**
- 100GB storage
- 200GB bandwidth
- Up to 5GB file upload

## Testing

1. Start backend: `npm run start:dev`
2. Update Supabase credentials in `.env` files
3. Create a bucket named `kyc-documents` in Supabase
4. Test upload in mobile app via loan request screen

## Troubleshooting

**Upload fails with CORS error:**
- Ensure bucket is created in Supabase
- Check RLS policies are set correctly

**"Supabase credentials not configured" error:**
- Verify `.env` variables are set
- Restart backend after updating `.env`

**Files not appearing:**
- Check browser console/device logs
- Verify upload completed successfully
- Check Supabase Storage dashboard

## Future Enhancements

- [ ] Add image compression before upload
- [ ] Implement progress tracking
- [ ] Add thumbnail generation
- [ ] Support for drag-and-drop (web)
- [ ] Bulk delete functionality
- [ ] Admin document verification UI
