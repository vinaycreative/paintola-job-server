import axios, { AxiosError } from "axios"
import FormData from "form-data"
import { getApiErrorMessage } from "../utils/formatAxiosError"
import { Readable } from "stream"
import { get } from "https" // For downloading image from URL
import fs from "fs"

const IDEOGRAM_API_KEY = process.env.IDEOGRAM_API_KEY || ""
const IDEOGRAM_REMIX_URL = "https://api.ideogram.ai/remix"

interface RemixOptions {
  prompt: string
  image_input_url: string
  image_weight: number
  model?: string
  style_type?: string
  negative_prompt?: string
  aspect_ratio?: string
  magic_prompt_option?: string
  color_palette?: JSON
}

export const generateRemixFromPrompt = async ({
  prompt,
  image_input_url,
  image_weight,
  model,
  style_type,
  aspect_ratio,
  negative_prompt,
  magic_prompt_option,
  color_palette,
}: RemixOptions): Promise<string> => {
  let imageUrl = ""

  try {
    if (!image_input_url) throw new Error("Missing image path for remix job")

    // Download image buffer from Cloudinary
    const { data: imageBuffer } = await axios.get(image_input_url, {
      responseType: "arraybuffer",
    })

    console.log("imageBuffer: ", imageBuffer)

    const imageRequest = {
      prompt,
      image_weight,
      ...(model && { model }),
      ...(style_type && { style_type }),
      ...(aspect_ratio && { aspect_ratio }),
      ...(magic_prompt_option && { magic_prompt_option }),
      ...(negative_prompt && { negative_prompt }),
      ...(color_palette && Object.keys(color_palette).length > 0 && { color_palette }),
    }

    const formData = new FormData()
    formData.append("image_request", JSON.stringify(imageRequest))
    formData.append("image_file", imageBuffer, {
      filename: "remix.jpg",
    })

    const response = await axios.post(IDEOGRAM_REMIX_URL, formData, {
      headers: {
        ...formData.getHeaders(),
        "Api-Key": IDEOGRAM_API_KEY,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    })

    imageUrl = response.data?.data?.[0]?.url

    if (!imageUrl) {
      throw new Error("No image URL returned by Ideogram remix API.")
    }

    return imageUrl
  } catch (err) {
    throw new Error(getApiErrorMessage(err))
  } finally {
    // Always delete temp file
    if (image_input_url && fs.existsSync(image_input_url)) {
      fs.unlink(image_input_url, (err) => {
        if (err) {
          console.warn("⚠️ Failed to delete temp file:", image_input_url, err)
        } else {
          console.log("🧹 Temp file cleaned:", image_input_url)
        }
      })
    }
  }
}
