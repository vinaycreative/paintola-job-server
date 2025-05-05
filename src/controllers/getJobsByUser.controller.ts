import { Request, Response } from "express"
import { prisma } from "../db/client"

export const getJobsByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ error: "userId is required" })
    }

    const jobs = await prisma.job.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    return res.status(200).json({ jobs })
  } catch (err) {
    console.error("Error fetching jobs:", err)
    return res.status(500).json({ error: "Internal server error" })
  }
}

export const deleteJobById = async (req: Request, res: Response) => {
  const { jobId } = req.params
  const { userId } = req.body

  if (!jobId || !userId) {
    return res.status(400).json({ error: "Missing jobId or userId" })
  }

  try {
    // Check if the job exists and belongs to this user
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      return res.status(404).json({ error: "Job not found" })
    }

    if (job.userId !== userId) {
      return res.status(403).json({ error: "You do not have permission to delete this job." })
    }

    await prisma.job.delete({
      where: { id: jobId },
    })

    return res.status(200).json({ message: "Job deleted successfully." })
  } catch (error) {
    console.error("❌ Error deleting job:", error)
    return res.status(500).json({ error: "Internal Server Error" })
  }
}
