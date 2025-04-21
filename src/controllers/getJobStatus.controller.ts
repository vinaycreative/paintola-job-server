// import { Request, Response } from "express"
// import { getJobById } from "../services/job.service"

// export const handleGetJobStatus = async (req: Request, res: Response) => {
//   const { id } = req.params

//   const job = await getJobById(id)

//   if (!job) {
//     return res.status(404).json({ error: "Job not found" })
//   }

//   return res.status(200).json({
//     jobId: job.id,
//     status: job.status,
//     progress: job.progress,
//     imageUrl: job.imageUrl,
//     error: job.error,
//     createdAt: job.createdAt,
//     updatedAt: job.updatedAt,
//   })
// }
