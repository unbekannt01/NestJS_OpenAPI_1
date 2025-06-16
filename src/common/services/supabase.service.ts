/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
// supabase.service.ts

import { Injectable } from '@nestjs/common';
import { configService } from './config.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupaBaseService {
  private client: SupabaseClient | null = null;
  private readonly driver = configService.getValue('STORAGE_DRIVER') || 'local';

  private getClient(): SupabaseClient {
    if (this.driver !== 'supabase') {
      throw new Error('Supabase client is not enabled in this environment');
    }

    if (!this.client) {
      const url = configService.getValue('SUPABASE_URL', true);
      const key = configService.getValue('SUPABASE_SERVICE_ROLE_KEY', true);

      this.client = createClient(url!, key!);
    }

    return this.client;
  }

  async uploadBuffer(
    filename: string,
    buffer: Buffer,
    mimetype: string,
  ): Promise<string> {
    if (this.driver === 'local') {
      // Save file locally
      const fs = await import('fs');
      const path = await import('path');
      const uploadDir = path.resolve(process.cwd(), 'uploads');

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, `${Date.now()}-${filename}`);
      await fs.promises.writeFile(filePath, buffer);

      return path.relative(process.cwd(), filePath);
    }

    // Supabase upload
    const client = this.getClient();
    const filePath = `${Date.now()}-${filename}`;
    const bucket = 'uploads-nest';

    const { data, error } = await client.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: mimetype,
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(error.message);
    }

    const { data: signedUrlData, error: signedUrlError } = await client.storage
      .from(bucket)
      .createSignedUrl(filePath, 3600);

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
      throw new Error(signedUrlError.message);
    }

    return signedUrlData?.signedUrl;
  }

  async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async deleteFile(fileUrlOrPath: string): Promise<void> {
    const bucket = 'uploads-nest';

    // LOCAL MODE
    if (this.driver === 'local') {
      const fs = await import('fs');
      const path = await import('path');

      const absolutePath = path.resolve(
        process.cwd(),
        fileUrlOrPath.replace(/^\/+/, ''),
      );

      if (fs.existsSync(absolutePath)) {
        await fs.promises.unlink(absolutePath);
      } else {
        throw new Error('Local file not found');
      }

      return;
    }

    // SUPABASE MODE
    let filePath: string;

    if (fileUrlOrPath.includes('supabase.co')) {
      const parts = fileUrlOrPath.split(`${bucket}/`);
      if (parts.length < 2) {
        throw new Error('Invalid Supabase file URL');
      }

      filePath = parts[1].split('?')[0];
    } else {
      filePath = fileUrlOrPath;
    }

    const client = this.getClient();
    const { error } = await client.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      throw new Error(error.message);
    }

    console.log('Deleted from Supabase:', filePath);
  }

  // async updateFile(
  //   fileUrlOrPath: string,
  //   newBuffer: Buffer,
  //   newFilename: string,
  //   newMimetype: string,
  // ): Promise<string> {
  //   const bucket = 'uploads-nest';
  //   const client = this.getClient();
  //   let filePath: string;
  //   if (fileUrlOrPath.includes('supabase.co')) {
  //     const parts = fileUrlOrPath.split(`${bucket}/`);
  //     if (parts.length < 2) {
  //       throw new Error('Invalid Supabase file URL');
  //     }
  //     filePath = parts[1].split('?')[0];
  //   } else {
  //     filePath = fileUrlOrPath;
  //   }
  //   // Delete the old file
  //   await this.deleteFile(fileUrlOrPath);
  //   // Upload the new file
  //   const { data, error } = await client.storage
  //     .from(bucket)
  //     .upload(`${Date.now()}-${newFilename}`, newBuffer, {
  //       contentType: newMimetype,
  //       upsert: true,
  //     });
  //   if (error) {
  //     throw new Error(error.message);
  //   }
  //   // Create a signed URL for the new file
  //   const { data: signedUrlData, error: signedUrlError } = await client.storage
  //     .from(bucket)   
  //     .createSignedUrl(`${Date.now()}-${newFilename}`, 3600); 
  //   if (signedUrlError) {
  //     throw new Error(signedUrlError.message);
  //   }
  //   return signedUrlData?.signedUrl || '';
  // }

  async getFileById(fileUrlOrPath: string): Promise<Buffer | null> {
    const bucket = 'uploads-nest';
    const client = this.getClient();

    let filePath: string;

    if (fileUrlOrPath.includes('supabase.co')) {
      const parts = fileUrlOrPath.split(`${bucket}/`);
      if (parts.length < 2) {
        throw new Error('Invalid Supabase file URL');
      }

      filePath = parts[1].split('?')[0];
    } else {
      filePath = fileUrlOrPath;
    }

    const { data, error } = await client.storage
      .from(bucket)
      .download(filePath);

    if (error) {
      console.error('Download error:', error);
      throw new Error(error.message);
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
