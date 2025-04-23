// src/jobs/imageGenerationWorker.ts
import { Worker, Job } from "bullmq"
import { redisConnection } from "../db/redis"
import { prisma } from "../db/client"
import { generateImageFromPrompt } from "../services/ideogram.service"
import { getApiErrorMessage } from "../utils/formatAxiosError"
import { uploadImageFromUrl } from "../services/uploadToCloudinary"
import { generateRemixFromPrompt } from "../services/ideogramRemix.service"

const worker = new Worker(
  "image-generation",
  async (job: Job) => {
    const {
      jobId,
      prompt,
      userId,
      model,
      isRemix,
      style_type,
      aspect_ratio,
      magic_prompt_option,
      negative_prompt,
      seed,
      color_palette,
      image_weight,
      image_input_url,
    } = job.data

    try {
      console.log("job: ", job.data)
      console.log("👷 Processing job:", jobId)

      // 1️⃣ Update job to PROCESSING
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "PROCESSING",
          progress: 10,
        },
      })

      let imageUrl = isRemix
        ? await generateRemixFromPrompt({
            prompt,
            model,
            style_type,
            aspect_ratio,
            magic_prompt_option,
            image_input_url,
            color_palette,
            image_weight,
          })
        : await generateImageFromPrompt({
            prompt,
            model,
            style_type,
            aspect_ratio,
            magic_prompt_option,
            color_palette,
            negative_prompt,
          })

      // 3️⃣ Upload to Cloudinary
      const cdnUrl = await uploadImageFromUrl(imageUrl)

      // 4️⃣ Update DB with result
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          progress: 100,
          imageUrl: cdnUrl,
          metadata: {
            original_url: imageUrl,
            model,
            style_type,
            aspect_ratio,
            magic_prompt_option,
            negative_prompt,
          },
        },
      })

      console.log(`✅ Job ${jobId} completed and uploaded.`)
      return { imageUrl: cdnUrl }
    } catch (error: any) {
      const friendlyMessage = getApiErrorMessage(error)

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          progress: 0,
          error: friendlyMessage,
        },
      })

      console.error(`❌ Job ${jobId} failed:`, friendlyMessage)
      return { error: friendlyMessage }
    }
  },
  {
    connection: redisConnection,
    removeOnComplete: { age: 60, count: 1 },
    removeOnFail: { age: 120, count: 1 },
  }
)
