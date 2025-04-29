import { Request, Response } from "express"
import { imageQueue } from "../queue/imageQueue"
import { createJobRecord } from "../services/createJobRecord"
import { startImageWorker } from "../jobs/imageWorkerManager"
export const handleGenerateImage = async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      userId,
      model,
      style_type,
      aspect_ratio,
      magic_prompt_option,
      negative_prompt,
      image_description,
      seed,
      color_palette,
      is_published,
    } = req.body

    console.log("req.body: ", req.body)

    if (!prompt || !userId) {
      return res.status(400).json({ error: "prompt and userId are required" })
    }

    // Save job to DB
    const jobId = await createJobRecord({
      prompt,
      userId,
      model,
      style_type,
      aspect_ratio,
      magic_prompt_option,
      image_description,
      negative_prompt,
      seed,
      color_palette,
      is_published,
    })

    // Push to queue (minimal payload)
    await imageQueue.add("image", {
      jobId,
      prompt,
      userId,
      model,
      isRemix: false,
      style_type,
      aspect_ratio,
      magic_prompt_option,
      negative_prompt,
      seed,
      color_palette,
    })

    await startImageWorker()

    return res.status(200).json({
      message: "Job added to queue",
      jobId,
    })
  } catch (err) {
    console.error("❌ Error generating image:", err)
    return res.status(500).json({ error: "Internal Server Error" })
  }
}
