import express from "express"
import http from "http"
import dotenv from "dotenv"
import cors from "cors"
import apiRoutes from "./api"
import { initSocketServer } from "./ws/socket"
import { initQueueEventListeners } from "./queue/imageQueue"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// Routes
app.use("/api", apiRoutes)

// Create HTTP server for socket.io
const server = http.createServer(app)
// Init WebSocket server
initSocketServer(server)
initQueueEventListeners()

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`)
})
