import { Queue, QueueEvents } from "bullmq"
import { redisConnection } from "../db/redis"
import { prisma } from "../db/client"
import { getIO } from "../ws/socket"

export const imageQueue = new Queue("image-generation", {
  connection: redisConnection,
})

export const initQueueEventListeners = () => {
  const events = new QueueEvents("image-generation", {
    connection: redisConnection,
  })

  // ✅ Emit when job starts processing
  events.on("active", async (job) => {
    console.log("⚙️ QueueEvents triggered: job:active", job)

    const jobData = await imageQueue.getJob(job.jobId)
    console.log("JobData: ", jobData.data)
    if (!jobData) return

    const data = jobData.data
    const dbJob = await prisma.job.findUnique({ where: { id: data.jobId } })
    if (!dbJob || !dbJob.userId) return

    const io = getIO()
    io.to(`user:${dbJob.userId}`).emit("job:progress", {
      jobId: dbJob.id,
      status: "PROCESSING",
      progress: 10,
    })
  })

  events.on("completed", async ({ jobId }) => {
    console.log("🧪 QueueEvents triggered: job:completed")

    // ⛳ FIX: We can't use jobId directly to fetch DB record
    const jobData = await imageQueue.getJob(jobId)

    if (!jobData) {
      console.log("⚠️ BullMQ Job not found for ID:", jobId)
      return
    }

    const data = jobData.data
    const job = await prisma.job.findUnique({ where: { id: data.jobId } })

    if (!job || !job.userId) {
      console.log("⚠️ No job or missing userId in DB for jobId:", data.jobId)
      return
    }

    const room = `user:${job.userId}`

    console.log("📤 Emitting job:completed to:", room, {
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      imageUrl: job.imageUrl,
    })

    try {
      const io = getIO()
      io.to(room).emit("job:completed", {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        imageUrl: job.imageUrl,
        error: job.error,
      })
    } catch (err) {
      console.log("❌ Emit failed:", err)
    }
  })

  // ✅ When job fails
  events.on("failed", async ({ jobId, failedReason }) => {
    console.log("❌ job:failed triggered", jobId, failedReason)

    const jobData = await imageQueue.getJob(jobId)
    if (!jobData) return

    const data = jobData.data
    const dbJob = await prisma.job.findUnique({ where: { id: data.jobId } })
    if (!dbJob || !dbJob.userId) return

    const io = getIO()
    io.to(`user:${dbJob.userId}`).emit("job:failed", {
      jobId: dbJob.id,
      status: "FAILED",
      error: dbJob.error || failedReason,
    })
  })

  // ⚠️ BONUS: Emit "processing" from inside worker for now
}
