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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    constructor() {
        const connectionString = `${process.env.DATABASE_URL}`;
        const pool = new pg_1.Pool({
            connectionString,
            max: 10,
            idleTimeoutMillis: 30000,
        });
        const adapter = new adapter_pg_1.PrismaPg(pool);
        super({
            adapter,
            log: [{ emit: "event", level: "query" }],
        });
        this.logger = new common_1.Logger(PrismaService_1.name);
    }
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
    async checkDeletionSafety(modelName, id) {
        const client = this;
        const dmmfModel = client_1.Prisma.dmmf.datamodel.models.find((m) => m.name.toLowerCase() === modelName.toLowerCase());
        if (!dmmfModel)
            return { hasRelations: false, details: {} };
        const relationsCount = {};
        const modelKey = `${dmmfModel.name.charAt(0).toLowerCase()}${dmmfModel.name.slice(1)}Id`;
        const listRelations = dmmfModel.fields.filter((f) => f.kind === "object" && f.type !== "User");
        for (const relation of listRelations) {
            const delegateName = `${relation.type.charAt(0).toLowerCase()}${relation.type.slice(1)}`;
            const delegate = client[delegateName];
            if (delegate && typeof delegate.count === "function") {
                try {
                    const count = await delegate.count({
                        where: { [modelKey]: id },
                    });
                    if (count > 0) {
                        relationsCount[relation.name] = count;
                    }
                }
                catch (err) {
                    this.logger.warn(`Não foi possível checar relação em: ${delegateName}`, err);
                    continue;
                }
            }
        }
        const totalRelations = Object.values(relationsCount).reduce((a, b) => a + b, 0);
        return {
            hasRelations: totalRelations > 0,
            details: relationsCount,
        };
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map