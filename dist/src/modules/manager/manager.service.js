"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagerService = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("../users/user.service");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../shared/prisma/prisma.service");
let ManagerService = class ManagerService {
    constructor(userService, prisma) {
        this.userService = userService;
        this.prisma = prisma;
    }
    transform(user) {
        const { password: _password, ...data } = user;
        return data;
    }
    create(request) {
        return this.userService.createUser({
            ...request,
            role: client_1.SystemRole.MANAGER,
        });
    }
    async findAll(queryDto) {
        const { search, page = 1, pageSize = 10 } = queryDto;
        const skip = (page - 1) * pageSize;
        const take = pageSize;
        const searchableFields = ["fullName", "cpf"];
        const where = {
            role: client_1.SystemRole.MANAGER,
        };
        if (search) {
            where.OR = searchableFields.map((field) => ({
                [field]: { contains: search, mode: "insensitive" },
            }));
        }
        const [managers, total] = await this.prisma.$transaction([
            this.prisma.user.findMany({
                where,
                skip,
                take,
            }),
            this.prisma.user.count({ where }),
        ]);
        return {
            data: managers.map((manager) => this.transform(manager)),
            meta: { total, page, pageSize, lastPage: Math.ceil(total / pageSize) },
        };
    }
    findOne(id) {
        return this.userService.findOne(id);
    }
    findByCpf(cpf) {
        return this.userService.findByCpf(cpf);
    }
    update(id, updateUserDto) {
        return this.userService.update(id, updateUserDto);
    }
    remove(id) {
        return this.userService.remove(id);
    }
};
exports.ManagerService = ManagerService;
exports.ManagerService = ManagerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        prisma_service_1.PrismaService])
], ManagerService);
//# sourceMappingURL=manager.service.js.map