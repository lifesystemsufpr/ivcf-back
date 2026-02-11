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
exports.QuestionnaireController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const questionnaire_service_1 = require("./questionnaire.service");
const create_response_dto_1 = require("./dto/create-response.dto");
const filter_questionnaire_response_dto_1 = require("./dto/filter-questionnaire-response.dto");
let QuestionnaireController = class QuestionnaireController {
    constructor(service) {
        this.service = service;
    }
    getStructure() {
        return this.service.getIvcfStructure();
    }
    findAll(query) {
        return this.service.findAll(query);
    }
    create(dto) {
        return this.service.createResponse(dto);
    }
    getByParticipant(id) {
        return this.service.findAllByParticipant(id);
    }
    getOneResponse(id) {
        return this.service.findOneResponse(id);
    }
};
exports.QuestionnaireController = QuestionnaireController;
__decorate([
    (0, common_1.Get)("ivcf-20"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], QuestionnaireController.prototype, "getStructure", null);
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [filter_questionnaire_response_dto_1.FilterQuestionnaireResponseDto]),
    __metadata("design:returntype", void 0)
], QuestionnaireController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)("response"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_response_dto_1.CreateResponseDto]),
    __metadata("design:returntype", void 0)
], QuestionnaireController.prototype, "create", null);
__decorate([
    (0, common_1.Get)("participant/:participantId"),
    openapi.ApiResponse({ status: 200, type: [Object] }),
    __param(0, (0, common_1.Param)("participantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuestionnaireController.prototype, "getByParticipant", null);
__decorate([
    (0, common_1.Get)("response/:id"),
    openapi.ApiResponse({ status: 200, type: Object }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], QuestionnaireController.prototype, "getOneResponse", null);
exports.QuestionnaireController = QuestionnaireController = __decorate([
    (0, common_1.Controller)("questionnaires"),
    __metadata("design:paramtypes", [questionnaire_service_1.QuestionnaireService])
], QuestionnaireController);
//# sourceMappingURL=questionnaire.controller.js.map