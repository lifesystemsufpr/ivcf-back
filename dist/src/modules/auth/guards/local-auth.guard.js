"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LocalAuthGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
let LocalAuthGuard = LocalAuthGuard_1 = class LocalAuthGuard extends (0, passport_1.AuthGuard)("local") {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger(LocalAuthGuard_1.name);
    }
    handleRequest(err, user, info) {
        if (err || !user) {
            this.logger.error("Authentication failed:", err || info);
            throw err || new Error("Authentication failed");
        }
        return user;
    }
};
exports.LocalAuthGuard = LocalAuthGuard;
exports.LocalAuthGuard = LocalAuthGuard = LocalAuthGuard_1 = __decorate([
    (0, common_1.Injectable)()
], LocalAuthGuard);
//# sourceMappingURL=local-auth.guard.js.map