import { ResearcherService } from "./researcher.service";
import { CreateResearcherDto } from "./dto/create-researcher.dto";
import { UpdateResearcherDto } from "./dto/update-researcher.dto";
import { QueryDto } from "src/shared/dto/query.dto";
export declare class ResearcherController {
    private readonly researcherService;
    constructor(researcherService: ResearcherService);
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
    findOne(id: string): Promise<import("./researcher.service").ResearcherResponse>;
    update(id: string, updateResearcherDto: UpdateResearcherDto): Promise<import("./researcher.service").ResearcherResponse>;
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
}
