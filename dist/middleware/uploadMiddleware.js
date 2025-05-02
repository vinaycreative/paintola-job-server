"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.remixUpload = void 0;
const multer_1 = __importDefault(require("multer"));
exports.remixUpload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).single("image_file");
/*
Logic for temp folder solution
*/
// import multer from "multer"
// import path from "path"
// import fs from "fs"
// const uploadDir = path.join(__dirname, "../../temp")
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir)
// }
// export const remixUpload = multer({
//   storage: multer.diskStorage({
//     destination: (_req, _file, cb) => {
//       cb(null, uploadDir)
//     },
//     filename: (_req, file, cb) => {
//       const uniqueName = `${Date.now()}-${file.originalname}`
//       cb(null, uniqueName)
//     },
//   }),
// })
