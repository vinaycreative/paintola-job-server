import { Request, Response } from "express"
import { uploadImageFromFile } from "../services/uploadToCloudinary"
import { createJobRecord } from "../services/createJobRecord"
import { imageQueue } from "../queue/imageQueue"

export const handleRemixImage = async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      userId,
      model,
      style_type,
      aspect_ratio,
      magic_prompt_option,
      negative_prompt,
      seed,
      color_palette,
      is_published,
      imageWeight,
    } = req.body

    const imageFile = req.file
    if (!prompt || !userId || !imageFile) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // const image_input_url = await uploadImageFromFile(imageFile)
    // console.log("File URL: ", image_input_url)
    const imagePath = imageFile.path
    // ✅ Create job with centralized structure
    const jobId = await createJobRecord({
      prompt,
      userId,
      isRemix: true,
      model,
      style_type,
      aspect_ratio,
      magic_prompt_option,
      negative_prompt,
      seed: seed ? parseInt(seed) : undefined,
      color_palette,
      is_published: is_published === "true",
      image_weight: imageWeight ? parseInt(imageWeight) : 50,
      image_input_url: imagePath,
    })

    // ✅ Push to remix queue
    await imageQueue.add(
      "image",
      {
        jobId,
        prompt,
        userId,
        model,
        isRemix: true,
        style_type,
        aspect_ratio,
        magic_prompt_option,
        negative_prompt,
        seed: seed ? parseInt(seed) : undefined,
        color_palette,
        image_weight: imageWeight ? parseInt(imageWeight) : 50,
        image_input_url: imagePath,
      },
      { removeOnComplete: true, removeOnFail: true }
    )

    return res.status(200).json({
      message: "Remix job queued successfully",
      jobId,
    })
  } catch (err) {
    console.error("❌ Error handling remix image:", err)
    return res.status(500).json({ error: "Internal Server Error" })
  }
}
