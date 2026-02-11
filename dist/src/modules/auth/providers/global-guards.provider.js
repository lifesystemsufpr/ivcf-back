"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = provideGlobalAppGuards;
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const role_guard_guard_1 = require("../guards/role-guard.guard");
function provideGlobalAppGuards() {
    return [
        {
            provide: "APP_GUARD",
            useClass: jwt_auth_guard_1.JwtAuthGuard,
        },
        {
            provide: "APP_GUARD",
            useClass: role_guard_guard_1.RoleGuard,
        },
    ];
}
//# sourceMappingURL=global-guards.provider.js.map