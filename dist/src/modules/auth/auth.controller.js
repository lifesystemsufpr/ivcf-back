"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const local_auth_guard_1 = require("./guards/local-auth.guard");
const request_user_decorator_1 = require("./decorators/request-user.decorator");
const public_decorator_1 = require("./decorators/public.decorator");
const login_dto_1 = require("./dto/login.dto");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
let AuthController = class AuthController {
    constructor(authService, configService) {
        this.authService = authService;
        this.configService = configService;
    }
    async login(user, loginDto, res) {
        try {
            const tokens = await this.authService.signIn(user, loginDto.keepMeLoggedIn);
            const cookieOptions = {
                httpOnly: true,
                secure: this.configService.get("NODE_ENV") === "production",
                path: "/",
            };
            if (loginDto.keepMeLoggedIn) {
                const thirtyDays = 30 * 24 * 60 * 60 * 1000;
                cookieOptions["maxAge"] = thirtyDays;
                console.log("Configurando cookie persistente (Max-Age).");
            }
            else {
                console.log("Configurando cookie de sessão.");
            }
            res.cookie("refresh_token", tokens.refresh_token, cookieOptions);
            return {
                access_token: tokens.access_token,
            };
        }
        catch (error) {
            console.error("Error in login controller:", error);
            throw error;
        }
    }
    async refresh(req, res) {
        const oldRefreshToken = req.cookies["refresh_token"];
        if (!oldRefreshToken) {
            throw new common_1.UnauthorizedException("Nenhum refresh token encontrado");
        }
        try {
            const { user, persistent } = await this.authService.validateRefreshToken(oldRefreshToken);
            const tokens = await this.authService.signIn(user, persistent);
            const cookieOptions = {
                httpOnly: true,
                secure: this.configService.get("NODE_ENV") === "production",
                path: "/",
            };
            if (persistent) {
                cookieOptions["maxAge"] = 30 * 24 * 60 * 60 * 1000;
            }
            res.cookie("refresh_token", tokens.refresh_token, cookieOptions);
            return {
                access_token: tokens.access_token,
            };
        }
        catch {
            res.clearCookie("refresh_token");
            throw new common_1.UnauthorizedException("Refresh token inválido ou expirado");
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)("login"),
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(local_auth_guard_1.LocalAuthGuard),
    (0, swagger_1.ApiBody)({ type: login_dto_1.LoginDto }),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, request_user_decorator_1.RequestUser)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)("refresh"),
    (0, public_decorator_1.Public)(),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)("auth"),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map