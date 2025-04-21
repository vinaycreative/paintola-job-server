import { Redis } from "ioredis"
import dotenv from "dotenv"
dotenv.config()

export const redisConnection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
})
