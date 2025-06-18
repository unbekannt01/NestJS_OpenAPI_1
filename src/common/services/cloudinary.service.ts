import { Injectable } from "@nestjs/common"
import { v2 as cloudinary } from "cloudinary"
import { configService } from "./config.service"

@Injectable()
export class CloudinaryService {
  private readonly driver = configService.getValue("STORAGE_DRIVER") || "local"

  constructor() {
    if (this.driver === "cloudinary") {
      cloudinary.config({
        cloud_name: configService.getValue("CLOUDINARY_CLOUD_NAME", true),
        api_key: configService.getValue("CLOUDINARY_API_KEY", true),
        api_secret: configService.getValue("CLOUDINARY_API_SECRET", true),
      })
    }
  }

  async uploadBuffer(filename: string, buffer: Buffer, mimetype: string): Promise<string> {
    if (this.driver !== "cloudinary") {
      throw new Error("Cloudinary client is not enabled in this environment")
    }

    return new Promise((resolve, reject) => {
      const uploadOptions = {
        resource_type: "auto" as const,
        public_id: `${Date.now()}-${filename.split(".")[0]}`,
        folder: "uploads-nest",
        use_filename: true,
        unique_filename: false,
      }

      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error)
            reject(new Error(error.message))
          } else if (result) {
            resolve(result.public_id)
          } else {
            reject(new Error("Upload failed - no result returned"))
          }
        })
        .end(buffer)
    })
  }

  async deleteFile(publicId: string): Promise<void> {
    if (this.driver !== "cloudinary") {
      throw new Error("Cloudinary client is not enabled in this environment")
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId)

      if (result.result !== "ok") {
        throw new Error(`Failed to delete file: ${result.result}`)
      }

      console.log("Deleted from Cloudinary:", publicId)
    } catch (error) {
      console.error("Cloudinary delete error:", error)
      throw new Error(error.message)
    }
  }

  async getFileById(publicId: string): Promise<Buffer> {
    if (this.driver !== "cloudinary") {
      throw new Error("Cloudinary client is not enabled in this environment")
    }

    try {
      // Get the secure URL for the file
      const url = cloudinary.url(publicId, {
        resource_type: "auto",
        secure: true,
      })

      // Fetch the file content
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      console.error("Cloudinary download error:", error)
      throw new Error(error.message)
    }
  }

  getSignedUrl(publicId: string): string {
    if (this.driver !== "cloudinary") {
      throw new Error("Cloudinary client is not enabled in this environment")
    }

    return cloudinary.url(publicId, {
      resource_type: "auto",
      secure: true,
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
    })
  }

  getPublicUrl(publicId: string): string {
    if (this.driver !== "cloudinary") {
      throw new Error("Cloudinary client is not enabled in this environment")
    }

    return cloudinary.url(publicId, {
      resource_type: "auto",
      secure: true,
    })
  }
}
