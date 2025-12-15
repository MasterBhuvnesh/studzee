import { v2 as cloudinary } from 'cloudinary'
import { config } from './index'
import logger from '../utils/logger'

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
})

logger.info('Cloudinary configured', {
  cloudName: config.CLOUDINARY_CLOUD_NAME,
})

export { cloudinary }

/**
 * Ensure required folders exist in Cloudinary
 * This creates placeholder files to ensure folders exist
 */
export const ensureFoldersExist = async (): Promise<void> => {
  try {
    logger.info('Verifying Cloudinary folders exist...')

    // Note: Cloudinary doesn't have explicit folder creation API
    // Folders are created automatically when you upload to them
    // This function is here for future expansion if needed

    logger.info('Cloudinary folders will be created on first upload')
  } catch (error) {
    logger.error(error, 'Error verifying Cloudinary folders')
    throw error
  }
}

/**
 * Upload a file to Cloudinary
 * @param fileBuffer - The file buffer to upload
 * @param folder - The folder to upload to (e.g., 'images' or 'pdfs')
 * @param filename - The desired filename (without extension)
 * @param resourceType - The resource type ('image' or 'raw' for PDFs)
 * @returns Upload result with URL and public ID
 */
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string,
  filename: string,
  resourceType: 'image' | 'raw' = 'image'
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    logger.info('Starting Cloudinary upload', {
      folder,
      filename,
      resourceType,
      bufferSize: fileBuffer.length,
    })

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: filename,
        resource_type: resourceType,
        overwrite: true, // Allow replacing existing files
      },
      (error, result) => {
        if (error) {
          logger.error(error, 'Cloudinary upload error', {
            folder,
            filename,
            resourceType,
          })
          reject(error)
        } else if (result) {
          logger.info('Cloudinary upload successful', {
            url: result.secure_url,
            publicId: result.public_id,
          })
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          })
        } else {
          const noResultError = new Error('No result from Cloudinary upload')
          logger.error(noResultError, 'Cloudinary upload failed')
          reject(noResultError)
        }
      }
    )
    uploadStream.end(fileBuffer)
  })
}

/**
 * Delete a file from Cloudinary by public ID
 * @param publicId - The public ID of the file to delete
 * @param resourceType - The resource type ('image' or 'raw' for PDFs)
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'raw' = 'image'
): Promise<void> => {
  try {
    logger.info('Deleting file from Cloudinary', { publicId, resourceType })
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    })
    logger.info('Deleted file from Cloudinary', { publicId, result })
  } catch (error) {
    logger.error(error, `Failed to delete file from Cloudinary: ${publicId}`)
    throw error
  }
}

/**
 * Extract public ID from Cloudinary URL
 * @param url - The Cloudinary URL
 * @returns Public ID
 */
export const getPublicIdFromUrl = (url: string): string => {
  try {
    // Example URL: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/filename.ext
    // Extract: folder/filename
    const parts = url.split('/')
    const uploadIndex = parts.indexOf('upload')
    if (uploadIndex === -1) {
      throw new Error('Invalid Cloudinary URL: "upload" not found')
    }
    // Get everything after 'upload' and the version (v1234567890)
    const pathParts = parts.slice(uploadIndex + 2)
    // Join and remove extension
    const pathWithExt = pathParts.join('/')
    const lastDotIndex = pathWithExt.lastIndexOf('.')
    const publicId =
      lastDotIndex === -1
        ? pathWithExt
        : pathWithExt.substring(0, lastDotIndex)

    logger.info('Extracted public ID from URL', { url, publicId })
    return publicId
  } catch (error) {
    logger.error(error, 'Failed to extract public ID from URL', { url })
    throw error
  }
}
