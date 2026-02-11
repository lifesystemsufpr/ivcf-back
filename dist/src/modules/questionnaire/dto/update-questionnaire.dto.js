"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateQuestionnaireDto = void 0;
const openapi = require("@nestjs/swagger");
const mapped_types_1 = require("@nestjs/mapped-types");
const create_questionnaire_dto_1 = require("./create-questionnaire.dto");
class UpdateQuestionnaireDto extends (0, mapped_types_1.PartialType)(create_questionnaire_dto_1.CreateQuestionnaireDto) {
    static _OPENAPI_METADATA_FACTORY() {
        return {};
    }
}
exports.UpdateQuestionnaireDto = UpdateQuestionnaireDto;
//# sourceMappingURL=update-questionnaire.dto.js.map