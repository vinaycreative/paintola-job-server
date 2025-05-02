"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocketServer = void 0;
const socket_io_1 = require("socket.io");
let io = null;
const initSocketServer = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: "*", // or restrict to your frontend URL
            methods: ["GET", "POST"],
        },
    });
    io.on("connection", (socket) => {
        console.log("🔌 New socket connected:", socket.id);
        // ✅ Join user room
        socket.on("join", ({ room }) => {
            socket.join(room);
            console.log(`✅ Socket ${socket.id} joined room: ${room}`);
        });
        socket.on("disconnect", () => {
            console.log("❌ Socket disconnected:", socket.id);
        });
    });
};
exports.initSocketServer = initSocketServer;
const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
};
exports.getIO = getIO;
