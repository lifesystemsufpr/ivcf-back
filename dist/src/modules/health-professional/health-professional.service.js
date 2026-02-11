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
exports.HealthProfessionalService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
const user_service_1 = require("../users/user.service");
const client_1 = require("@prisma/client");
const base_service_1 = require("../../shared/services/base.service");
const normalize_string_1 = require("../../shared/functions/normalize-string");
let HealthProfessionalService = class HealthProfessionalService extends base_service_1.BaseService {
    constructor(prisma, userService) {
        super(prisma, prisma.healthProfessional, ["user.fullName", "user.cpf", "speciality"], {
            user: true,
        });
        this.prisma = prisma;
        this.userService = userService;
    }
    transform(healthProfessional) {
        const { password: _password, ...userData } = healthProfessional.user;
        const { user: _user, ...healthProfessionalData } = healthProfessional;
        return {
            ...healthProfessionalData,
            ...userData,
        };
    }
    async create(createHealthProfessionalDto) {
        return await this.prisma.$transaction(async (tx) => {
            const { user: createUser, speciality, ...createHealthProfessional } = createHealthProfessionalDto;
            const user = await this.userService.createUser({
                ...createUser,
                role: client_1.SystemRole.HEALTH_PROFESSIONAL,
            }, tx);
            const normalizedSpeciality = (0, normalize_string_1.normalizeString)(speciality) || "";
            const healthProfessional = await tx.healthProfessional.create({
                data: {
                    ...createHealthProfessional,
                    speciality,
                    speciality_normalized: normalizedSpeciality,
                    id: user.id,
                },
            });
            return { ...user, ...healthProfessional };
        });
    }
    async findAll(queryDto) {
        const customWhere = {
            active: true,
            user: {
                active: true,
            },
        };
        const result = await super.findAll(queryDto, customWhere);
        const dataWithRelations = await Promise.all(result.data.map(async (professional) => {
            const { hasRelations, details } = await this.checkDeletability(professional.id);
            return {
                ...professional,
                hasRelations,
                details,
            };
        }));
        return {
            ...result,
            data: dataWithRelations,
        };
    }
    async findOne(id, tx) {
        const prismaClient = tx || this.prisma;
        const healthProfessionalWithUser = await prismaClient.healthProfessional.findUniqueOrThrow({
            where: { id, active: true },
            include: { user: true },
        });
        return this.transform(healthProfessionalWithUser);
    }
    async update(id, updateHealthProfessionalDto) {
        try {
            await this.findOne(id);
            let hasEffectiveChanges = false;
            return await this.prisma.$transaction(async (tx) => {
                const { user: userData, ...healthProfessionalData } = updateHealthProfessionalDto;
                if (userData && Object.keys(userData).length > 0) {
                    await this.userService.update(id, userData, tx);
                    hasEffectiveChanges = true;
                }
                if (healthProfessionalData &&
                    Object.keys(healthProfessionalData).length > 0) {
                    const dataToUpdate = {
                        ...healthProfessionalData,
                    };
                    if (healthProfessionalData.speciality) {
                        dataToUpdate.speciality_normalized =
                            (0, normalize_string_1.normalizeString)(healthProfessionalData.speciality) || "";
                    }
                    await tx.healthProfessional.update({
                        where: { id },
                        data: dataToUpdate,
                    });
                    hasEffectiveChanges = true;
                }
                if (!hasEffectiveChanges) {
                    throw new common_1.BadRequestException("Nenhum campo válido para atualização foi fornecido.");
                }
                return this.findOne(id, tx);
            });
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === "P2025") {
                throw new common_1.NotFoundException(`Profissional de saúde com o ID '${id}' não encontrado.`);
            }
            throw error;
        }
    }
    async remove(id) {
        const relationInfo = await this.checkDeletability(id);
        try {
            const deactivatedProfessional = await this.prisma.$transaction(async (tx) => {
                const healthProfessional = await tx.healthProfessional.update({
                    where: { id },
                    data: { active: false },
                    include: { user: true },
                });
                await this.userService.update(id, { active: false }, tx);
                return healthProfessional;
            });
            const responseData = this.transform(deactivatedProfessional);
            return {
                ...responseData,
                hasRelations: relationInfo.hasRelations,
            };
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === "P2025") {
                throw new common_1.NotFoundException(`Profissional de saúde com ID '${id}' não encontrado.`);
            }
            throw error;
        }
    }
    async reactivate(id) {
        return this.prisma.$transaction(async (tx) => {
            const healthProfessional = await tx.healthProfessional.update({
                where: { id },
                data: { active: true },
            });
            await this.userService.update(id, { active: true }, tx);
            return healthProfessional;
        });
    }
    async checkDeletability(id) {
        return await this.prisma.checkDeletionSafety("healthProfessional", id);
    }
};
exports.HealthProfessionalService = HealthProfessionalService;
exports.HealthProfessionalService = HealthProfessionalService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        user_service_1.UserService])
], HealthProfessionalService);
//# sourceMappingURL=health-professional.service.js.map