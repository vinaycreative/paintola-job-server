import { Router } from "express"
import { asyncHandler } from "../middleware/asyncHandler"
import { getJobsByUser } from "../controllers/getJobsByUser.controller"

const router = Router()
router.get("/:userId", asyncHandler(getJobsByUser))

export default router
