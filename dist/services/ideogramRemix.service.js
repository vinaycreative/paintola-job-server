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
exports.generateRemixFromPrompt = void 0;
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const formatAxiosError_1 = require("../utils/formatAxiosError");
const IDEOGRAM_API_KEY = process.env.IDEOGRAM_API_KEY || "";
const IDEOGRAM_REMIX_URL = "https://api.ideogram.ai/remix";
const generateRemixFromPrompt = (_a) => __awaiter(void 0, [_a], void 0, function* ({ prompt, image_input_url, image_weight, model, style_type, aspect_ratio, seed, negative_prompt, magic_prompt_option, color_palette, }) {
    var _b, _c, _d, _e, _f, _g;
    try {
        if (!image_input_url)
            throw new Error("Missing image path for remix job");
        // Download image buffer from Cloudinary
        const { data: imageBuffer } = yield axios_1.default.get(image_input_url, {
            responseType: "arraybuffer",
        });
        console.log("imageBuffer: ", imageBuffer);
        console.log("color_palette: ", color_palette);
        const imageRequest = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ prompt,
            image_weight }, (model && { model })), (style_type && { style_type })), (aspect_ratio && { aspect_ratio })), (magic_prompt_option && { magic_prompt_option })), (negative_prompt && { negative_prompt })), (color_palette && Object.keys(color_palette).length > 0 && { color_palette })), (seed && { seed }));
        const formData = new form_data_1.default();
        console.log("imageRequest: ", imageRequest);
        formData.append("image_request", JSON.stringify(imageRequest));
        formData.append("image_file", imageBuffer, {
            filename: "remix.jpg",
        });
        const response = yield axios_1.default.post(IDEOGRAM_REMIX_URL, formData, {
            headers: Object.assign(Object.assign({}, formData.getHeaders()), { "Api-Key": IDEOGRAM_API_KEY }),
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });
        const imageUrl = (_d = (_c = (_b = response.data) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.url;
        const seedIdo = (_g = (_f = (_e = response.data) === null || _e === void 0 ? void 0 : _e.data) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.seed;
        if (!imageUrl) {
            throw new Error("No image URL returned by Ideogram.");
        }
        return {
            url: imageUrl,
            seed: seedIdo,
        };
    }
    catch (err) {
        throw new Error("IDEOGRAM ERROR: " + (0, formatAxiosError_1.getApiErrorMessage)(err));
    }
});
exports.generateRemixFromPrompt = generateRemixFromPrompt;
