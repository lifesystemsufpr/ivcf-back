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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
const client_1 = require("@prisma/client");
const hash_password_1 = require("../../shared/functions/hash-password");
const normalize_string_1 = require("../../shared/functions/normalize-string");
let UserService = class UserService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createUser(request, tx) {
        const prisma = tx || this.prisma;
        const { password, fullName, ...userData } = request;
        const hashedPassword = await (0, hash_password_1.hashPassword)(password);
        const normalizedFullName = (0, normalize_string_1.normalizeString)(fullName) || "";
        try {
            const user = await prisma.user.create({
                data: {
                    ...userData,
                    fullName,
                    fullName_normalized: normalizedFullName,
                    active: true,
                    password: hashedPassword,
                },
            });
            const { password: _, ...result } = user;
            return result;
        }
        catch (err) {
            if (err instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                err.code === "P2002") {
                throw new common_1.ConflictException("O e-mail ou CPF fornecido já está em uso.");
            }
            throw new common_1.InternalServerErrorException("Não foi possível criar o usuário.");
        }
    }
    findAllByRole(role) {
        return this.prisma.user.findMany({ where: { role } });
    }
    findOne(id) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }
    findByCpf(cpf) {
        return this.prisma.user.findUnique({
            where: { cpf },
        });
    }
    async update(id, updateUserDto, tx) {
        const prisma = tx || this.prisma;
        const dataToUpdate = { ...updateUserDto };
        if (updateUserDto.password) {
            const hashedPassword = await (0, hash_password_1.hashPassword)(updateUserDto.password);
            dataToUpdate.password = hashedPassword;
        }
        if (updateUserDto.fullName) {
            dataToUpdate.fullName_normalized = (0, normalize_string_1.normalizeString)(updateUserDto.fullName);
        }
        return await prisma.user.update({
            where: { id },
            data: dataToUpdate,
        });
    }
    async remove(id, tx) {
        const prisma = tx || this.prisma;
        return await prisma.user.delete({
            where: { id },
        });
    }
};
exports.UserService = UserService;
exports.UserService = UserService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map