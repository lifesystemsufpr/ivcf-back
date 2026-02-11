"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateManagerDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const create_manager_dto_1 = require("./create-manager.dto");
class UpdateManagerDto extends (0, swagger_1.PartialType)(create_manager_dto_1.CreateManagerDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateManagerDto = UpdateManagerDto;
//# sourceMappingURL=update-manager.dto.js.map