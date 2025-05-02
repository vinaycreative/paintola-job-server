"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApiErrorMessage = getApiErrorMessage;
function getApiErrorMessage(error) {
    var _a, _b, _c, _d;
    return (((_b = (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) ||
        ((_d = (_c = error === null || error === void 0 ? void 0 : error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.message) ||
        (error === null || error === void 0 ? void 0 : error.message) ||
        "Something went wrong");
}
