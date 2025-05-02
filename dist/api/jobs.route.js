"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const asyncHandler_1 = require("../middleware/asyncHandler");
const getJobsByUser_controller_1 = require("../controllers/getJobsByUser.controller");
const router = (0, express_1.Router)();
router.get("/:userId", (0, asyncHandler_1.asyncHandler)(getJobsByUser_controller_1.getJobsByUser));
exports.default = router;
