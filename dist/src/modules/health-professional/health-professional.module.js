"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthProfessionalModule = void 0;
const common_1 = require("@nestjs/common");
const health_professional_service_1 = require("./health-professional.service");
const health_professional_controller_1 = require("./health-professional.controller");
const user_module_1 = require("../users/user.module");
let HealthProfessionalModule = class HealthProfessionalModule {
};
exports.HealthProfessionalModule = HealthProfessionalModule;
exports.HealthProfessionalModule = HealthProfessionalModule = __decorate([
    (0, common_1.Module)({
        controllers: [health_professional_controller_1.HealthProfessionalController],
        providers: [health_professional_service_1.HealthProfessionalService],
        imports: [user_module_1.UserModule],
    })
], HealthProfessionalModule);
//# sourceMappingURL=health-professional.module.js.map