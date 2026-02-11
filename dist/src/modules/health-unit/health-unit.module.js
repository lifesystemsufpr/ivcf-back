"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthUnitModule = void 0;
const common_1 = require("@nestjs/common");
const health_unit_service_1 = require("./health-unit.service");
const health_unit_controller_1 = require("./health-unit.controller");
let HealthUnitModule = class HealthUnitModule {
};
exports.HealthUnitModule = HealthUnitModule;
exports.HealthUnitModule = HealthUnitModule = __decorate([
    (0, common_1.Module)({
        controllers: [health_unit_controller_1.HealthUnitController],
        providers: [health_unit_service_1.HealthUnitService],
    })
], HealthUnitModule);
//# sourceMappingURL=health-unit.module.js.map