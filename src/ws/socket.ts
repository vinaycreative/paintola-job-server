import { Server } from "socket.io"
import { Server as HTTPServer } from "http"

let io: Server | null = null

export const initSocketServer = (server: HTTPServer) => {
  io = new Server(server, {
    cors: {
      origin: "*", // or restrict to your frontend URL
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("🔌 New socket connected:", socket.id)

    // ✅ Join user room
    socket.on("join", ({ room }) => {
      socket.join(room)
      console.log(`✅ Socket ${socket.id} joined room: ${room}`)
    })

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id)
    })
  })
}

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized")
  }
  return io
}
