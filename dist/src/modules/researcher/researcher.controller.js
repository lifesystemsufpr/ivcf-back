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
exports.ResearcherController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const researcher_service_1 = require("./researcher.service");
const create_researcher_dto_1 = require("./dto/create-researcher.dto");
const update_researcher_dto_1 = require("./dto/update-researcher.dto");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const query_dto_1 = require("../../shared/dto/query.dto");
let ResearcherController = class ResearcherController {
    constructor(researcherService) {
        this.researcherService = researcherService;
    }
    create(createResearcherDto) {
        return this.researcherService.create(createResearcherDto);
    }
    findAll(queryDto) {
        return this.researcherService.findAll(queryDto);
    }
    findOne(id) {
        return this.researcherService.findOne(id);
    }
    update(id, updateResearcherDto) {
        return this.researcherService.update(id, updateResearcherDto);
    }
    remove(id) {
        return this.researcherService.remove(id);
    }
};
exports.ResearcherController = ResearcherController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)([client_1.SystemRole.MANAGER]),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_researcher_dto_1.CreateResearcherDto]),
    __metadata("design:returntype", void 0)
], ResearcherController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)([client_1.SystemRole.RESEARCHER]),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_dto_1.QueryDto]),
    __metadata("design:returntype", void 0)
], ResearcherController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, roles_decorator_1.Roles)([client_1.SystemRole.RESEARCHER]),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ResearcherController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, roles_decorator_1.Roles)([client_1.SystemRole.RESEARCHER]),
    (0, swagger_1.ApiNoContentResponse)(),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_researcher_dto_1.UpdateResearcherDto]),
    __metadata("design:returntype", void 0)
], ResearcherController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, roles_decorator_1.Roles)([client_1.SystemRole.MANAGER]),
    (0, swagger_1.ApiNoContentResponse)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ResearcherController.prototype, "remove", null);
exports.ResearcherController = ResearcherController = __decorate([
    (0, common_1.Controller)("researcher"),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [researcher_service_1.ResearcherService])
], ResearcherController);
//# sourceMappingURL=researcher.controller.js.map