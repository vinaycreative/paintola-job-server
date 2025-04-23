// import axios from "axios"

// const IDEOGRAM_API_KEY = process.env.IDEOGRAM_API_KEY || ""
// const IDEOGRAM_API_URL = "https://api.ideogram.ai/generate"

// type GenerateImageRequest = {
//   prompt: string
//   model?: string
//   style_type?: string
//   aspect_ratio?: string
//   magic_prompt_option?: "ON" | "OFF"
//   negative_prompt?: string
//   seed?: number
// }

// export const generateImageFromPrompt = async (
//   imageRequest: GenerateImageRequest
// ): Promise<string> => {
//   try {
//     const response = await axios.post(
//       IDEOGRAM_API_URL,
//       { image_request: imageRequest },
//       {
//         headers: {
//           "Api-Key": IDEOGRAM_API_KEY,
//           "Content-Type": "application/json",
//         },
//       }
//     )

//     const imageUrl = response.data?.data?.[0]?.url

//     if (!imageUrl) {
//       throw new Error("Image URL not found in Ideogram response.")
//     }

//     return imageUrl
//   } catch (error: any) {
//     const msg = error.response?.data?.error || error.message || "Unknown Ideogram API error"
//     console.error("❌ Ideogram API Error:", msg)
//     throw new Error(msg)
//   }
// }

import axios from "axios"
import { getApiErrorMessage } from "../utils/formatAxiosError"
import dotenv from "dotenv"
dotenv.config()

const IDEOGRAM_API_KEY = process.env.IDEOGRAM_API_KEY || ""
const IDEOGRAM_API_URL = "https://api.ideogram.ai/generate"

// export const generateImageFromPrompt = async ({ prompt }: { prompt: string }): Promise<string> => {
//   const payload = {
//     image_request: {
//       prompt,
//     },
//   }

//   try {
//     const response = await axios.post(IDEOGRAM_API_URL, payload, {
//       headers: {
//         "Api-Key": IDEOGRAM_API_KEY,
//         "Content-Type": "application/json",
//       },
//     })

//     const imageUrl = response.data?.data?.[0]?.url

//     if (!imageUrl) {
//       throw new Error("No image URL returned by Ideogram.")
//     }

//     return imageUrl
//   } catch (error: any) {
//     throw new Error(getApiErrorMessage(error))
//   }
// }

interface GenerateOptions {
  prompt: string
  model?: string
  style_type?: string
  aspect_ratio?: string
  magic_prompt_option?: string
  negative_prompt?: string
}

export const generateImageFromPrompt = async (options: GenerateOptions): Promise<string> => {
  const { prompt, model, style_type, aspect_ratio, magic_prompt_option, negative_prompt } = options

  const payload: any = {
    image_request: {
      prompt,
      ...(model && { model }),
      ...(style_type && { style_type }),
      ...(aspect_ratio && { aspect_ratio }),
      ...(magic_prompt_option && { magic_prompt_option }),
      ...(negative_prompt && { negative_prompt }),
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
