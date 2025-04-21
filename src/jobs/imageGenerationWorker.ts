// src/jobs/imageGenerationWorker.ts
import { Worker, Job } from "bullmq"
import { redisConnection } from "../db/redis"
import { prisma } from "../db/client"
import { generateImageFromPrompt } from "../services/ideogram.service"
import { getApiErrorMessage } from "../utils/formatAxiosError"

const worker = new Worker(
  "image-generation",
  async (job: Job) => {
    const {
      jobId,
      prompt,
      userId,
      model,
      style_type,
      aspect_ratio,
      magic_prompt_option,
      negative_prompt,
    } = job.data

    try {
      console.log("👷 Processing job:", jobId)

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "PROCESSING",
          progress: 10,
        },
      })

      const imageUrl = await generateImageFromPrompt({
        prompt,
        // model,
        // style_type,
        // aspect_ratio,
        // magic_prompt_option,
        // negative_prompt,
      })

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          progress: 100,
          imageUrl,
        },
      })
      console.log(`✅ Job ${jobId} completed. Image: ${imageUrl}`)

      return { imageUrl }
    } catch (error: any) {
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          progress: 0,
          error: getApiErrorMessage(error),
        },
      })

      return { error: error.message }
    }
  },
  {
    connection: redisConnection,
    removeOnComplete: { age: 60, count: 2 },
    removeOnFail: { age: 120, count: 2 },
  }
)
