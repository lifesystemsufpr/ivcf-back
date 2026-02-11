import { CreateHealthProfessionalDto } from "./dto/create-health-professional.dto";
import { UpdateHealthProfessionalDto } from "./dto/update-health-professional.dto";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { UserService } from "../users/user.service";
import { HealthProfessional, Prisma, User } from "@prisma/client";
import { BaseService } from "src/shared/services/base.service";
import { QueryDto } from "src/shared/dto/query.dto";
type HealthProfessionalWithUser = HealthProfessional & {
    user: User;
};
export type HealthProfessionalResponse = Omit<HealthProfessionalWithUser, "user"> & Omit<User, "password">;
export declare class HealthProfessionalService extends BaseService<Prisma.HealthProfessionalDelegate, HealthProfessionalResponse> {
    protected readonly prisma: PrismaService;
    private readonly userService;
    constructor(prisma: PrismaService, userService: UserService);
    protected transform(healthProfessional: HealthProfessionalWithUser): HealthProfessionalResponse;
    create(createHealthProfessionalDto: CreateHealthProfessionalDto): Promise<{
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        speciality: string;
        speciality_normalized: string;
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
            speciality: string;
            speciality_normalized: string;
            cpf: string;
            fullName: string;
            fullName_normalized: string;
            gender: import(".prisma/client").$Enums.Gender;
            role: import(".prisma/client").$Enums.SystemRole;
            phone: string | null;
        }[];
        meta: {
            total: number;
            page: number;
            pageSize: number;
            lastPage: number;
        };
    }>;
    findOne(id: string, tx?: Prisma.TransactionClient): Promise<HealthProfessionalResponse>;
    update(id: string, updateHealthProfessionalDto: UpdateHealthProfessionalDto): Promise<HealthProfessionalResponse>;
    remove(id: string): Promise<{
        hasRelations: boolean;
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        speciality: string;
        speciality_normalized: string;
        cpf: string;
        fullName: string;
        fullName_normalized: string;
        gender: import(".prisma/client").$Enums.Gender;
        role: import(".prisma/client").$Enums.SystemRole;
        phone: string | null;
    }>;
    reactivate(id: string): Promise<{
        id: string;
        active: boolean;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        speciality: string;
        speciality_normalized: string;
    }>;
    checkDeletability(id: string): Promise<{
        hasRelations: boolean;
        details: Record<string, number>;
    }>;
}
export {};
