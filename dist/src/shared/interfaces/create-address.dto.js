"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAddressDto = void 0;
const openapi = require("@nestjs/swagger");
class CreateAddressDto {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: false, type: () => String }, street: { required: true, type: () => String }, number: { required: true, type: () => String }, complement: { required: false, type: () => String }, neighborhood: { required: true, type: () => String }, city: { required: true, type: () => String }, state: { required: true, type: () => String }, zipCode: { required: true, type: () => String } };
    }
}
exports.CreateAddressDto = CreateAddressDto;
//# sourceMappingURL=create-address.dto.js.map