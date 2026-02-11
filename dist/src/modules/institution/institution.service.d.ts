import { CreateInstitutionDto } from "./dto/create-institution.dto";
import { UpdateInstitutionDto } from "./dto/update-institution.dto";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { FindInstitutionsQueryDto } from "./dto/find-institution-query.dto";
export declare class InstitutionService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createInstitutionDto: CreateInstitutionDto): Prisma.Prisma__InstitutionClient<{
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        title_normalized: string;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, Prisma.PrismaClientOptions>;
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
    findOne(id: string): Prisma.Prisma__InstitutionClient<{
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        title_normalized: string;
    } | null, null, import("@prisma/client/runtime/client").DefaultArgs, Prisma.PrismaClientOptions>;
    update(id: string, updateInstitutionDto: UpdateInstitutionDto): Prisma.Prisma__InstitutionClient<{
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        title_normalized: string;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, Prisma.PrismaClientOptions>;
    remove(id: string): Promise<{
        hasRelations: boolean;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        title_normalized: string;
    }>;
    reactivate(id: string): Promise<{
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        title_normalized: string;
    }>;
    checkDeletability(id: string): Promise<{
        hasRelations: boolean;
        details: Record<string, number>;
    }>;
}
