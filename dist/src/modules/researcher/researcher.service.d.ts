import { CreateResearcherDto } from "./dto/create-researcher.dto";
import { UpdateResearcherDto } from "./dto/update-researcher.dto";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { UserService } from "../users/user.service";
import { Institution, Prisma, Researcher, User } from "@prisma/client";
import { BaseService } from "src/shared/services/base.service";
import { QueryDto } from "src/shared/dto/query.dto";
type ResearcherWithDetails = Researcher & {
    user: User;
    institution: Institution;
};
export type ResearcherResponse = Omit<Researcher, "userId" | "institutionId"> & Omit<User, "password"> & Omit<Institution, "id" | "title"> & {
    institutionName: string;
};
export declare class ResearcherService extends BaseService<Prisma.ResearcherDelegate, ResearcherResponse> {
    protected readonly prisma: PrismaService;
    private readonly userService;
    constructor(prisma: PrismaService, userService: UserService);
    protected transform(researcher: ResearcherWithDetails): ResearcherResponse;
    create(createResearcherDto: CreateResearcherDto): Promise<{
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        fieldOfStudy: string | null;
        institutionId: string;
        cpf: string;
        fullName: string;
        fullName_normalized: string;
        gender: import(".prisma/client").$Enums.Gender;
        role: import(".prisma/client").$Enums.SystemRole;
        phone: string | null;
    }>;
    findAll(queryDto: QueryDto): Promise<{
        data: {
            hasRelations: boolean;
            details: Record<string, number>;
            id: string;
            active: boolean;
            createdAt: Date;
            updatedAt: Date;
            email: string;
            fieldOfStudy: string | null;
            cpf: string;
            fullName: string;
            fullName_normalized: string;
            gender: import(".prisma/client").$Enums.Gender;
            role: import(".prisma/client").$Enums.SystemRole;
            phone: string | null;
            title_normalized: string;
            institutionName: string;
        }[];
        meta: {
            total: number;
            page: number;
            pageSize: number;
            lastPage: number;
        };
    }>;
    findOne(id: string, tx?: Prisma.TransactionClient): Promise<ResearcherResponse>;
    update(id: string, updateResearcherDto: UpdateResearcherDto): Promise<ResearcherResponse>;
    remove(id: string): Promise<{
        hasRelations: boolean;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        fieldOfStudy: string | null;
        cpf: string;
        fullName: string;
        fullName_normalized: string;
        gender: import(".prisma/client").$Enums.Gender;
        role: import(".prisma/client").$Enums.SystemRole;
        phone: string | null;
        title_normalized: string;
        institutionName: string;
    }>;
    reactivate(id: string): Promise<{
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        fieldOfStudy: string | null;
        institutionId: string;
    }>;
    checkDeletability(id: string): Promise<{
        hasRelations: boolean;
        details: Record<string, number>;
    }>;
}
export {};
