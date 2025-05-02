"use strict";
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
exports.startImageWorker = startImageWorker;
exports.stopImageWorker = stopImageWorker;
const bullmq_1 = require("bullmq");
const redis_1 = require("../db/redis");
const client_1 = require("../db/client");
const ideogram_service_1 = require("../services/ideogram.service");
const uploadToCloudinary_1 = require("../services/uploadToCloudinary");
const ideogramRemix_service_1 = require("../services/ideogramRemix.service");
const formatAxiosError_1 = require("../utils/formatAxiosError");
const imageQueue_1 = require("../queue/imageQueue"); // Important to import
let imageWorker = null;
function startImageWorker() {
    return __awaiter(this, void 0, void 0, function* () {
        if (imageWorker) {
            console.log("⚙️ [WorkerManager] Worker already running. Skip starting again.");
            return;
        }
        console.log("🛠️ [WorkerManager] Starting new Worker...");
        imageWorker = new bullmq_1.Worker("image-generation", (job) => __awaiter(this, void 0, void 0, function* () {
            const { jobId, prompt, userId, model, isRemix, style_type, aspect_ratio, magic_prompt_option, negative_prompt, seed, color_palette, image_weight, image_input_url, } = job.data;
            try {
                console.log("👷 [Worker] Processing Job:", jobId);
                yield client_1.prisma.job.update({
                    where: { id: jobId },
                    data: { status: "PROCESSING", progress: 10 },
                });
                const data = isRemix
                    ? yield (0, ideogramRemix_service_1.generateRemixFromPrompt)({
                        prompt,
                        model,
                        style_type,
                        aspect_ratio,
                        magic_prompt_option,
                        image_input_url,
                        seed,
                        color_palette,
                        image_weight,
                    })
                    : yield (0, ideogram_service_1.generateImageFromPrompt)({
                        prompt,
                        model,
                        style_type,
                        aspect_ratio,
                        seed,
                        magic_prompt_option,
                        color_palette,
                        negative_prompt,
                    });
                const cdnUrl = yield (0, uploadToCloudinary_1.uploadImageFromUrl)(data.url, userId);
                const job = yield client_1.prisma.job.findUnique({ where: { id: jobId } });
                yield client_1.prisma.job.update({
                    where: { id: jobId },
                    data: {
                        status: "COMPLETED",
                        progress: 100,
                        imageUrl: cdnUrl,
                        metadata: {
                            original_url: data.url,
                            model,
                            style_type,
                            aspect_ratio,
                            magic_prompt_option,
                            negative_prompt,
                        },
                    },
                });
                // 🛠 Create GeneratedImage record
                yield client_1.prisma.generatedImage.create({
                    data: {
                        userId: userId,
                        jobId: jobId,
                        prompt: prompt,
                        model: model !== null && model !== void 0 ? model : undefined,
                        style_type: style_type !== null && style_type !== void 0 ? style_type : undefined,
                        aspect_ratio: aspect_ratio,
                        color_palette: color_palette ? JSON.parse(JSON.stringify(color_palette)) : undefined,
                        negative_prompt: negative_prompt !== null && negative_prompt !== void 0 ? negative_prompt : undefined,
                        image_weight: image_weight !== null && image_weight !== void 0 ? image_weight : undefined,
                        image_description: (job === null || job === void 0 ? void 0 : job.image_description) ? job === null || job === void 0 ? void 0 : job.image_description : "",
                        image_input_url: image_input_url !== null && image_input_url !== void 0 ? image_input_url : undefined,
                        seed: data.seed,
                        prompt_enhanced: job === null || job === void 0 ? void 0 : job.prompt,
                        img_result: cdnUrl,
                        style_builder: job === null || job === void 0 ? void 0 : job.style_builder,
                        style_builder_value: job === null || job === void 0 ? void 0 : job.style_builder_value,
                        is_published: false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    },
                });
                console.log(`✅ [Worker] Job ${jobId} completed.`);
                return { imageUrl: cdnUrl };
            }
            catch (error) {
                const friendlyMessage = (0, formatAxiosError_1.getApiErrorMessage)(error);
                yield client_1.prisma.job.update({
                    where: { id: jobId },
                    data: { status: "FAILED", progress: 0, error: friendlyMessage },
                });
                console.error(`❌ [Worker] Job ${jobId} failed:`, friendlyMessage);
                return { error: friendlyMessage };
            }
        }), {
            connection: redis_1.redisConnection,
            removeOnComplete: { age: 60, count: 2 },
            removeOnFail: { age: 120, count: 2 },
            stalledInterval: 86400000,
        });
        process.on("SIGTERM", () => __awaiter(this, void 0, void 0, function* () {
            if (imageWorker) {
                console.log("🔻 [WorkerManager] Shutting down Worker due to SIGTERM...");
                yield imageWorker.close();
                imageWorker = null;
            }
        }));
        // Correct logic: only stop worker when queue is EMPTY
        imageWorker.on("completed", (job) => __awaiter(this, void 0, void 0, function* () {
            console.log(`🛑 [WorkerManager] Worker completed job: ${job.id}`);
            yield handleWorkerShutdown();
        }));
        imageWorker.on("failed", (job) => __awaiter(this, void 0, void 0, function* () {
            console.log(`🛑 [WorkerManager] Worker failed job: ${job === null || job === void 0 ? void 0 : job.id}`);
            yield handleWorkerShutdown();
        }));
    });
}
function handleWorkerShutdown() {
    return __awaiter(this, void 0, void 0, function* () {
        const counts = yield imageQueue_1.imageQueue.getJobCounts();
        console.log("📊 [WorkerManager] Queue status after job:", counts);
        if (counts.waiting === 0 && counts.active === 0) {
            console.log("🛑 [WorkerManager] No jobs left. Stopping Worker...");
            yield stopImageWorker();
        }
        else {
            console.log("⏳ [WorkerManager] Jobs still pending. Worker continues running...");
        }
    });
}
function stopImageWorker() {
    return __awaiter(this, void 0, void 0, function* () {
        if (imageWorker) {
            console.log("🛑 [WorkerManager] Stopping Worker cleanly...");
            yield imageWorker.close();
            imageWorker = null;
        }
    });
}
