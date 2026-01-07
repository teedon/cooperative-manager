import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials are not configured');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    bucket: string,
    path: string,
    file: Buffer,
    contentType: string,
  ) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        upsert: false,
      });

    if (error) {
      throw new InternalServerErrorException(`Upload failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * Get signed URL for private file access
   */
  async getSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      throw new InternalServerErrorException(`Failed to generate signed URL: ${error.message}`);
    }

    return data.signedUrl;
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      throw new InternalServerErrorException(`Delete failed: ${error.message}`);
    }
  }

  /**
   * Generate signed upload URL for client-side uploads
   * Returns metadata for client to upload directly
   */
  async generateUploadUrl(
    bucket: string,
    fileName: string,
    userId: string,
  ): Promise<{ uploadUrl: string; filePath: string; publicUrl: string }> {
    // Create unique file path with timestamp and user ID
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${userId}/${timestamp}-${sanitizedFileName}`;

    // For Supabase, we'll return the upload endpoint URL
    // The client will upload using the bucket's public URL with authentication
    const uploadUrl = `${process.env.SUPABASE_URL}/storage/v1/object/${bucket}/${filePath}`;
    
    // Get the public URL that will be accessible after upload
    const publicUrl = this.getPublicUrl(bucket, filePath);

    return {
      uploadUrl,
      filePath,
      publicUrl,
    };
  }

  /**
   * List files in a bucket/path
   */
  async listFiles(bucket: string, path: string = '') {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .list(path);

    if (error) {
      throw new InternalServerErrorException(`List failed: ${error.message}`);
    }

    return data;
  }
}
