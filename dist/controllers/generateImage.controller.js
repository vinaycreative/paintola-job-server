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
exports.handleGenerateImage = void 0;
const imageQueue_1 = require("../queue/imageQueue");
const createJobRecord_1 = require("../services/createJobRecord");
const imageWorkerManager_1 = require("../jobs/imageWorkerManager");
const handleGenerateImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, prompt, model, style_type, aspect_ratio, magic_prompt_option, negative_prompt, seed, color_palette, is_published, job_id, retry, } = req.body;
        console.log("req.body: ", req.body);
        if (!prompt || !userId) {
            return res.status(400).json({ error: "prompt and userId are required" });
        }
        // --- Parse JSON fields ---
        let parsed_color_palette = color_palette;
        if (typeof color_palette === "string") {
            try {
                parsed_color_palette = JSON.parse(color_palette);
            }
            catch (e) {
                console.warn("Invalid color_palette JSON:", color_palette);
                parsed_color_palette = null;
            }
        }
        // --- Retry-safe job logic ---
        let jobId = job_id;
        if (retry && job_id) {
            const existingJob = yield (0, createJobRecord_1.getJobById)(job_id);
            if (!existingJob) {
                return res.status(404).json({ error: "Retry requested but job not found" });
            }
            jobId = job_id;
        }
        else if (!job_id) {
            jobId = yield (0, createJobRecord_1.createJobRecord)({
                prompt,
                userId,
                model,
                style_type,
                aspect_ratio,
                magic_prompt_option,
                negative_prompt,
                seed: seed ? parseInt(seed) : 0,
                color_palette: parsed_color_palette,
                is_published: is_published === "true" || is_published === true,
            });
        }
        // ---  Queue job ---
        yield imageQueue_1.imageQueue.add("image", {
            jobId,
            prompt,
            userId,
            model,
            isRemix: false,
            style_type,
            aspect_ratio,
            magic_prompt_option,
            negative_prompt,
            seed: seed ? parseInt(seed) : 0,
            color_palette: parsed_color_palette,
        });
        yield (0, imageWorkerManager_1.startImageWorker)();
        return res.status(200).json({
            message: retry ? "Retry queued successfully" : "Job added to queue",
            jobId,
        });
    }
    catch (err) {
        console.error("❌ Error generating image:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.handleGenerateImage = handleGenerateImage;
