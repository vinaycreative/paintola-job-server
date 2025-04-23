import { v2 as cloudinary } from "cloudinary"

// ✅ Load env variables
import dotenv from "dotenv"
dotenv.config()

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function testUpload() {
  try {
    const sampleImage = "https://placehold.co/600x400"

    const result = await cloudinary.uploader.upload(sampleImage, {
      folder: "paintola/generated",
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    })

    console.log("✅ Upload successful!")
    console.log("CDN URL:", result.secure_url)
  } catch (err: any) {
    console.error("❌ Cloudinary upload failed:", err.message)
  }
}

testUpload()
