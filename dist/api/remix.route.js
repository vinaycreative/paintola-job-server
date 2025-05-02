"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const remixImage_controller_1 = require("../controllers/remixImage.controller");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const asyncHandler_1 = require("../middleware/asyncHandler");
const router = (0, express_1.Router)();
router.post("/", uploadMiddleware_1.remixUpload, (0, asyncHandler_1.asyncHandler)(remixImage_controller_1.handleRemixImage));
exports.default = router;
