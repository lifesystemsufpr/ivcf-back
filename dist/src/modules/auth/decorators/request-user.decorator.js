"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestUser = void 0;
const common_1 = require("@nestjs/common");
exports.RequestUser = (0, common_1.createParamDecorator)((_data, executionContext) => {
    const request = executionContext.switchToHttp().getRequest();
    return request.user;
});
//# sourceMappingURL=request-user.decorator.js.map