import { Request, Response } from "express"
import { createJobAndQueue } from "../services/createJobAndQueue"

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
    } = req.body

    if (!prompt || !userId) {
      return res.status(400).json({ error: "prompt and userId are required" })
    }

    const jobId = await createJobAndQueue({
      prompt,
      userId,
      model,
      style_type,
      aspect_ratio,
      magic_prompt_option,
      negative_prompt,
    })

    return res.status(200).json({
      message: "Job added to queue",
      jobId,
    })
  } catch (err) {
    console.error("Error generating image:", err)
    return res.status(500).json({ error: "Internal Server Error" })
  }
}
