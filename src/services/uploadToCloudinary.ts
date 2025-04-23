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
