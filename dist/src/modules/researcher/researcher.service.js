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
exports.ResearcherService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
const user_service_1 = require("../users/user.service");
const client_1 = require("@prisma/client");
const base_service_1 = require("../../shared/services/base.service");
let ResearcherService = class ResearcherService extends base_service_1.BaseService {
    constructor(prisma, userService) {
        super(prisma, prisma.researcher, ["user.fullName", "user.cpf", "institution.title"], {
            user: true,
            institution: true,
        });
        this.prisma = prisma;
        this.userService = userService;
    }
    transform(researcher) {
        const { password: _password, ...userData } = researcher.user;
        const { title, title_normalized } = researcher.institution;
        const { user: _user, institution: _institution, ...researcherData } = researcher;
        return {
            ...userData,
            ...researcherData,
            institutionName: title,
            title_normalized: title_normalized,
        };
    }
    async create(createResearcherDto) {
        return await this.prisma.$transaction(async (tx) => {
            const { user: createUser, ...createResearcher } = createResearcherDto;
            const user = await this.userService.createUser({ ...createUser, role: client_1.SystemRole.RESEARCHER }, tx);
            const researcher = await tx.researcher.create({
                data: {
                    id: user.id,
                    ...createResearcher,
                },
            });
            return { ...user, ...researcher };
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
        const itemsWithSafetyFlag = await Promise.all(result.data.map(async (researcher) => {
            const { hasRelations, details } = await this.checkDeletability(researcher.id);
            return {
                ...researcher,
                hasRelations,
                details,
            };
        }));
        return {
            ...result,
            data: itemsWithSafetyFlag,
        };
    }
    async findOne(id, tx) {
        const prismaClient = tx || this.prisma;
        const researcherWithDetails = await prismaClient.researcher.findFirstOrThrow({
            where: {
                id,
                active: true,
                user: { active: true },
            },
            include: {
                user: true,
                institution: true,
            },
        });
        return this.transform(researcherWithDetails);
    }
    async update(id, updateResearcherDto) {
        try {
            await this.findOne(id);
            let hasEffectiveChanges = false;
            return await this.prisma.$transaction(async (tx) => {
                const { user: userData, ...researcherData } = updateResearcherDto;
                if (userData && Object.keys(userData).length > 0) {
                    await this.userService.update(id, userData, tx);
                    hasEffectiveChanges = true;
                }
                if (researcherData && Object.keys(researcherData).length > 0) {
                    await tx.researcher.update({
                        where: { id },
                        data: researcherData,
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
                throw new common_1.NotFoundException(`Pesquisador com o ID '${id}' não encontrado.`);
            }
            throw error;
        }
    }
    async remove(id) {
        const relationInfo = await this.checkDeletability(id);
        try {
            const deactivatedResearcher = await this.prisma.$transaction(async (tx) => {
                const researcher = await tx.researcher.update({
                    where: { id },
                    data: { active: false },
                    include: { user: true, institution: true },
                });
                await this.userService.update(id, { active: false }, tx);
                return researcher;
            });
            const responseData = this.transform(deactivatedResearcher);
            return {
                ...responseData,
                hasRelations: relationInfo.hasRelations,
            };
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === "P2025") {
                throw new common_1.NotFoundException(`Pesquisador com ID '${id}' não encontrado.`);
            }
            throw error;
        }
    }
    async reactivate(id) {
        return this.prisma.$transaction(async (tx) => {
            const researcher = await tx.researcher.update({
                where: { id },
                data: { active: true },
            });
            await this.userService.update(id, { active: true }, tx);
            return researcher;
        });
    }
    async checkDeletability(id) {
        return await this.prisma.checkDeletionSafety("researcher", id);
    }
};
exports.ResearcherService = ResearcherService;
exports.ResearcherService = ResearcherService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        user_service_1.UserService])
], ResearcherService);
//# sourceMappingURL=researcher.service.js.map