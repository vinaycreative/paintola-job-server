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
exports.getJobById = exports.createJobRecord = void 0;
const client_1 = require("../db/client");
const createJobRecord = (input) => __awaiter(void 0, void 0, void 0, function* () {
    const { prompt, userId, model, style_type, aspect_ratio, image_description, magic_prompt_option, negative_prompt, seed, color_palette, is_published, image_input_url, image_weight, style_builder, style_builder_value, isRemix = false, } = input;
    const job = yield client_1.prisma.job.create({
        data: {
            userId,
            prompt,
            status: "PROCESSING",
            progress: 0,
            model: model || "",
            style_type: style_type || undefined,
            aspect_ratio: aspectRatioToEnum(aspect_ratio),
            image_description: image_description || "",
            magic_prompt_option: magic_prompt_option || undefined,
            negative_prompt: negative_prompt || undefined,
            seed: seed ? seed : 0,
            image_input_url,
            color_palette,
            image_weight,
            style_builder,
            style_builder_value,
            metadata: {
                remix: isRemix,
                image_input_url,
                image_weight,
                seed,
                color_palette,
                is_published: !!is_published,
            },
        },
    });
    return job.id;
});
exports.createJobRecord = createJobRecord;
const aspectRatioToEnum = (value) => {
    if (!value)
        return undefined;
    return value;
};
const getJobById = (jobId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield client_1.prisma.job.findUnique({ where: { id: jobId } });
});
exports.getJobById = getJobById;
