import { Worker, Job } from "bullmq"
import { redisConnection } from "../db/redis"
import { prisma } from "../db/client"
import { generateImageFromPrompt } from "../services/ideogram.service"
import { uploadImageFromUrl } from "../services/uploadToCloudinary"
import { generateRemixFromPrompt } from "../services/ideogramRemix.service"
import { getApiErrorMessage } from "../utils/formatAxiosError"
import { imageQueue } from "../queue/imageQueue" // Important to import

let imageWorker: Worker | null = null

export async function startImageWorker() {
  if (imageWorker) {
    console.log("⚙️ [WorkerManager] Worker already running. Skip starting again.")
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

        const job = await prisma.job.findUnique({ where: { id: jobId } })

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

        // 🛠 Create GeneratedImage record
        await prisma.generatedImage.create({
          data: {
            userId: userId,
            jobId: jobId,
            prompt: prompt,
            negative_prompt: negative_prompt ?? undefined,
            seed: seed ?? 0,
            img_result: cdnUrl,
            model: model ?? undefined,
            image_description: job?.image_description ? job?.image_description : "",
            color_palette: color_palette ? JSON.parse(JSON.stringify(color_palette)) : undefined,
            aspect_ratio: aspect_ratio,
            style_type: style_type ?? undefined,
            image_input_url: image_input_url ?? undefined,
            image_weight: image_weight ?? undefined,
            is_published: false,
            createdAt: new Date(),
            updatedAt: new Date(),
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

  process.on("SIGTERM", async () => {
    if (imageWorker) {
      console.log("🔻 [WorkerManager] Shutting down Worker due to SIGTERM...")
      await imageWorker.close()
      imageWorker = null
    }
  })

  // Correct logic: only stop worker when queue is EMPTY
  imageWorker.on("completed", async (job) => {
    console.log(`🛑 [WorkerManager] Worker completed job: ${job.id}`)
    await handleWorkerShutdown()
  })

  imageWorker.on("failed", async (job) => {
    console.log(`🛑 [WorkerManager] Worker failed job: ${job?.id}`)
    await handleWorkerShutdown()
  })
}

async function handleWorkerShutdown() {
  const counts = await imageQueue.getJobCounts()

  console.log("📊 [WorkerManager] Queue status after job:", counts)

  if (counts.waiting === 0 && counts.active === 0) {
    console.log("🛑 [WorkerManager] No jobs left. Stopping Worker...")
    await stopImageWorker()
  } else {
    console.log("⏳ [WorkerManager] Jobs still pending. Worker continues running...")
  }
}

export async function stopImageWorker() {
  if (imageWorker) {
    console.log("🛑 [WorkerManager] Stopping Worker cleanly...")
    await imageWorker.close()
    imageWorker = null
  }
}
