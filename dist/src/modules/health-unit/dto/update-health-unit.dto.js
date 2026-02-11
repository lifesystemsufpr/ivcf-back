"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateHealthUnitDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const create_health_unit_dto_1 = require("./create-health-unit.dto");
class UpdateHealthUnitDto extends (0, swagger_1.PartialType)(create_health_unit_dto_1.CreateHealthUnitDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateHealthUnitDto = UpdateHealthUnitDto;
//# sourceMappingURL=update-health-unit.dto.js.map