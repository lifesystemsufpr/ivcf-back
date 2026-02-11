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
exports.ParticipantService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
const user_service_1 = require("../users/user.service");
const client_1 = require("@prisma/client");
const date_fns_tz_1 = require("date-fns-tz");
const base_service_1 = require("../../shared/services/base.service");
let ParticipantService = class ParticipantService extends base_service_1.BaseService {
    constructor(prisma, userService) {
        super(prisma, prisma.participant, ["user.fullName", "user.cpf"], {
            user: true,
        });
        this.prisma = prisma;
        this.userService = userService;
    }
    transform(participant) {
        const { password: _password, ...userData } = participant.user;
        const { user: _user, ...participantData } = participant;
        return {
            ...participantData,
            ...userData,
        };
    }
    async create(createParticipantDto) {
        return await this.prisma.$transaction(async (tx) => {
            const { user: userData, birthday, ...participantData } = createParticipantDto;
            const timeZone = "America/Sao_Paulo";
            const dateString = new Date(birthday).toISOString().split("T")[0];
            const correctDate = (0, date_fns_tz_1.fromZonedTime)(dateString, timeZone);
            const password = (0, date_fns_tz_1.formatInTimeZone)(correctDate, timeZone, "ddMMyyyy");
            const user = await this.userService.createUser({
                ...userData,
                password: password,
                role: client_1.SystemRole.PARTICIPANT,
            }, tx);
            const participant = await tx.participant.create({
                data: {
                    ...participantData,
                    birthday,
                    user: {
                        connect: {
                            id: user.id,
                        },
                    },
                },
            });
            return { ...user, ...participant };
        });
    }
    async findAll(queryDto) {
        const customWhere = {
            active: true,
            user: { active: true },
        };
        console.time("findAll-prisma-query");
        const result = await super.findAll(queryDto, customWhere);
        console.timeEnd("findAll-prisma-query");
        const dataWithRelations = await Promise.all(result.data.map(async (participant, index) => {
            try {
                const safetyInfo = await this.checkDeletability(participant.id);
                return {
                    ...participant,
                    hasRelations: safetyInfo.hasRelations,
                    relationsDetails: safetyInfo.details,
                };
            }
            catch (error) {
                console.error(`[SERVICE] Falha ao processar relações do ID ${participant.id}:`, error);
                return participant;
            }
        }));
        return {
            ...result,
            data: dataWithRelations,
        };
    }
    async findOne(id, tx) {
        const prismaClient = tx || this.prisma;
        const participantWithUser = await prismaClient.participant.findFirstOrThrow({
            where: {
                id,
                active: true,
                user: { active: true },
            },
            include: { user: true },
        });
        return this.transform(participantWithUser);
    }
    async update(id, updateParticipantDto) {
        try {
            await this.findOne(id);
            let hasEffectiveChanges = false;
            const timeZone = "America/Sao_Paulo";
            return await this.prisma.$transaction(async (tx) => {
                const { user: userData, ...participantData } = updateParticipantDto;
                let newPassword = undefined;
                if (participantData && participantData.birthday) {
                    const dateString = new Date(participantData.birthday)
                        .toISOString()
                        .split("T")[0];
                    const correctDate = (0, date_fns_tz_1.fromZonedTime)(dateString, timeZone);
                    newPassword = (0, date_fns_tz_1.formatInTimeZone)(correctDate, timeZone, "ddMMyyyy");
                }
                if (userData && Object.keys(userData).length > 0) {
                    delete userData.password;
                    if (newPassword) {
                        userData.password = newPassword;
                    }
                    if (Object.keys(userData).length > 0) {
                        await this.userService.update(id, userData, tx);
                        hasEffectiveChanges = true;
                    }
                }
                else if (newPassword) {
                    await this.userService.update(id, { password: newPassword }, tx);
                    hasEffectiveChanges = true;
                }
                if (participantData && Object.keys(participantData).length > 0) {
                    await tx.participant.update({
                        where: { id },
                        data: participantData,
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
            if (error instanceof common_1.BadRequestException ||
                error instanceof common_1.NotFoundException) {
                throw error;
            }
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === "P2025") {
                throw new common_1.NotFoundException(`Paciente com o ID '${id}' não encontrado.`);
            }
            throw error;
        }
    }
    async remove(id) {
        const relationInfo = await this.checkDeletability(id);
        try {
            const deactivatedParticipant = await this.prisma.$transaction(async (tx) => {
                const participant = await tx.participant.update({
                    where: { id },
                    data: { active: false },
                    include: { user: true },
                });
                await tx.user.update({
                    where: { id },
                    data: { active: false },
                });
                return participant;
            });
            const responseData = this.transform(deactivatedParticipant);
            return {
                ...responseData,
                hasRelations: relationInfo.hasRelations,
            };
        }
        catch (error) {
            if (error instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === "P2025") {
                throw new common_1.NotFoundException(`Participante com ID '${id}' não encontrado.`);
            }
            throw error;
        }
    }
    async reactivate(id) {
        return this.prisma.$transaction(async (tx) => {
            const participant = await tx.participant.update({
                where: { id },
                data: { active: true },
            });
            await this.userService.update(id, { active: true }, tx);
            return participant;
        });
    }
    async checkDeletability(id) {
        return await this.prisma.checkDeletionSafety("Participant", id);
    }
};
exports.ParticipantService = ParticipantService;
exports.ParticipantService = ParticipantService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        user_service_1.UserService])
], ParticipantService);
//# sourceMappingURL=participant.service.js.map