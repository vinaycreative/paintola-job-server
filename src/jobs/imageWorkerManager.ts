// // src/jobs/imageWorkerManager.ts
// import { Worker, Job } from "bullmq"
// import { redisConnection } from "../db/redis"
// import { prisma } from "../db/client"
// import { generateImageFromPrompt } from "../services/ideogram.service"
// import { uploadImageFromUrl } from "../services/uploadToCloudinary"
// import { generateRemixFromPrompt } from "../services/ideogramRemix.service"
// import { getApiErrorMessage } from "../utils/formatAxiosError"

// let imageWorker: Worker | null = null

// export async function startImageWorker() {
//   if (imageWorker) {
//     console.log("⚙️ Worker already running. Skip starting again.")
//     return
//   }

//   console.log("🛠️ Starting image-generation worker...")

//   imageWorker = new Worker(
//     "image-generation",
//     async (job: Job) => {
//       const {
//         jobId,
//         prompt,
//         userId,
//         model,
//         isRemix,
//         style_type,
//         aspect_ratio,
//         magic_prompt_option,
//         negative_prompt,
//         seed,
//         color_palette,
//         image_weight,
//         image_input_url,
//       } = job.data

//       try {
//         console.log("👷 Processing job:", jobId)

//         await prisma.job.update({
//           where: { id: jobId },
//           data: { status: "PROCESSING", progress: 10 },
//         })

//         const imageUrl = isRemix
//           ? await generateRemixFromPrompt({
//               prompt,
//               model,
//               style_type,
//               aspect_ratio,
//               magic_prompt_option,
//               image_input_url,
//               color_palette,
//               image_weight,
//             })
//           : await generateImageFromPrompt({
//               prompt,
//               model,
//               style_type,
//               aspect_ratio,
//               magic_prompt_option,
//               color_palette,
//               negative_prompt,
//             })

//         const cdnUrl = await uploadImageFromUrl(imageUrl, userId)

//         await prisma.job.update({
//           where: { id: jobId },
//           data: {
//             status: "COMPLETED",
//             progress: 100,
//             imageUrl: cdnUrl,
//             metadata: {
//               original_url: imageUrl,
//               model,
//               style_type,
//               aspect_ratio,
//               magic_prompt_option,
//               negative_prompt,
//             },
//           },
//         })

//         console.log(`✅ Job ${jobId} completed.`)
//         return { imageUrl: cdnUrl }
//       } catch (error: any) {
//         const friendlyMessage = getApiErrorMessage(error)

//         await prisma.job.update({
//           where: { id: jobId },
//           data: { status: "FAILED", progress: 0, error: friendlyMessage },
//         })

//         console.error(`❌ Job ${jobId} failed:`, friendlyMessage)
//         return { error: friendlyMessage }
//       }
//     },
//     {
//       connection: redisConnection,
//       removeOnComplete: { age: 60, count: 2 },
//       removeOnFail: { age: 120, count: 2 },
//       stalledInterval: 86400000,
//     }
//   )

//   // Graceful shutdown
//   process.on("SIGTERM", async () => {
//     if (imageWorker) {
//       console.log("🔻 Gracefully shutting down worker...")
//       await imageWorker.close()
//       imageWorker = null
//     }
//   })

//   // Auto shutdown after worker finishes ALL active jobs
//   imageWorker.on("completed", async () => {
//     await stopImageWorker()
//   })

//   imageWorker.on("failed", async () => {
//     await stopImageWorker()
//   })
// }

// export async function stopImageWorker() {
//   if (imageWorker) {
//     console.log("🛑 Stopping image-generation worker (no more jobs).")
//     await imageWorker.close()
//     imageWorker = null
//   }
// }

import { Worker, Job } from "bullmq"
import { redisConnection } from "../db/redis"
import { prisma } from "../db/client"
import { generateImageFromPrompt } from "../services/ideogram.service"
import { uploadImageFromUrl } from "../services/uploadToCloudinary"
import { generateRemixFromPrompt } from "../services/ideogramRemix.service"
import { getApiErrorMessage } from "../utils/formatAxiosError"

let imageWorker: Worker | null = null

export async function startImageWorker() {
  if (imageWorker) {
    console.log("⚙️ [WorkerManager] Worker already running. Skipping start.")
    return
  }

  console.log("🛠️ [WorkerManager] Starting new Worker...")

  imageWorker = new Worker(
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
        console.log("👷 [Worker] Processing Job:", jobId)

        await prisma.job.update({
          where: { id: jobId },
          data: { status: "PROCESSING", progress: 10 },
        })

        const imageUrl = isRemix
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

        const cdnUrl = await uploadImageFromUrl(imageUrl, userId)

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

        console.log(`✅ [Worker] Job ${jobId} completed.`)
        return { imageUrl: cdnUrl }
      } catch (error: any) {
        const friendlyMessage = getApiErrorMessage(error)

        await prisma.job.update({
          where: { id: jobId },
          data: { status: "FAILED", progress: 0, error: friendlyMessage },
        })

        console.error(`❌ [Worker] Job ${jobId} failed:`, friendlyMessage)
        return { error: friendlyMessage }
      }
    },
    {
      connection: redisConnection,
      removeOnComplete: { age: 60, count: 2 },
      removeOnFail: { age: 120, count: 2 },
      stalledInterval: 86400000,
    }
  )

  // Handle graceful shutdown
  process.on("SIGTERM", async () => {
    if (imageWorker) {
      console.log("🔻 [WorkerManager] Shutting down Worker due to SIGTERM...")
      await imageWorker.close()
      imageWorker = null
    }
  })

  // // Auto shutdown Worker after jobs complete/fail
  // imageWorker.on("completed", async (job) => {
  //   console.log(`🛑 [WorkerManager] Worker completed a job: ${job.id}`)
  //   await stopImageWorker()
  // })

  // imageWorker.on("failed", async (job) => {
  //   console.log(`🛑 [WorkerManager] Worker failed a job: ${job?.id}`)
  //   await stopImageWorker()
  // })
}

export async function stopImageWorker() {
  if (imageWorker) {
    console.log("🛑 [WorkerManager] Stopping Worker cleanly...")
    await imageWorker.close()
    imageWorker = null
  }
}
