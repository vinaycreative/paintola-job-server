"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImageFromFile = exports.uploadImageFromUrl = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const uploadImageFromUrl = (imageUrl, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const timestamp = Date.now();
    const filename = `${userId}-${timestamp}`;
    try {
        const result = yield cloudinary_1.default.uploader.upload(imageUrl, {
            folder: "paintola/generated",
            public_id: filename,
            use_filename: false,
            unique_filename: false,
            overwrite: false,
        });
        return result.secure_url;
    }
    catch (error) {
        console.error("❌ Cloudinary upload failed:", error.message);
        throw new Error("Image upload to CDN failed.");
    }
});
exports.uploadImageFromUrl = uploadImageFromUrl;
// For remix image uploads (from buffer/file)
const uploadImageFromFile = (file, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const timestamp = Date.now(); // Optional but useful for debugging/tracing
    const filename = `${userId}-${timestamp}`;
    return new Promise((resolve, reject) => {
        cloudinary_1.default.uploader
            .upload_stream({
            folder: "paintola/remix",
            public_id: filename,
            use_filename: false,
            unique_filename: false,
            overwrite: false, // prevent any overwrite
        }, (err, result) => {
            if (err || !result) {
                console.error("❌ Cloudinary upload failed:", err === null || err === void 0 ? void 0 : err.message);
                return reject(new Error("Image upload to CDN failed."));
            }
            resolve(result.secure_url);
        })
            .end(file.buffer);
    });
});
exports.uploadImageFromFile = uploadImageFromFile;
