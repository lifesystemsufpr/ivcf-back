"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseService = void 0;
const normalize_string_1 = require("../functions/normalize-string");
class BaseService {
    constructor(prisma, model, searchableFields = [], defaultInclude) {
        this.prisma = prisma;
        this.model = model;
        this.searchableFields = searchableFields;
        this.defaultInclude = defaultInclude;
    }
    async findAll(queryDto, additionalWhere = {}) {
        const { search, page = 1, pageSize = 10 } = queryDto;
        const skip = (page - 1) * pageSize;
        const take = pageSize;
        const searchWhere = {};
        const nonNormalizedFields = ["cpf", "email"];
        if (search && this.searchableFields.length > 0) {
            const normalizedSearch = (0, normalize_string_1.normalizeString)(search) || "";
            const rawSearch = search;
            searchWhere.OR = this.searchableFields.map((field) => {
                let isNonNormalized = nonNormalizedFields.includes(field);
                let relation = "";
                let fieldName = field;
                if (field.includes(".")) {
                    const parts = field.split(".");
                    relation = parts[0];
                    fieldName = parts[1];
                    if (nonNormalizedFields.includes(fieldName)) {
                        isNonNormalized = true;
                    }
                }
                if (isNonNormalized) {
                    const whereClause = {
                        [fieldName]: {
                            contains: rawSearch,
                            mode: "insensitive",
                        },
                    };
                    return relation ? { [relation]: whereClause } : whereClause;
                }
                const normalizedField = `${fieldName}_normalized`;
                const whereClause = {
                    [normalizedField]: {
                        contains: normalizedSearch,
                        mode: "insensitive",
                    },
                };
                return relation ? { [relation]: whereClause } : whereClause;
            });
        }
        const where = {
            AND: [searchWhere, additionalWhere],
        };
        const [data, total] = await this.prisma.$transaction([
            this.model.findMany({
                where,
                skip,
                take,
                include: this.defaultInclude,
            }),
            this.model.count({ where }),
        ]);
        return {
            data: data.map((item) => this.transform(item)),
            meta: { total, page, pageSize, lastPage: Math.ceil(total / pageSize) },
        };
    }
}
exports.BaseService = BaseService;
//# sourceMappingURL=base.service.js.map