import { Request, Response } from "express"
import { uploadImageFromFile } from "../services/uploadToCloudinary"
import { createJobRecord, getJobById } from "../services/createJobRecord"
import { imageQueue } from "../queue/imageQueue"
import { startImageWorker } from "../jobs/imageWorkerManager"

export const handleRemixImage = async (req: Request, res: Response) => {
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
      is_published,
      image_description,
      image_weight,
      style_builder,
      style_builder_value,
      image_input_url,
      job_id,
      retry,
    } = req.body

    const imageFile = req.file
    let color_palette = req.body.color_palette
    if (typeof color_palette === "string") {
      try {
        color_palette = JSON.parse(color_palette)
      } catch (e) {
        console.warn("Invalid color_palette JSON:", color_palette)
        color_palette = null // or throw error
      }
    }

    console.log("Body: ", req.body)

    if (!prompt || !userId) {
      return res.status(400).json({ error: "Missing prompt or userId fields" })
    }

    // Validate image input only if image_input_url is not provided
    if (!image_input_url && !imageFile) {
      return res.status(400).json({ error: "Missing imageFile or image_input_url fields" })
    }

    let image_url = image_input_url
      ? image_input_url
      : imageFile
      ? await uploadImageFromFile(imageFile!, userId)
      : undefined

    let jobId = job_id
    let final_style_type = style_type
    if (model?.toLowerCase() === "v1") {
      final_style_type = undefined
    }

    if (retry && job_id) {
      const existingJob = await getJobById(job_id)
      if (!existingJob) {
        return res.status(404).json({ error: "Retry requested but job not found" })
      }

      jobId = job_id

      // ✅ Fallback if no new image provided
      if (!image_url) {
        if (!existingJob.image_input_url) {
          return res
            .status(400)
            .json({ error: "Original job does not have a valid reference image." })
        }
        image_url = existingJob.image_input_url
      }
    } else if (!job_id) {
      // No retry → create a new job
      if (!image_url) {
        return res.status(400).json({ error: "Missing imageFile or image_input_url fields" })
      }
      jobId = await createJobRecord({
        prompt,
        userId,
        isRemix: true,
        model,
        style_type: final_style_type,
        aspect_ratio,
        magic_prompt_option,
        negative_prompt,
        seed: seed ? parseInt(seed) : 0,
        color_palette,
        image_description,
        is_published: is_published === "true",
        image_input_url: image_url,
        image_weight: image_weight ? parseInt(image_weight) : 50,
        style_builder: style_builder,
        style_builder_value: style_builder_value,
      })
    }

    // 2. Push to queue (minimal payload)
    await imageQueue.add("image", {
      jobId,
      prompt,
      userId,
      model,
      isRemix: true,
      style_type: final_style_type,
      aspect_ratio,
      magic_prompt_option,
      negative_prompt,
      seed: seed ? parseInt(seed) : 0,
      color_palette,
      image_weight: image_weight ? parseInt(image_weight) : 50,
      image_input_url: image_url,
    })

    // 3. Start Worker dynamically if not running
    await startImageWorker()

    return res.status(200).json({
      message: retry ? "Retry queued successfully" : "Remix job queued successfully",
      jobId,
    })
  } catch (err) {
    console.error("❌ Error handling remix image:", err)
    return res.status(500).json({ error: "Internal Server Error" })
  }
}
