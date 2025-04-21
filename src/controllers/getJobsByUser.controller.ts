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
