import { Request, Response } from "express"
import { uploadImageFromFile } from "../services/uploadToCloudinary"
import { createJobRecord } from "../services/createJobRecord"
import { imageQueue } from "../queue/imageQueue"
import { startImageWorker } from "../jobs/imageWorkerManager"

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
      image_description,
      imageWeight,
    } = req.body

    const imageFile = req.file
    console.log("Body: ", req.body)
    console.log("imageFile: ", imageFile)
    if (!prompt || !userId || !imageFile) {
      return res.status(400).json({ error: "Missing required fields" })
    }

    // Store image in temp - but not working in production mode
    // const imagePath = imageFile.path

    const image_input_url = await uploadImageFromFile(imageFile, userId)

    console.log("image_input_url: ", image_input_url)

    // 1. Save job to DB
    const jobId = await createJobRecord({
      prompt,
      userId,
      isRemix: true,
      model,
      style_type,
      aspect_ratio,
      magic_prompt_option,
      negative_prompt,
      image_description,
      seed: seed ? parseInt(seed) : 0,
      color_palette,
      is_published: is_published === "true",
      image_weight: imageWeight ? parseInt(imageWeight) : 50,
      image_input_url: image_input_url,
    })

    // 2. Push to queue (minimal payload)
    await imageQueue.add("image", {
      jobId,
      prompt,
      userId,
      model,
      isRemix: true,
      style_type,
      aspect_ratio,
      magic_prompt_option,
      negative_prompt,
      seed: seed ? parseInt(seed) : 0,
      color_palette,
      image_weight: imageWeight ? parseInt(imageWeight) : 50,
      image_input_url: image_input_url,
    })

    // 3. Start Worker dynamically if not running
    await startImageWorker()

    return res.status(200).json({
      message: "Remix job queued successfully",
      jobId,
    })
  } catch (err) {
    console.error("❌ Error handling remix image:", err)
    return res.status(500).json({ error: "Internal Server Error" })
  }
}
