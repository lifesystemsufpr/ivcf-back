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
exports.HealthUnitService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
const client_1 = require("@prisma/client");
const normalize_string_1 = require("../../shared/functions/normalize-string");
let HealthUnitService = class HealthUnitService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createHealthUnitDto) {
        const { name, ...restOfData } = createHealthUnitDto;
        const normalizedName = (0, normalize_string_1.normalizeString)(name) || "";
        return await this.prisma.healthcareUnit.create({
            data: {
                ...restOfData,
                name,
                name_normalized: normalizedName,
            },
        });
    }
    async findAll(query) {
        const { page = 1, pageSize = 10, search, city, state, neighborhood, active, startDate, endDate, orderBy, sortOrder, } = query;
        const where = {
            AND: [
                city ? { city: { contains: city, mode: "insensitive" } } : {},
                state ? { state: { contains: state, mode: "insensitive" } } : {},
                neighborhood
                    ? { neighborhood: { contains: neighborhood, mode: "insensitive" } }
                    : {},
                active !== undefined ? { active } : { active: true },
                startDate || endDate
                    ? { createdAt: { gte: startDate, lte: endDate } }
                    : {},
            ],
            OR: search
                ? [
                    { name: { contains: search, mode: "insensitive" } },
                    { name_normalized: { contains: search, mode: "insensitive" } },
                    { zipCode: { contains: search } },
                ]
                : undefined,
        };
        const [units, total] = await Promise.all([
            this.prisma.healthcareUnit.findMany({
                where,
                take: Number(pageSize),
                skip: (Number(page) - 1) * Number(pageSize),
                orderBy: { [orderBy || "name"]: sortOrder || "asc" },
            }),
            this.prisma.healthcareUnit.count({ where }),
        ]);
        const data = await Promise.all(units.map(async (unit) => {
            const { hasRelations, details } = await this.checkDeletability(unit.id);
            return { ...unit, hasRelations, details };
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
    async findOne(id) {
        const healthUnit = await this.prisma.healthcareUnit.findFirst({
            where: { id, active: true },
        });
        if (!healthUnit) {
            throw new common_1.NotFoundException(`Unidade de Saúde com o ID '${id}' não encontrada.`);
        }
        return healthUnit;
    }
    async update(id, updateHealthUnitDto) {
        try {
            await this.findOne(id);
            const dataToUpdate = {
                ...updateHealthUnitDto,
            };
            if (updateHealthUnitDto.name) {
                dataToUpdate.name_normalized = (0, normalize_string_1.normalizeString)(updateHealthUnitDto.name);
            }
            return await this.prisma.healthcareUnit.update({
                where: { id },
                data: dataToUpdate,
            });
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === "P2025") {
                throw new common_1.NotFoundException(`Unidade de Saúde com o ID '${id}' não encontrada.`);
            }
            throw error;
        }
    }
    async remove(id) {
        const relationInfo = await this.checkDeletability(id);
        try {
            const deactivatedUnit = await this.prisma.healthcareUnit.update({
                where: { id },
                data: { active: false },
            });
            return {
                ...deactivatedUnit,
                hasRelations: relationInfo.hasRelations,
            };
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === "P2025") {
                throw new common_1.NotFoundException(`Unidade de Saúde com o ID '${id}' não encontrada.`);
            }
            throw error;
        }
    }
    async restore(id) {
        const healthUnit = await this.prisma.healthcareUnit.findFirst({
            where: { id, active: false },
        });
        if (!healthUnit) {
            throw new common_1.NotFoundException(`Unidade de Saúde inativa com o ID '${id}' não encontrada.`);
        }
        return await this.prisma.healthcareUnit.update({
            where: { id },
            data: { active: true },
        });
    }
    async checkDeletability(id) {
        return await this.prisma.checkDeletionSafety("healthcareUnit", id);
    }
};
exports.HealthUnitService = HealthUnitService;
exports.HealthUnitService = HealthUnitService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HealthUnitService);
//# sourceMappingURL=health-unit.service.js.map