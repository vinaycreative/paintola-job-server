// import { prisma } from "../db/client"
// import { imageQueue } from "../queue/imageQueue"
// import { JobStatus } from "@prisma/client"

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
import { prisma } from "../db/client"
import { imageQueue } from "../queue/imageQueue"
import { JobStatus } from "@prisma/client"

interface CreateJobProps {
  prompt: string
  userId: string
  model?: string
  style_type?: string
  aspect_ratio?: string
  magic_prompt_option?: string
  negative_prompt?: string
}

export const createJobAndQueue = async ({
  prompt,
  userId,
  model,
  style_type,
  aspect_ratio,
  magic_prompt_option,
  negative_prompt,
}: CreateJobProps): Promise<string> => {
  // 1. Save job to DB
  const job = await prisma.job.create({
    data: {
      prompt,
      userId,
      status: JobStatus.QUEUED,
      progress: 0,
      model: model || "",
      style_type: style_type || undefined,
      aspect_ratio: aspectRatioToEnum(aspect_ratio),
      magic_prompt_option: magic_prompt_option || undefined,
      negative_prompt: negative_prompt || undefined,
    },
  })

  // 2. Add job to Queue
  await imageQueue.add("image", {
    jobId: job.id,
    prompt,
    userId,
    model,
    style_type,
    aspect_ratio,
    magic_prompt_option,
    negative_prompt,
  })

  return job.id
}

// Optional: map string to Prisma enum (if needed)
const aspectRatioToEnum = (value?: string): any => {
  if (!value) return undefined
  return value as any
}
