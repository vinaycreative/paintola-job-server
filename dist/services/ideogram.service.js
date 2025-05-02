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
exports.generateImageFromPrompt = void 0;
const axios_1 = __importDefault(require("axios"));
const formatAxiosError_1 = require("../utils/formatAxiosError");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const IDEOGRAM_API_KEY = process.env.IDEOGRAM_API_KEY || "";
const IDEOGRAM_API_URL = "https://api.ideogram.ai/generate";
const generateImageFromPrompt = (options) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    const { prompt, model, style_type, aspect_ratio, seed, magic_prompt_option, negative_prompt, color_palette, } = options;
    const payload = {
        image_request: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ prompt }, (model && { model })), (model === "V_2" && style_type && { style_type })), (aspect_ratio && { aspect_ratio })), (magic_prompt_option && { magic_prompt_option })), (negative_prompt && { negative_prompt })), (color_palette && Object.keys(color_palette).length > 0 && { color_palette })), (seed && { seed })),
    };
    try {
        const response = yield axios_1.default.post(IDEOGRAM_API_URL, payload, {
            headers: {
                "Api-Key": IDEOGRAM_API_KEY,
                "Content-Type": "application/json",
            },
        });
        const imageUrl = (_c = (_b = (_a = response.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.url;
        const seedIdo = (_f = (_e = (_d = response.data) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.seed;
        if (!imageUrl) {
            throw new Error("No image URL returned by Ideogram.");
        }
        return {
            url: imageUrl,
            seed: seedIdo,
        };
    }
    catch (error) {
        throw new Error((0, formatAxiosError_1.getApiErrorMessage)(error));
    }
});
exports.generateImageFromPrompt = generateImageFromPrompt;
