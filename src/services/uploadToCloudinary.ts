import cloudinary from "../config/cloudinary"

export const uploadImageFromUrl = async (imageUrl: string, userId: string): Promise<string> => {
  const timestamp = Date.now()
  const filename = `${userId}-${timestamp}`

  try {
    const result = await cloudinary.uploader.upload(imageUrl, {
      folder: "paintola/generated",
      public_id: filename,
      use_filename: false,
      unique_filename: false,
      overwrite: false,
    })

    return result.secure_url
  } catch (error: any) {
    console.error("❌ Cloudinary upload failed:", error.message)
    throw new Error("Image upload to CDN failed.")
  }
}

// For remix image uploads (from buffer/file)
export const uploadImageFromFile = async (
  file: Express.Multer.File,
  userId: string
): Promise<string> => {
  const timestamp = Date.now() // Optional but useful for debugging/tracing
  const filename = `${userId}-${timestamp}`

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "paintola/remix",
          public_id: filename,
          use_filename: false,
          unique_filename: false,
          overwrite: false, // prevent any overwrite
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
