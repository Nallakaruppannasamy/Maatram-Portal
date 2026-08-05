import { cloudinary } from '@/config/cloudinary';

/**
 * Uploads a file buffer directly to Cloudinary.
 * @param buffer - File buffer from multer memoryStorage.
 * @param folder - Folder path on Cloudinary.
 */
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (!result) {
          return reject(new Error('Cloudinary upload result is undefined'));
        }
        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );
    uploadStream.end(buffer);
  });
};

/**
 * Deletes an image from Cloudinary using its public_id.
 * @param publicId - Cloudinary public id of the file.
 */
export const deleteFromCloudinary = (publicId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });
  });
};
