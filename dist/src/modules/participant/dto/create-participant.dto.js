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
exports.CreateParticipantDto = exports.CreateParticipantUserDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const create_user_dto_1 = require("../../users/dtos/create-user.dto");
class CreateParticipantUserDto extends (0, swagger_1.OmitType)(create_user_dto_1.CreateUserDto, [
    "role",
    "password",
]) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.CreateParticipantUserDto = CreateParticipantUserDto;
class CreateParticipantDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { user: { required: true, type: () => require("./create-participant.dto").CreateParticipantUserDto }, birthday: { required: true, type: () => Date }, scholarship: { required: true, type: () => Object }, socio_economic_level: { required: true, type: () => Object }, weight: { required: true, type: () => Number }, height: { required: true, type: () => Number }, zipCode: { required: true, type: () => String }, street: { required: true, type: () => String }, number: { required: true, type: () => String }, complement: { required: true, type: () => String }, neighborhood: { required: true, type: () => String }, city: { required: true, type: () => String }, state: { required: true, type: () => String } };
    }
}
exports.CreateParticipantDto = CreateParticipantDto;
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => CreateParticipantUserDto),
    __metadata("design:type", CreateParticipantUserDto)
], CreateParticipantDto.prototype, "user", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Date of birth of the participant",
        example: "1945-12-31",
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.MaxDate)(new Date(), {
        message: "A data de nascimento não pode ser uma data futura.",
    }),
    __metadata("design:type", Date)
], CreateParticipantDto.prototype, "birthday", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The scholarship status of the participant",
        example: "HIGHER_EDUCATION_COMPLETE",
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(client_1.Scholarship),
    __metadata("design:type", String)
], CreateParticipantDto.prototype, "scholarship", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The socio-economic level of the participant",
        example: "C",
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(client_1.SocialEconomicLevel),
    __metadata("design:type", String)
], CreateParticipantDto.prototype, "socio_economic_level", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The weight of the participant",
        example: 70,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateParticipantDto.prototype, "weight", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The height of the participant",
        example: 1.75,
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateParticipantDto.prototype, "height", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The zip code of the participant",
        example: "12345-678",
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateParticipantDto.prototype, "zipCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The street address of the participant",
        example: "123 Main St",
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateParticipantDto.prototype, "street", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The street number of the participant",
        example: "456",
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateParticipantDto.prototype, "number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The complement of the address of the participant",
        example: "Apt 789",
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateParticipantDto.prototype, "complement", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The neighborhood of the participant",
        example: "Centro",
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateParticipantDto.prototype, "neighborhood", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The city of the participant",
        example: "Curitiba",
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateParticipantDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The state of the participant",
        example: "PR",
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateParticipantDto.prototype, "state", void 0);
//# sourceMappingURL=create-participant.dto.js.map