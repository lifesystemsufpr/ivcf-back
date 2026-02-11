"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaClientExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const client_1 = require("@prisma/client");
let PrismaClientExceptionFilter = class PrismaClientExceptionFilter extends core_1.BaseExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            const prismaError = exception;
            const status = common_1.HttpStatus.CONFLICT;
            const target = prismaError.meta?.target;
            if (prismaError.code === "P2002") {
                const message = Array.isArray(target)
                    ? `Unique constraint failed on the fields: ${target.join(", ")}`
                    : "Unique constraint failed";
                response.status(status).json({
                    statusCode: status,
                    message: message,
                });
                return;
            }
            if (prismaError.code === "P2025") {
                response.status(common_1.HttpStatus.NOT_FOUND).json({
                    statusCode: common_1.HttpStatus.NOT_FOUND,
                    message: "Record not found",
                });
                return;
            }
        }
        super.catch(exception, host);
    }
};
exports.PrismaClientExceptionFilter = PrismaClientExceptionFilter;
exports.PrismaClientExceptionFilter = PrismaClientExceptionFilter = __decorate([
    (0, common_1.Catch)()
], PrismaClientExceptionFilter);
//# sourceMappingURL=prisma-client-exception.filter.js.map