import { Queue, QueueEvents } from "bullmq"
import { redisConnection } from "../db/redis"
import { prisma } from "../db/client"
import { getIO } from "../ws/socket"

export const imageQueue = new Queue("image-generation", {
  connection: redisConnection,
  blockingConnection: false,
})
console.log("🚀 QueueEventListeners initialized and listening...")

export const initQueueEventListeners = () => {
  const events = new QueueEvents("image-generation", {
    connection: redisConnection,
    blockingTimeout: 30000,
  })

  // ✅ When job becomes active (picked up by Worker)
  events.on("active", async ({ jobId }) => {
    console.log("⚙️ [QueueEvent:active] Job picked up:", jobId)

    try {
      const jobData = await imageQueue.getJob(jobId)
      if (!jobData) {
        console.log(`⚠️ [QueueEvent:active] No jobData found for ID: ${jobId}`)
        return
      }

      const realJobId = jobData.data.jobId

      const dbJob = await prisma.job.findUnique({ where: { id: realJobId } })

      if (!dbJob || !dbJob.userId) {
        console.log(`⚠️ [QueueEvent:active] No DB record for real jobId: ${realJobId}`)
        return
      }

      const io = getIO()
      console.log(`📢 [QueueEvent:active] Emitting 'job:progress' to user:${dbJob.userId}`)
      io.to(`user:${dbJob.userId}`).emit("job:progress", {
        id: dbJob.id,
        status: "PROCESSING",
        progress: dbJob.progress ?? 10,
      })
    } catch (err) {
      console.error("❌ [QueueEvent:active] Error:", err)
    }
  })

  // ✅ When job completed
  events.on("completed", async ({ jobId }) => {
    console.log("🧪 [QueueEvent:completed] Job completed:", jobId)

    try {
      const jobData = await imageQueue.getJob(jobId)
      if (!jobData) {
        console.log(`⚠️ [QueueEvent:completed] No jobData found for ID: ${jobId}`)
        return
      }

      const realJobId = jobData.data.jobId

      const dbJob = await prisma.job.findUnique({ where: { id: realJobId } })
      const generateImage = await prisma.generatedImage.findUnique({
        where: { jobId: realJobId },
      })

      if (!dbJob || !dbJob.userId) {
        console.log(`⚠️ [QueueEvent:completed] No DB record for real jobId: ${realJobId}`)
        return
      }

      const io = getIO()
      console.log(`📢 [QueueEvent:completed] Emitting 'job:completed' to user:${dbJob.userId}`)
      io.to(`user:${dbJob.userId}`).emit("job:completed", {
        id: dbJob.id,
        generateId: generateImage?.id,
        status: dbJob.status,
        progress: dbJob.progress ?? 100,
        imageUrl: dbJob.imageUrl,
        error: dbJob.error,
      })
    } catch (err) {
      console.error("❌ [QueueEvent:completed] Error:", err)
    }
  })

  // ✅ When job fails
  events.on("failed", async ({ jobId, failedReason }) => {
    console.log("❌ [QueueEvent:failed] Job failed:", jobId, "| Reason:", failedReason)

    try {
      const jobData = await imageQueue.getJob(jobId)
      if (!jobData) {
        console.log(`⚠️ [QueueEvent:failed] No jobData found for ID: ${jobId}`)
        return
      }

      const realJobId = jobData.data.jobId

      const dbJob = await prisma.job.findUnique({ where: { id: realJobId } })

      if (!dbJob || !dbJob.userId) {
        console.log(`⚠️ [QueueEvent:failed] No DB record for real jobId: ${realJobId}`)
        return
      }

      const io = getIO()
      console.log(`📢 [QueueEvent:failed] Emitting 'job:failed' to user:${dbJob.userId}`)
      io.to(`user:${dbJob.userId}`).emit("job:failed", {
        id: dbJob.id,
        status: "FAILED",
        error: dbJob.error || failedReason,
      })
    } catch (err) {
      console.error("❌ [QueueEvent:failed] Error:", err)
    }
  })
}
