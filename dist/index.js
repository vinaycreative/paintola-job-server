"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const api_1 = __importDefault(require("./api"));
const socket_1 = require("./ws/socket");
require("./queue/imageQueue");
const imageQueue_1 = require("./queue/imageQueue");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use("/api", api_1.default);
// Create HTTP server for socket.io
const server = http_1.default.createServer(app);
// Init WebSocket server
(0, socket_1.initSocketServer)(server);
(0, imageQueue_1.initQueueEventListeners)();
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
