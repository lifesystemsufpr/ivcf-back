"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
const bcrypt = require("bcrypt");
async function hashPassword(password) {
    const rounds = 10;
    return await bcrypt.hashSync(password, rounds);
}
async function comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}
//# sourceMappingURL=hash-password.js.map