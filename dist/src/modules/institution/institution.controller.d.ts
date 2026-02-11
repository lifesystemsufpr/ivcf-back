import { InstitutionService } from "./institution.service";
import { CreateInstitutionDto } from "./dto/create-institution.dto";
import { UpdateInstitutionDto } from "./dto/update-institution.dto";
import { FindInstitutionsQueryDto } from "./dto/find-institution-query.dto";
export declare class InstitutionController {
    private readonly institutionService;
    constructor(institutionService: InstitutionService);
    create(createInstitutionDto: CreateInstitutionDto): import(".prisma/client").Prisma.Prisma__InstitutionClient<{
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        title_normalized: string;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    findAll(query: FindInstitutionsQueryDto): Promise<{
        data: {
            hasRelations: boolean;
            details: Record<string, number>;
            id: string;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            title_normalized: string;
        }[];
        meta: {
            page: number;
            pageSize: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): import(".prisma/client").Prisma.Prisma__InstitutionClient<{
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        title_normalized: string;
    } | null, null, import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, updateInstitutionDto: UpdateInstitutionDto): import(".prisma/client").Prisma.Prisma__InstitutionClient<{
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        title_normalized: string;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): Promise<{
        hasRelations: boolean;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        title_normalized: string;
    }>;
}
