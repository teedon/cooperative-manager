import { loanApi } from '../api/loanApi';

export interface DocumentUploadResult {
  documentUrl: string;
  filePath: string;
  fileName: string;
}

/**
 * Upload a KYC document to Supabase Storage via backend
 * @param file - Document file with uri, type, and name
 * @param userId - Current user ID
 * @returns Upload result with document URL and metadata
 */
export async function uploadKYCDocument(
  file: {
    uri: string;
    type?: string;
    name: string;
  },
  userId: string,
): Promise<DocumentUploadResult> {
  try {
    // Determine content type
    const contentType = file.type || getMimeType(file.name);

    // Upload file through backend
    const result = await loanApi.uploadDocument({
      uri: file.uri,
      type: contentType,
      name: file.name,
    });

    return {
      documentUrl: result.documentUrl,
      filePath: result.filePath,
      fileName: result.fileName,
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload multiple documents in parallel
 */
export async function uploadMultipleDocuments(
  files: Array<{ uri: string; type?: string; name: string; documentType: string }>,
  userId: string,
): Promise<Array<DocumentUploadResult & { type: string }>> {
  const uploadPromises = files.map(async (file) => {
    const result = await uploadKYCDocument(
      {
        uri: file.uri,
        type: file.type,
        name: file.name,
      },
      userId,
    );
    return {
      ...result,
      type: file.documentType,
    };
  });

  return Promise.all(uploadPromises);
}

/**
 * Get MIME type from file extension
 */
function getMimeType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };

  return mimeTypes[extension || ''] || 'application/octet-stream';
}

/**
 * Validate file before upload
 */
export function validateDocument(file: { name: string; size?: number }): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
  
  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedExtensions.join(', ')}`,
    };
  }

  // Check file size (if available)
  if (file.size && file.size > maxSize) {
    return {
      valid: false,
      error: 'File size must be less than 10MB',
    };
  }

  return { valid: true };
}
