import axios from "axios"
import { getApiErrorMessage } from "../utils/formatAxiosError"
import dotenv from "dotenv"
dotenv.config()

const IDEOGRAM_API_KEY = process.env.IDEOGRAM_API_KEY || ""
const IDEOGRAM_API_URL = "https://api.ideogram.ai/generate"

interface GenerateOptions {
  prompt: string
  model?: string
  style_type?: string
  aspect_ratio?: string
  magic_prompt_option?: string
  negative_prompt?: string
  color_palette?: JSON
}

export const generateImageFromPrompt = async (options: GenerateOptions): Promise<string> => {
  const {
    prompt,
    model,
    style_type,
    aspect_ratio,
    magic_prompt_option,
    negative_prompt,
    color_palette,
  } = options

  const payload: any = {
    image_request: {
      prompt,
      ...(model && { model }),
      ...(style_type && { style_type }),
      ...(aspect_ratio && { aspect_ratio }),
      ...(magic_prompt_option && { magic_prompt_option }),
      ...(negative_prompt && { negative_prompt }),
      ...(color_palette && { color_palette }),
    },
  }

  try {
    const response = await axios.post(IDEOGRAM_API_URL, payload, {
      headers: {
        "Api-Key": IDEOGRAM_API_KEY,
        "Content-Type": "application/json",
      },
    })

    const imageUrl = response.data?.data?.[0]?.url
    if (!imageUrl) {
      throw new Error("No image URL returned by Ideogram.")
    }

    return imageUrl
  } catch (error) {
    throw new Error(getApiErrorMessage(error))
  }
}
