import { prisma } from "../db/client"

export interface SharedJobInput {
  prompt: string
  userId: string
  isRemix?: boolean
  image_description?: string
  image_input_url?: string
  image_weight?: number
  model?: string
  style_type?: string
  aspect_ratio?: string
  magic_prompt_option?: string
  negative_prompt?: string
  seed?: number
  color_palette?: any
  is_published?: boolean
}

export const createJobRecord = async (input: SharedJobInput): Promise<string> => {
  const {
    prompt,
    userId,
    model,
    style_type,
    aspect_ratio,
    image_description: image_description,
    magic_prompt_option,
    negative_prompt,
    seed,
    color_palette,
    is_published,
    image_input_url,
    image_weight,
    isRemix = false,
  } = input

  const job = await prisma.job.create({
    data: {
      prompt,
      userId,
      status: "PROCESSING",
      progress: 0,
      model: model || "",
      style_type: style_type || undefined,
      aspect_ratio: aspectRatioToEnum(aspect_ratio),
      magic_prompt_option: magic_prompt_option || undefined,
      negative_prompt: negative_prompt || undefined,
      metadata: {
        remix: isRemix,
        image_input_url,
        image_weight,
        seed,
        color_palette,
        is_published: !!is_published,
      },
    },
  })

  return job.id
}

const aspectRatioToEnum = (value?: string): any => {
  if (!value) return undefined
  return value as any
}
