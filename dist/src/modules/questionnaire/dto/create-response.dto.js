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
exports.CreateResponseDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class AnswerDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { questionId: { required: true, type: () => String, format: "uuid" }, selectedOptionId: { required: false, type: () => String, format: "uuid" }, valueText: { required: false, type: () => String } };
    }
}
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AnswerDto.prototype, "questionId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AnswerDto.prototype, "selectedOptionId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AnswerDto.prototype, "valueText", void 0);
class CreateResponseDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { participantId: { required: true, type: () => String, format: "uuid" }, healthProfessionalId: { required: true, type: () => String, format: "uuid" }, questionnaireId: { required: true, type: () => String, format: "uuid" }, healthcareUnitId: { required: true, type: () => String }, answers: { required: true, type: () => [AnswerDto] } };
    }
}
exports.CreateResponseDto = CreateResponseDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateResponseDto.prototype, "participantId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateResponseDto.prototype, "healthProfessionalId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateResponseDto.prototype, "questionnaireId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateResponseDto.prototype, "healthcareUnitId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AnswerDto),
    __metadata("design:type", Array)
], CreateResponseDto.prototype, "answers", void 0);
//# sourceMappingURL=create-response.dto.js.map