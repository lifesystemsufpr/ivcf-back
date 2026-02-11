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
exports.UpdateResearcherDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const create_researcher_dto_1 = require("./create-researcher.dto");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const update_user_dto_1 = require("../../users/dtos/update-user.dto");
class ResearcherDataOnlyDto extends (0, swagger_1.OmitType)(create_researcher_dto_1.CreateResearcherDto, [
    "user",
]) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
class UpdateResearcherDto extends (0, swagger_1.PartialType)(ResearcherDataOnlyDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return { user: { required: false, type: () => require("../../users/dtos/update-user.dto").UpdateUserDto } };
    }
}
exports.UpdateResearcherDto = UpdateResearcherDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => update_user_dto_1.UpdateUserDto),
    __metadata("design:type", update_user_dto_1.UpdateUserDto)
], UpdateResearcherDto.prototype, "user", void 0);
//# sourceMappingURL=update-researcher.dto.js.map