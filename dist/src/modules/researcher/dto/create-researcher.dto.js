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
exports.CreateResearcherDto = exports.CreateResearcherUserDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const create_user_dto_1 = require("../../users/dtos/create-user.dto");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class CreateResearcherUserDto extends (0, swagger_1.OmitType)(create_user_dto_1.CreateUserDto, [
    "role",
]) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.CreateResearcherUserDto = CreateResearcherUserDto;
class CreateResearcherDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { user: { required: true, type: () => require("./create-researcher.dto").CreateResearcherUserDto }, email: { required: true, type: () => String }, fieldOfStudy: { required: false, type: () => String }, institutionId: { required: true, type: () => String, format: "uuid" } };
    }
}
exports.CreateResearcherDto = CreateResearcherDto;
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CreateResearcherUserDto),
    __metadata("design:type", CreateResearcherUserDto)
], CreateResearcherDto.prototype, "user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The email of the researcher",
        example: "joao.silva@example.com",
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateResearcherDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The field of study of the researcher",
        example: "Gerontologia",
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateResearcherDto.prototype, "fieldOfStudy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The ID of the institution the researcher is affiliated with",
        example: "a1b2c3d4-e5f6-7g8h-9i10-j11k12l13m14",
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateResearcherDto.prototype, "institutionId", void 0);
//# sourceMappingURL=create-researcher.dto.js.map