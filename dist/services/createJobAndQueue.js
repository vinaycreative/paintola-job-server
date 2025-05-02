"use strict";
// import { prisma } from "../db/client"
// import { imageQueue } from "../queue/imageQueue"
// import { JobStatus } from "@prisma/client"
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
exports.createJobAndQueue = void 0;
// interface CreateJobProps {
//   prompt: string
//   userId: string
//   model?: string
//   style_type?: string
//   aspect_ratio?: string
//   magic_prompt_option?: string
//   negative_prompt?: string
// }
// export const createJobAndQueue = async ({
//   prompt,
//   userId,
//   model,
//   style_type,
//   aspect_ratio,
//   magic_prompt_option,
//   negative_prompt,
// }: CreateJobProps): Promise<string> => {
//   // 1. Save job to DB
//   const job = await prisma.job.create({
//     data: {
//       prompt,
//       userId,
//       status: JobStatus.QUEUED,
//       progress: 0,
//       // model: model || undefined,
//       // style_type: style_type || undefined,
//       // aspect_ratio: aspect_ratio || undefined,
//       // magic_prompt_option: magic_prompt_option || undefined,
//       // negative_prompt: negative_prompt || undefined,
//     },
//   })
//   // 2. Add job to Queue
//   await imageQueue.add("image", {
//     jobId: job.id,
//     prompt,
//     userId,
//     // model,
//     // style_type,
//     // aspect_ratio,
//     // magic_prompt_option,
//     // negative_prompt,
//   })
//   return job.id
// }
// src/services/createJobAndQueue.ts
const client_1 = require("../db/client");
const imageQueue_1 = require("../queue/imageQueue");
const client_2 = require("@prisma/client");
const createJobAndQueue = (_a) => __awaiter(void 0, [_a], void 0, function* ({ prompt, userId, model, style_type, aspect_ratio, magic_prompt_option, negative_prompt, }) {
    // 1. Save job to DB
    const job = yield client_1.prisma.job.create({
        data: {
            prompt,
            userId,
            status: client_2.JobStatus.QUEUED,
            progress: 0,
            model: model || "",
            style_type: style_type || undefined,
            aspect_ratio: aspectRatioToEnum(aspect_ratio),
            magic_prompt_option: magic_prompt_option || undefined,
            negative_prompt: negative_prompt || undefined,
        },
    });
    // 2. Add job to Queue
    yield imageQueue_1.imageQueue.add("image", {
        jobId: job.id,
        prompt,
        userId,
        model,
        style_type,
        aspect_ratio,
        magic_prompt_option,
        negative_prompt,
    });
    return job.id;
});
exports.createJobAndQueue = createJobAndQueue;
// Optional: map string to Prisma enum (if needed)
const aspectRatioToEnum = (value) => {
    if (!value)
        return undefined;
    return value;
};
