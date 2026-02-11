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
exports.ManagerController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const manager_service_1 = require("./manager.service");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const swagger_1 = require("@nestjs/swagger");
const create_manager_dto_1 = require("./dto/create-manager.dto");
const update_manager_dto_1 = require("./dto/update-manager.dto");
const query_dto_1 = require("../../shared/dto/query.dto");
let ManagerController = class ManagerController {
    constructor(managerService) {
        this.managerService = managerService;
    }
    create(createManagerDto) {
        return this.managerService.create(createManagerDto);
    }
    findAll(queryDto) {
        return this.managerService.findAll(queryDto);
    }
    findByCpf(cpf) {
        return this.managerService.findByCpf(cpf);
    }
    update(cpf, updateManagerDto) {
        return this.managerService.update(cpf, updateManagerDto);
    }
    remove(cpf) {
        return this.managerService.remove(cpf);
    }
};
exports.ManagerController = ManagerController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)([client_1.SystemRole.MANAGER]),
    openapi.ApiResponse({ status: 201, type: Object }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_manager_dto_1.CreateManagerDto]),
    __metadata("design:returntype", void 0)
], ManagerController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)([client_1.SystemRole.MANAGER]),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_dto_1.QueryDto]),
    __metadata("design:returntype", void 0)
], ManagerController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":cpf"),
    (0, roles_decorator_1.Roles)([client_1.SystemRole.MANAGER]),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("cpf")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ManagerController.prototype, "findByCpf", null);
__decorate([
    (0, common_1.Patch)(":cpf"),
    (0, roles_decorator_1.Roles)([client_1.SystemRole.MANAGER]),
    (0, swagger_1.ApiNoContentResponse)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("cpf")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_manager_dto_1.UpdateManagerDto]),
    __metadata("design:returntype", void 0)
], ManagerController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":cpf"),
    (0, roles_decorator_1.Roles)([client_1.SystemRole.MANAGER]),
    (0, swagger_1.ApiNoContentResponse)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("cpf")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ManagerController.prototype, "remove", null);
exports.ManagerController = ManagerController = __decorate([
    (0, common_1.Controller)("manager"),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [manager_service_1.ManagerService])
], ManagerController);
//# sourceMappingURL=manager.controller.js.map