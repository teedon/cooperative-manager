# App Files Storage

This directory contains the mobile and web app files for download.

## Files
- `cooperative-manager.apk` - Android app
- `cooperative-manager.ipa` - iOS app
- `cooperative-manager-web.zip` - Web app (PWA)

## Upload Instructions

### Using the API (Recommended)
Upload files using the protected endpoint:
```bash
curl -X POST http://localhost:3000/downloads/upload/android \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/cooperative-manager.apk"
```

### Manual Upload
1. Place your app files in this directory
2. Ensure files are named correctly:
   - Android: `cooperative-manager.apk`
   - iOS: `cooperative-manager.ipa`
   - Web: `cooperative-manager-web.zip`

## Security Notes
- This directory is NOT served publicly
- Files are only accessible through the `/downloads/app/:platform` endpoint
- All downloads are tracked in the database
- File uploads require authentication

## Backup
Old versions are automatically backed up when new files are uploaded:
- Format: `filename.backup.TIMESTAMP`
- Example: `cooperative-manager.apk.backup.1704153600000`
