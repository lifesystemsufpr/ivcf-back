import { HealthProfessionalService } from "./health-professional.service";
import { CreateHealthProfessionalDto } from "./dto/create-health-professional.dto";
import { UpdateHealthProfessionalDto } from "./dto/update-health-professional.dto";
import { QueryDto } from "src/shared/dto/query.dto";
export declare class HealthProfessionalController {
    private readonly healthProfessionalService;
    constructor(healthProfessionalService: HealthProfessionalService);
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
    findOne(id: string): Promise<import("./health-professional.service").HealthProfessionalResponse>;
    update(id: string, updateHealthProfessionalDto: UpdateHealthProfessionalDto): Promise<import("./health-professional.service").HealthProfessionalResponse>;
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
}
