"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateManagerDto = void 0;
const openapi = require("@nestjs/swagger");
const swagger_1 = require("@nestjs/swagger");
const create_user_dto_1 = require("../../users/dtos/create-user.dto");
class CreateManagerDto extends (0, swagger_1.OmitType)(create_user_dto_1.CreateUserDto, ["role"]) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.CreateManagerDto = CreateManagerDto;
//# sourceMappingURL=create-manager.dto.js.map