import cloudinary from "../config/cloudinary"

export const uploadImageFromUrl = async (imageUrl: string): Promise<string> => {
  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: "paintola/generated",
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    })

    return result.secure_url
  } catch (error: any) {
    console.error("❌ Cloudinary upload failed:", error.message)
    throw new Error("Image upload to CDN failed.")
  }
}

// ✅ For remix image uploads (from buffer/file)
export const uploadImageFromFile = async (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "paintola/remix",
          use_filename: true,
          unique_filename: false,
          overwrite: true,
        },
        (err, result) => {
          if (err || !result) {
            console.error("❌ Cloudinary upload failed:", err?.message)
            return reject(new Error("Image upload to CDN failed."))
          }

          resolve(result.secure_url)
        }
      )
      .end(file.buffer)
  })
}
