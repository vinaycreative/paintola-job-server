// import { Queue, QueueEvents } from "bullmq"
// import { redisConnection } from "../db/redis"
// import { prisma } from "../db/client"
// import { getIO } from "../ws/socket"

// export const imageQueue = new Queue("image-generation", {
//   connection: redisConnection,
// })

// export const initQueueEventListeners = () => {
//   const events = new QueueEvents("image-generation", {
//     connection: redisConnection,
//   })

//   // ✅ Emit when job starts processing
//   events.on("active", async (job) => {
//     console.log("⚙️ QueueEvents triggered: job:active", job)

//     const jobData = await imageQueue.getJob(job.jobId)
//     console.log("JobData: ", jobData.data)
//     if (!jobData) return

//     const data = jobData.data
//     const dbJob = await prisma.job.findUnique({ where: { id: data.jobId } })
//     if (!dbJob || !dbJob.userId) return

//     const io = getIO()
//     io.to(`user:${dbJob.userId}`).emit("job:progress", {
//       jobId: dbJob.id,
//       status: "PROCESSING",
//       progress: 10,
//     })
//   })

//   events.on("completed", async ({ jobId }) => {
//     console.log("🧪 QueueEvents triggered: job:completed")

//     // ⛳ FIX: We can't use jobId directly to fetch DB record
//     const jobData = await imageQueue.getJob(jobId)

//     if (!jobData) {
//       console.log("⚠️ BullMQ Job not found for ID:", jobId)
//       return
//     }

//     const data = jobData.data
//     const job = await prisma.job.findUnique({ where: { id: data.jobId } })

//     if (!job || !job.userId) {
//       console.log("⚠️ No job or missing userId in DB for jobId:", data.jobId)
//       return
//     }

//     const room = `user:${job.userId}`

//     console.log("📤 Emitting job:completed to:", room, {
//       jobId: job.id,
//       status: job.status,
//       progress: job.progress,
//       imageUrl: job.imageUrl,
//     })

//     try {
//       const io = getIO()
//       io.to(room).emit("job:completed", {
//         jobId: job.id,
//         status: job.status,
//         progress: job.progress,
//         imageUrl: job.imageUrl,
//         error: job.error,
//       })
//     } catch (err) {
//       console.log("❌ Emit failed:", err)
//     }
//   })

//   // ✅ When job fails
//   events.on("failed", async ({ jobId, failedReason }) => {
//     console.log("❌ job:failed triggered", jobId, failedReason)

//     const jobData = await imageQueue.getJob(jobId)
//     if (!jobData) return

//     const data = jobData.data
//     const dbJob = await prisma.job.findUnique({ where: { id: data.jobId } })
//     if (!dbJob || !dbJob.userId) return

//     const io = getIO()
//     io.to(`user:${dbJob.userId}`).emit("job:failed", {
//       jobId: dbJob.id,
//       status: "FAILED",
//       error: dbJob.error || failedReason,
//     })
//   })

//   // ⚠️ BONUS: Emit "processing" from inside worker for now
// }

import { Queue, QueueEvents } from "bullmq"
import { redisConnection } from "../db/redis"
import { prisma } from "../db/client"
import { getIO } from "../ws/socket"

export const imageQueue = new Queue("image-generation", {
  connection: redisConnection,
  blockingConnection: false,
})

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
        jobId: dbJob.id,
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
        jobId: dbJob.id,
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
        jobId: dbJob.id,
        status: "FAILED",
        error: dbJob.error || failedReason,
      })
    } catch (err) {
      console.error("❌ [QueueEvent:failed] Error:", err)
    }
  })
}
