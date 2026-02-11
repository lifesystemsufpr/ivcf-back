"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeString = normalizeString;
function normalizeString(str) {
    if (!str)
        return undefined;
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
}
//# sourceMappingURL=normalize-string.js.map