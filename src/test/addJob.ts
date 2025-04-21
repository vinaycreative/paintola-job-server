import { imageGenerationQueue } from "../jobs/imageGenerationQueue"
import { prisma } from "../db/client"
import dotenv from "dotenv"
dotenv.config()

async function run() {
  const prompt = "a red cat sitting on a cloud"
  const userId = "demo-user-123"

  const newJob = await prisma.job.create({
    data: { prompt, userId },
  })

  await imageGenerationQueue.add("generate", {
    jobId: newJob.id,
    prompt,
  })

  console.log("✅ Job queued:", newJob.id)
}

run()
