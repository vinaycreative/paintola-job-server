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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getJobsByUser = void 0;
const client_1 = require("../db/client");
const getJobsByUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }
        const jobs = yield client_1.prisma.job.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        return res.status(200).json({ jobs });
    }
    catch (err) {
        console.error("Error fetching jobs:", err);
        return res.status(500).json({ error: "Internal server error" });
    }
});
exports.getJobsByUser = getJobsByUser;
