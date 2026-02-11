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
exports.InstitutionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
const normalize_string_1 = require("../../shared/functions/normalize-string");
const client_1 = require("@prisma/client");
let InstitutionService = class InstitutionService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(createInstitutionDto) {
        const { title, ...rest } = createInstitutionDto;
        const normalizedTitle = (0, normalize_string_1.normalizeString)(title) || "";
        return this.prisma.institution.create({
            data: {
                ...rest,
                title,
                title_normalized: normalizedTitle,
            },
        });
    }
    async findAll(query) {
        const { page = 1, pageSize = 10, search, active, title, orderBy, sortOrder, } = query;
        const where = {
            AND: [
                title ? { title: { contains: title, mode: "insensitive" } } : {},
                active !== undefined ? { active } : { active: true },
            ],
            OR: search
                ? [
                    { title: { contains: search, mode: "insensitive" } },
                    { title_normalized: { contains: search, mode: "insensitive" } },
                ]
                : undefined,
        };
        const [institutions, total] = await Promise.all([
            this.prisma.institution.findMany({
                where,
                take: Number(pageSize),
                skip: (Number(page) - 1) * Number(pageSize),
                orderBy: { [orderBy || "title"]: sortOrder || "asc" },
            }),
            this.prisma.institution.count({ where }),
        ]);
        const data = await Promise.all(institutions.map(async (inst) => {
            const { hasRelations, details } = await this.checkDeletability(inst.id);
            return { ...inst, hasRelations, details };
        }));
        return {
            data,
            meta: {
                page: Number(page),
                pageSize: Number(pageSize),
                total,
                totalPages: Math.ceil(total / Number(pageSize)),
            },
        };
    }
    findOne(id) {
        return this.prisma.institution.findUnique({ where: { id, active: true } });
    }
    update(id, updateInstitutionDto) {
        const dataToUpdate = {
            ...updateInstitutionDto,
        };
        if (updateInstitutionDto.title) {
            dataToUpdate.title_normalized =
                (0, normalize_string_1.normalizeString)(updateInstitutionDto.title) || "";
        }
        return this.prisma.institution.update({
            where: { id },
            data: dataToUpdate,
        });
    }
    async remove(id) {
        const relationInfo = await this.checkDeletability(id);
        try {
            const deactivatedInstitution = await this.prisma.institution.update({
                where: { id },
                data: { active: false },
            });
            return {
                ...deactivatedInstitution,
                hasRelations: relationInfo.hasRelations,
            };
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === "P2025") {
                throw new common_1.NotFoundException(`Instituição com ID '${id}' não encontrada.`);
            }
            throw error;
        }
    }
    async reactivate(id) {
        return this.prisma.institution.update({
            where: { id },
            data: { active: true },
        });
    }
    async checkDeletability(id) {
        return await this.prisma.checkDeletionSafety("institution", id);
    }
};
exports.InstitutionService = InstitutionService;
exports.InstitutionService = InstitutionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InstitutionService);
//# sourceMappingURL=institution.service.js.map