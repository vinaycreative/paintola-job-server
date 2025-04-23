// src/jobs/imageGenerationWorker.ts
import { Worker, Job } from "bullmq"
import { redisConnection } from "../db/redis"
import { prisma } from "../db/client"
import { generateImageFromPrompt } from "../services/ideogram.service"
import { getApiErrorMessage } from "../utils/formatAxiosError"
import { uploadImageFromUrl } from "../services/uploadToCloudinary"

// const worker = new Worker(
//   "image-generation",
//   async (job: Job) => {
//     const {
//       jobId,
//       prompt,
//       userId,
//       model,
//       style_type,
//       aspect_ratio,
//       magic_prompt_option,
//       negative_prompt,
//     } = job.data

//     try {
//       console.log("👷 Processing job:", jobId)

//       await prisma.job.update({
//         where: { id: jobId },
//         data: {
//           status: "PROCESSING",
//           progress: 10,
//         },
//       })

//       const imageUrl = await generateImageFromPrompt({
//         prompt,
//         // model,
//         // style_type,
//         // aspect_ratio,
//         // magic_prompt_option,
//         // negative_prompt,
//       })

//       // Upload to Cloudinary
//       const cdnUrl = await uploadImageFromUrl(imageUrl)

//       await prisma.job.update({
//         where: { id: jobId },
//         data: {
//           status: "COMPLETED",
//           progress: 100,
//           imageUrl: cdnUrl,
//         },
//       })
//       console.log(`✅ Job ${jobId} completed. Image: ${imageUrl}`)

//       return { imageUrl }
//     } catch (error: any) {
//       await prisma.job.update({
//         where: { id: jobId },
//         data: {
//           status: "FAILED",
//           progress: 0,
//           error: getApiErrorMessage(error),
//         },
//       })

//       return { error: error.message }
//     }
//   },
//   {
//     connection: redisConnection,
//     removeOnComplete: { age: 60, count: 2 },
//     removeOnFail: { age: 120, count: 2 },
//   }
// )

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

      // 1️⃣ Update job to PROCESSING
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "PROCESSING",
          progress: 10,
        },
      })

      // 2️⃣ Generate image
      const imageUrl = await generateImageFromPrompt({
        prompt,
        model,
        style_type,
        aspect_ratio,
        magic_prompt_option,
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
    removeOnComplete: { age: 60, count: 2 },
    removeOnFail: { age: 120, count: 2 },
  }
)
