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
  aspect_ratio?: string
  magic_prompt_option?: string
  color_palette?: JSON
}

/**
 * Downloads image from a URL and returns a stream to be used in FormData
 */
const downloadImageStream = (url: string): Promise<Readable> => {
  return new Promise((resolve, reject) => {
    get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download image: ${res.statusCode}`))
      }
      resolve(res)
    }).on("error", reject)
  })
}

export const generateRemixFromPrompt = async ({
  prompt,
  image_input_url,
  image_weight,
  model,
  style_type,
  aspect_ratio,
  magic_prompt_option,
  color_palette,
}: RemixOptions): Promise<string> => {
  let imageUrl = ""

  try {
    if (!image_input_url) throw new Error("Missing image path for remix job")
    const imageBuffer = fs.readFileSync(image_input_url)

    // const imageStream = await downloadImageStream(image_input_url)

    const imageRequest = {
      prompt,
      image_weight,
      ...(model && { model }),
      ...(style_type && { style_type }),
      ...(aspect_ratio && { aspect_ratio }),
      ...(magic_prompt_option && { magic_prompt_option }),
      ...(color_palette && { color_palette }),
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
