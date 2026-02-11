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
exports.ParticipantController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const participant_service_1 = require("./participant.service");
const create_participant_dto_1 = require("./dto/create-participant.dto");
const update_participant_dto_1 = require("./dto/update-participant.dto");
const swagger_1 = require("@nestjs/swagger");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const query_dto_1 = require("../../shared/dto/query.dto");
let ParticipantController = class ParticipantController {
    constructor(participantService) {
        this.participantService = participantService;
    }
    create(createParticipantDto) {
        return this.participantService.create(createParticipantDto);
    }
    findAll(queryDto) {
        return this.participantService.findAll(queryDto);
    }
    findOne(id) {
        return this.participantService.findOne(id);
    }
    update(id, updateParticipantDto) {
        return this.participantService.update(id, updateParticipantDto);
    }
    remove(id) {
        return this.participantService.remove(id);
    }
};
exports.ParticipantController = ParticipantController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_participant_dto_1.CreateParticipantDto]),
    __metadata("design:returntype", void 0)
], ParticipantController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)([client_1.SystemRole.HEALTH_PROFESSIONAL]),
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_dto_1.QueryDto]),
    __metadata("design:returntype", void 0)
], ParticipantController.prototype, "findAll", null);
__decorate([
    (0, roles_decorator_1.Roles)([client_1.SystemRole.PARTICIPANT, client_1.SystemRole.HEALTH_PROFESSIONAL]),
    (0, common_1.Get)(":id"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ParticipantController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)([client_1.SystemRole.HEALTH_PROFESSIONAL]),
    (0, common_1.Patch)(":id"),
    (0, swagger_1.ApiNoContentResponse)(),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_participant_dto_1.UpdateParticipantDto]),
    __metadata("design:returntype", void 0)
], ParticipantController.prototype, "update", null);
__decorate([
    (0, roles_decorator_1.Roles)([client_1.SystemRole.HEALTH_PROFESSIONAL]),
    (0, common_1.Delete)(":id"),
    (0, swagger_1.ApiNoContentResponse)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ParticipantController.prototype, "remove", null);
exports.ParticipantController = ParticipantController = __decorate([
    (0, common_1.Controller)("participant"),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [participant_service_1.ParticipantService])
], ParticipantController);
//# sourceMappingURL=participant.controller.js.map