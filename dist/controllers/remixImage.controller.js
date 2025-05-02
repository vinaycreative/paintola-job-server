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
exports.handleRemixImage = void 0;
const uploadToCloudinary_1 = require("../services/uploadToCloudinary");
const createJobRecord_1 = require("../services/createJobRecord");
const imageQueue_1 = require("../queue/imageQueue");
const imageWorkerManager_1 = require("../jobs/imageWorkerManager");
const handleRemixImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, prompt, model, style_type, aspect_ratio, magic_prompt_option, negative_prompt, seed, is_published, image_description, image_weight, style_builder, style_builder_value, image_input_url, job_id, retry, } = req.body;
        const imageFile = req.file;
        let color_palette = req.body.color_palette;
        if (typeof color_palette === "string") {
            try {
                color_palette = JSON.parse(color_palette);
            }
            catch (e) {
                console.warn("Invalid color_palette JSON:", color_palette);
                color_palette = null; // or throw error
            }
        }
        console.log("Body: ", req.body);
        if (!prompt || !userId) {
            return res.status(400).json({ error: "Missing prompt or userId fields" });
        }
        // Validate image input only if image_input_url is not provided
        if (!image_input_url && !imageFile) {
            return res.status(400).json({ error: "Missing imageFile or image_input_url fields" });
        }
        const image_url = image_input_url
            ? image_input_url
            : yield (0, uploadToCloudinary_1.uploadImageFromFile)(imageFile, userId);
        let jobId = job_id;
        if (retry && job_id) {
            // Check if job exists in DB
            const existingJob = yield (0, createJobRecord_1.getJobById)(job_id);
            if (!existingJob) {
                return res.status(404).json({ error: "Retry requested but job not found" });
            }
            // If job exists, reuse the jobId
            jobId = job_id;
        }
        else if (!job_id) {
            // No retry, no job_id provided → create a new job
            jobId = yield (0, createJobRecord_1.createJobRecord)({
                prompt,
                userId,
                isRemix: true,
                model,
                style_type,
                aspect_ratio,
                magic_prompt_option,
                negative_prompt,
                seed: seed ? parseInt(seed) : 0,
                color_palette,
                image_description,
                is_published: is_published === "true",
                image_input_url: image_url,
                image_weight: image_weight ? parseInt(image_weight) : 50,
                style_builder: style_builder,
                style_builder_value: style_builder_value,
            });
        }
        // 2. Push to queue (minimal payload)
        yield imageQueue_1.imageQueue.add("image", {
            jobId,
            prompt,
            userId,
            model,
            isRemix: true,
            style_type,
            aspect_ratio,
            magic_prompt_option,
            negative_prompt,
            seed: seed ? parseInt(seed) : 0,
            color_palette,
            image_weight: image_weight ? parseInt(image_weight) : 50,
            image_input_url: image_url,
        });
        // 3. Start Worker dynamically if not running
        yield (0, imageWorkerManager_1.startImageWorker)();
        return res.status(200).json({
            message: retry ? "Retry queued successfully" : "Remix job queued successfully",
            jobId,
        });
    }
    catch (err) {
        console.error("❌ Error handling remix image:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.handleRemixImage = handleRemixImage;
