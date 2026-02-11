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
exports.CreateHealthUnitDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateHealthUnitDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String }, zipCode: { required: true, type: () => String }, street: { required: true, type: () => String }, number: { required: true, type: () => String }, complement: { required: true, type: () => String }, city: { required: true, type: () => String }, neighborhood: { required: true, type: () => String }, state: { required: true, type: () => String }, active: { required: false, type: () => Boolean } };
    }
}
exports.CreateHealthUnitDto = CreateHealthUnitDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The name of the health unit",
        example: "Unidade de Saúde Central",
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHealthUnitDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The zip code of the health unit",
        example: "80010-000",
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHealthUnitDto.prototype, "zipCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The street address of the health unit",
        example: "Avenida Brasil",
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHealthUnitDto.prototype, "street", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The number of the health unit",
        example: "123",
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHealthUnitDto.prototype, "number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The complement of the health unit",
        example: "Bloco A",
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHealthUnitDto.prototype, "complement", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The city of the health unit",
        example: "Curitiba",
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHealthUnitDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The neighborhood of the health unit",
        example: "Centro",
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHealthUnitDto.prototype, "neighborhood", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "The state of the health unit",
        example: "Paraná",
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateHealthUnitDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateHealthUnitDto.prototype, "active", void 0);
//# sourceMappingURL=create-health-unit.dto.js.map