"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const generateImage_controller_1 = require("../controllers/generateImage.controller");
const asyncHandler_1 = require("./../middleware/asyncHandler");
const router = (0, express_1.Router)();
router.post("/", (0, asyncHandler_1.asyncHandler)(generateImage_controller_1.handleGenerateImage));
exports.default = router;
