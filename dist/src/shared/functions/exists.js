"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exists;
async function exists(model, args) {
    const count = await model.count(args);
    return Boolean(count);
}
//# sourceMappingURL=exists.js.map