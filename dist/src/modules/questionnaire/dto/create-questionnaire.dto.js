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
exports.CreateQuestionnaireDto = exports.CreateQuestionGroupDto = exports.CreateQuestionSubGroupDto = exports.CreateQuestionDto = exports.CreateQuestionOptionDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class CreateQuestionOptionDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { label: { required: true, type: () => String }, score: { required: true, type: () => Number }, order: { required: true, type: () => Number, minimum: 1 } };
    }
}
exports.CreateQuestionOptionDto = CreateQuestionOptionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateQuestionOptionDto.prototype, "label", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateQuestionOptionDto.prototype, "score", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateQuestionOptionDto.prototype, "order", void 0);
class CreateQuestionDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { statement: { required: true, type: () => String }, order: { required: true, type: () => Number, minimum: 1 }, type: { required: true, type: () => Object }, required: { required: false, type: () => Boolean }, options: { required: true, type: () => [require("./create-questionnaire.dto").CreateQuestionOptionDto] } };
    }
}
exports.CreateQuestionDto = CreateQuestionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "statement", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateQuestionDto.prototype, "order", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.QuestionType),
    __metadata("design:type", String)
], CreateQuestionDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateQuestionDto.prototype, "required", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateQuestionOptionDto),
    __metadata("design:type", Array)
], CreateQuestionDto.prototype, "options", void 0);
class CreateQuestionSubGroupDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: true, type: () => String }, order: { required: true, type: () => Number, minimum: 1 }, description: { required: false, type: () => String }, questions: { required: true, type: () => [require("./create-questionnaire.dto").CreateQuestionDto] } };
    }
}
exports.CreateQuestionSubGroupDto = CreateQuestionSubGroupDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateQuestionSubGroupDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateQuestionSubGroupDto.prototype, "order", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateQuestionSubGroupDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateQuestionDto),
    __metadata("design:type", Array)
], CreateQuestionSubGroupDto.prototype, "questions", void 0);
class CreateQuestionGroupDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: true, type: () => String }, order: { required: true, type: () => Number, minimum: 1 }, description: { required: false, type: () => String }, questions: { required: false, type: () => [require("./create-questionnaire.dto").CreateQuestionDto] }, subGroups: { required: false, type: () => [require("./create-questionnaire.dto").CreateQuestionSubGroupDto] } };
    }
}
exports.CreateQuestionGroupDto = CreateQuestionGroupDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateQuestionGroupDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateQuestionGroupDto.prototype, "order", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateQuestionGroupDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateQuestionDto),
    __metadata("design:type", Array)
], CreateQuestionGroupDto.prototype, "questions", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateQuestionSubGroupDto),
    __metadata("design:type", Array)
], CreateQuestionGroupDto.prototype, "subGroups", void 0);
class CreateQuestionnaireDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: true, type: () => String }, slug: { required: true, type: () => String }, description: { required: false, type: () => String }, version: { required: false, type: () => String }, groups: { required: true, type: () => [require("./create-questionnaire.dto").CreateQuestionGroupDto] } };
    }
}
exports.CreateQuestionnaireDto = CreateQuestionnaireDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateQuestionnaireDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateQuestionnaireDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateQuestionnaireDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateQuestionnaireDto.prototype, "version", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateQuestionGroupDto),
    __metadata("design:type", Array)
], CreateQuestionnaireDto.prototype, "groups", void 0);
//# sourceMappingURL=create-questionnaire.dto.js.map