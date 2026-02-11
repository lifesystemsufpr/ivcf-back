"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_config_1 = require("./shared/config/app.config");
const shared_module_1 = require("./shared/shared.module");
const auth_module_1 = require("./modules/auth/auth.module");
const user_service_1 = require("./modules/users/user.service");
const user_module_1 = require("./modules/users/user.module");
const manager_module_1 = require("./modules/manager/manager.module");
const researcher_module_1 = require("./modules/researcher/researcher.module");
const health_professional_module_1 = require("./modules/health-professional/health-professional.module");
const health_unit_module_1 = require("./modules/health-unit/health-unit.module");
const institution_module_1 = require("./modules/institution/institution.module");
const global_guards_provider_1 = require("./modules/auth/providers/global-guards.provider");
const participant_module_1 = require("./modules/participant/participant.module");
const questionnaire_module_1 = require("./modules/questionnaire/questionnaire.module");
const prisma_module_1 = require("./shared/prisma/prisma.module");
const core_1 = require("@nestjs/core");
const prisma_client_exception_filter_1 = require("./shared/prisma/filters/prisma-client-exception.filter");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                cache: true,
                envFilePath: [".env.local", ".env"],
                load: [app_config_1.default],
            }),
            prisma_module_1.PrismaModule,
            shared_module_1.SharedModule,
            auth_module_1.AuthModule,
            user_module_1.UserModule,
            manager_module_1.ManagerModule,
            researcher_module_1.ResearcherModule,
            health_professional_module_1.HealthProfessionalModule,
            participant_module_1.ParticipantModule,
            health_unit_module_1.HealthUnitModule,
            institution_module_1.InstitutionModule,
            questionnaire_module_1.QuestionnairesModule,
        ],
        providers: [
            ...(0, global_guards_provider_1.default)(),
            user_service_1.UserService,
            {
                provide: core_1.APP_FILTER,
                useClass: prisma_client_exception_filter_1.PrismaClientExceptionFilter,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map