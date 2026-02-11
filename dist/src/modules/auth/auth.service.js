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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
const hash_password_1 = require("../../shared/functions/hash-password");
const config_1 = require("@nestjs/config");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwtService, configService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async validateCredentials(cpf, password) {
        try {
            const dbUrl = process.env.DATABASE_URL || "NÃO DEFINIDA";
            const user = await this.prisma.user.findFirst({
                where: { cpf },
                select: {
                    id: true,
                    fullName: true,
                    cpf: true,
                    role: true,
                    password: true,
                    active: true,
                },
            });
            if (!user) {
                throw new common_1.UnauthorizedException({
                    debug_error: "USUÁRIO_NAO_ENCONTRADO",
                    message: `O CPF ${cpf} não retornou nenhum registro.`,
                    server_env: process.env.NODE_ENV,
                    db_check: dbUrl.split("@")[1] || "Url mal formatada ou local",
                });
            }
            if (user.active === false) {
                throw new common_1.ForbiddenException({
                    debug_error: "USUARIO_INATIVO",
                    message: "Conta desativada",
                });
            }
            const isPasswordValid = await (0, hash_password_1.comparePassword)(password, user.password);
            if (!isPasswordValid) {
                throw new common_1.UnauthorizedException({
                    debug_error: "SENHA_INCORRETA",
                    message: "O hash não bateu.",
                    stored_hash_prefix: user.password.substring(0, 10),
                    received_password_len: password.length,
                });
            }
            const { password: _, ...result } = user;
            return result;
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException ||
                error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.UnauthorizedException({
                debug_error: "ERRO_TECNICO_UNCAUGHT",
                details: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : null,
            });
        }
    }
    async signIn(user, keepMeLoggedIn = false) {
        const securityConfig = this.configService.getOrThrow("security");
        const payload = {
            username: user.fullName,
            cpf: user.cpf,
            sub: user.id,
            role: user.role,
        };
        const refreshPayload = {
            sub: user.id,
            persistent: keepMeLoggedIn,
        };
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: securityConfig.jwtSecret,
                expiresIn: securityConfig.jwtExpirationTime,
            }),
            this.jwtService.signAsync(refreshPayload, {
                secret: securityConfig.jwtSecret,
                expiresIn: securityConfig.jwtRefreshExpirationTime,
            }),
        ]);
        return {
            access_token: accessToken,
            refresh_token: refreshToken,
        };
    }
    async validateRefreshToken(token) {
        const securityConfig = this.configService.getOrThrow("security");
        const refreshSecret = securityConfig.jwtSecret;
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: refreshSecret,
            });
            const user = await this.getUserFromId(payload.sub);
            if (!user) {
                throw new common_1.UnauthorizedException("Usuário do token não encontrado");
            }
            return {
                user: user,
                persistent: payload.persistent ?? false,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn("Token de refresh inválido", message);
            throw new common_1.UnauthorizedException("Token de refresh inválido ou expirado");
        }
    }
    async getUserFromId(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                fullName: true,
                cpf: true,
                role: true,
            },
        });
        if (!user) {
            return null;
        }
        return user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map