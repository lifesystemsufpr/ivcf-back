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
exports.FindHealthcareUnitsQueryDto = exports.SortOrder = exports.HealthcareUnitOrderBy = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const query_dto_1 = require("../../../shared/dto/query.dto");
var HealthcareUnitOrderBy;
(function (HealthcareUnitOrderBy) {
    HealthcareUnitOrderBy["NAME"] = "name";
    HealthcareUnitOrderBy["CREATED_AT"] = "createdAt";
    HealthcareUnitOrderBy["CITY"] = "city";
})(HealthcareUnitOrderBy || (exports.HealthcareUnitOrderBy = HealthcareUnitOrderBy = {}));
var SortOrder;
(function (SortOrder) {
    SortOrder["ASC"] = "asc";
    SortOrder["DESC"] = "desc";
})(SortOrder || (exports.SortOrder = SortOrder = {}));
class FindHealthcareUnitsQueryDto extends query_dto_1.QueryDto {
    constructor() {
        super(...arguments);
        this.orderBy = HealthcareUnitOrderBy.NAME;
        this.sortOrder = SortOrder.ASC;
    }
    static _OPENAPI_METADATA_FACTORY() {
        return { city: { required: false, type: () => String }, state: { required: false, type: () => String }, neighborhood: { required: false, type: () => String }, active: { required: false, type: () => Boolean }, startDate: { required: false, type: () => Date }, endDate: { required: false, type: () => Date }, orderBy: { required: false, default: HealthcareUnitOrderBy.NAME, enum: require("./find-health-unit-query.dto").HealthcareUnitOrderBy }, sortOrder: { required: false, default: SortOrder.ASC, enum: require("./find-health-unit-query.dto").SortOrder } };
    }
}
exports.FindHealthcareUnitsQueryDto = FindHealthcareUnitsQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindHealthcareUnitsQueryDto.prototype, "city", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindHealthcareUnitsQueryDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FindHealthcareUnitsQueryDto.prototype, "neighborhood", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value === "true" || value === true),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], FindHealthcareUnitsQueryDto.prototype, "active", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], FindHealthcareUnitsQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], FindHealthcareUnitsQueryDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(HealthcareUnitOrderBy),
    __metadata("design:type", String)
], FindHealthcareUnitsQueryDto.prototype, "orderBy", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(SortOrder),
    __metadata("design:type", String)
], FindHealthcareUnitsQueryDto.prototype, "sortOrder", void 0);
//# sourceMappingURL=find-health-unit-query.dto.js.map