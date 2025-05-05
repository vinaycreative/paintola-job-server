import { Request, Response } from "express"
import { imageQueue } from "../queue/imageQueue"
import { createJobRecord, getJobById } from "../services/createJobRecord"
import { startImageWorker } from "../jobs/imageWorkerManager"

export const handleGenerateImage = async (req: Request, res: Response) => {
  try {
    const {
      userId,
      prompt,
      model,
      style_type,
      aspect_ratio,
      magic_prompt_option,
      negative_prompt,
      seed,
      color_palette,
      is_published,
      job_id,
      retry,
    } = req.body

    console.log("req.body: ", req.body)

    if (!prompt || !userId) {
      return res.status(400).json({ error: "prompt and userId are required" })
    }

    // --- Parse JSON fields ---
    let parsed_color_palette = color_palette
    if (typeof color_palette === "string") {
      try {
        parsed_color_palette = JSON.parse(color_palette)
      } catch (e) {
        console.warn("Invalid color_palette JSON:", color_palette)
        parsed_color_palette = null
      }
    }

    let final_style_type = style_type
    if (model?.toLowerCase() === "v1") {
      final_style_type = undefined
    }

    // --- Retry-safe job logic ---
    let jobId = job_id

    if (retry && job_id) {
      const existingJob = await getJobById(job_id)
      if (!existingJob) {
        return res.status(404).json({ error: "Retry requested but job not found" })
      }
      jobId = job_id
    } else if (!job_id) {
      jobId = await createJobRecord({
        prompt,
        userId,
        model,
        style_type: final_style_type,
        aspect_ratio,
        magic_prompt_option,
        negative_prompt,
        seed: seed ? parseInt(seed) : 0,
        color_palette: parsed_color_palette,
        is_published: is_published === "true" || is_published === true,
      })
    }

    // ---  Queue job ---
    await imageQueue.add("image", {
      jobId,
      prompt,
      userId,
      model,
      isRemix: false,
      style_type: final_style_type,
      aspect_ratio,
      magic_prompt_option,
      negative_prompt,
      seed: seed ? parseInt(seed) : 0,
      color_palette: parsed_color_palette,
    })

    await startImageWorker()

    return res.status(200).json({
      message: retry ? "Retry queued successfully" : "Job added to queue",
      jobId,
    })
  } catch (err) {
    console.error("❌ Error generating image:", err)
    return res.status(500).json({ error: "Internal Server Error" })
  }
}
