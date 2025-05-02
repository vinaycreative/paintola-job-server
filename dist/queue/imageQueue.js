"use strict";
// import { Queue, QueueEvents } from "bullmq"
// import { redisConnection } from "../db/redis"
// import { prisma } from "../db/client"
// import { getIO } from "../ws/socket"
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initQueueEventListeners = exports.imageQueue = void 0;
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
const bullmq_1 = require("bullmq");
const redis_1 = require("../db/redis");
const client_1 = require("../db/client");
const socket_1 = require("../ws/socket");
exports.imageQueue = new bullmq_1.Queue("image-generation", {
    connection: redis_1.redisConnection,
    blockingConnection: false,
});
const initQueueEventListeners = () => {
    const events = new bullmq_1.QueueEvents("image-generation", {
        connection: redis_1.redisConnection,
        blockingTimeout: 30000,
    });
    // ✅ When job becomes active (picked up by Worker)
    events.on("active", (_a) => __awaiter(void 0, [_a], void 0, function* ({ jobId }) {
        var _b;
        console.log("⚙️ [QueueEvent:active] Job picked up:", jobId);
        try {
            const jobData = yield exports.imageQueue.getJob(jobId);
            if (!jobData) {
                console.log(`⚠️ [QueueEvent:active] No jobData found for ID: ${jobId}`);
                return;
            }
            const realJobId = jobData.data.jobId;
            const dbJob = yield client_1.prisma.job.findUnique({ where: { id: realJobId } });
            if (!dbJob || !dbJob.userId) {
                console.log(`⚠️ [QueueEvent:active] No DB record for real jobId: ${realJobId}`);
                return;
            }
            const io = (0, socket_1.getIO)();
            console.log(`📢 [QueueEvent:active] Emitting 'job:progress' to user:${dbJob.userId}`);
            io.to(`user:${dbJob.userId}`).emit("job:progress", {
                id: dbJob.id,
                status: "PROCESSING",
                progress: (_b = dbJob.progress) !== null && _b !== void 0 ? _b : 10,
            });
        }
        catch (err) {
            console.error("❌ [QueueEvent:active] Error:", err);
        }
    }));
    // ✅ When job completed
    events.on("completed", (_a) => __awaiter(void 0, [_a], void 0, function* ({ jobId }) {
        var _b;
        console.log("🧪 [QueueEvent:completed] Job completed:", jobId);
        try {
            const jobData = yield exports.imageQueue.getJob(jobId);
            if (!jobData) {
                console.log(`⚠️ [QueueEvent:completed] No jobData found for ID: ${jobId}`);
                return;
            }
            const realJobId = jobData.data.jobId;
            const dbJob = yield client_1.prisma.job.findUnique({ where: { id: realJobId } });
            const generateImage = yield client_1.prisma.generatedImage.findUnique({
                where: { jobId: realJobId },
            });
            if (!dbJob || !dbJob.userId) {
                console.log(`⚠️ [QueueEvent:completed] No DB record for real jobId: ${realJobId}`);
                return;
            }
            const io = (0, socket_1.getIO)();
            console.log(`📢 [QueueEvent:completed] Emitting 'job:completed' to user:${dbJob.userId}`);
            io.to(`user:${dbJob.userId}`).emit("job:completed", {
                id: dbJob.id,
                generateId: generateImage === null || generateImage === void 0 ? void 0 : generateImage.id,
                status: dbJob.status,
                progress: (_b = dbJob.progress) !== null && _b !== void 0 ? _b : 100,
                imageUrl: dbJob.imageUrl,
                error: dbJob.error,
            });
        }
        catch (err) {
            console.error("❌ [QueueEvent:completed] Error:", err);
        }
    }));
    // ✅ When job fails
    events.on("failed", (_a) => __awaiter(void 0, [_a], void 0, function* ({ jobId, failedReason }) {
        console.log("❌ [QueueEvent:failed] Job failed:", jobId, "| Reason:", failedReason);
        try {
            const jobData = yield exports.imageQueue.getJob(jobId);
            if (!jobData) {
                console.log(`⚠️ [QueueEvent:failed] No jobData found for ID: ${jobId}`);
                return;
            }
            const realJobId = jobData.data.jobId;
            const dbJob = yield client_1.prisma.job.findUnique({ where: { id: realJobId } });
            if (!dbJob || !dbJob.userId) {
                console.log(`⚠️ [QueueEvent:failed] No DB record for real jobId: ${realJobId}`);
                return;
            }
            const io = (0, socket_1.getIO)();
            console.log(`📢 [QueueEvent:failed] Emitting 'job:failed' to user:${dbJob.userId}`);
            io.to(`user:${dbJob.userId}`).emit("job:failed", {
                id: dbJob.id,
                status: "FAILED",
                error: dbJob.error || failedReason,
            });
        }
        catch (err) {
            console.error("❌ [QueueEvent:failed] Error:", err);
        }
    }));
};
exports.initQueueEventListeners = initQueueEventListeners;
