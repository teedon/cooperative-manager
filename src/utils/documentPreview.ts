/**
 * Utility functions for document preview functionality
 */

export interface DocumentPreview {
  uri: string;
  name: string;
  mimeType?: string;
  type: 'image' | 'pdf' | 'document';
}

/**
 * Check if a file is an image based on MIME type or file extension
 */
export const isImageFile = (mimeType: string | undefined, fileName: string): boolean => {
  if (mimeType) {
    return mimeType.startsWith('image/');
  }
  
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  const extension = fileName.split('.').pop()?.toLowerCase();
  return imageExtensions.includes(extension || '');
};

/**
 * Check if a file is a PDF based on MIME type or file extension
 */
export const isPdfFile = (mimeType: string | undefined, fileName: string): boolean => {
  if (mimeType) {
    return mimeType === 'application/pdf';
  }
  
  return fileName.toLowerCase().endsWith('.pdf');
};

/**
 * Get the document type for preview purposes
 */
export const getDocumentType = (mimeType: string | undefined, fileName: string): 'image' | 'pdf' | 'document' => {
  if (isImageFile(mimeType, fileName)) {
    return 'image';
  }
  
  if (isPdfFile(mimeType, fileName)) {
    return 'pdf';
  }
  
  return 'document';
};

/**
 * Get a preview-friendly display name for a document type
 */
export const getDocumentDisplayName = (type: string): string => {
  const displayNames: Record<string, string> = {
    passport: 'Passport',
    national_id: 'National ID',
    drivers_license: "Driver's License",
    utility_bill: 'Utility Bill',
    bank_statement: 'Bank Statement',
    certificate: 'Certificate',
    other: 'Other Document',
  };
  
  return displayNames[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Validate file size and type for document uploads
 */
export const validateDocumentForPreview = (
  fileName: string, 
  fileSize?: number,
  maxSizeMB: number = 10
): { valid: boolean; error?: string } => {
  const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'doc', 'docx'];
  
  // Check file extension
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (!extension || !allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedExtensions.join(', ')}`,
    };
  }
  
  // Check file size (if available)
  const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
  if (fileSize && fileSize > maxSize) {
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }
  
  return { valid: true };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};