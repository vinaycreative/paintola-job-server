"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const generateImage_route_1 = __importDefault(require("./generateImage.route"));
// import jobStatusRoute from "./jobStatus.route"
const jobs_route_1 = __importDefault(require("./jobs.route"));
const remix_route_1 = __importDefault(require("./remix.route"));
const router = (0, express_1.Router)();
router.use("/generate-image", generateImage_route_1.default);
router.use("/remix-image", remix_route_1.default);
// router.use("/job-status", jobStatusRoute)
router.use("/jobs", jobs_route_1.default);
exports.default = router;
