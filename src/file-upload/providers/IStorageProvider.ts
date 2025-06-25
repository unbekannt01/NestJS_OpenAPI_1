// file-upload/providers/IStorageProvider.ts
export interface UploadResult {
  url: string;
  publicId: string;
  resourceType?: 'image' | 'video' | 'raw';
}

export interface IStorageProvider {
  upload(
    file: Express.Multer.File,
    fileType?: 'avatar' | 'general',
  ): Promise<UploadResult>;

  delete?(publicId: string, mimeType: string): Promise<void>;

  // getFile?(publicId: string, mimeType: string): Promise<Buffer>;

  getSignedUrl?(publicId: string, mimeType: string): Promise<string>;
}