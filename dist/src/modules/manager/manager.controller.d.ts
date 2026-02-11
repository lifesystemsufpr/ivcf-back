import { ManagerService } from "./manager.service";
import { CreateManagerDto } from "./dto/create-manager.dto";
import { UpdateManagerDto } from "./dto/update-manager.dto";
import { QueryDto } from "src/shared/dto/query.dto";
export declare class ManagerController {
    private readonly managerService;
    constructor(managerService: ManagerService);
    create(createManagerDto: CreateManagerDto): Promise<Omit<{
        id: string;
        cpf: string;
        fullName: string;
        fullName_normalized: string;
        password: string;
        active: boolean;
        gender: import(".prisma/client").$Enums.Gender;
        role: import(".prisma/client").$Enums.SystemRole;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, "password">>;
    findAll(queryDto: QueryDto): Promise<{
        data: {
            id: string;
            cpf: string;
            fullName: string;
            fullName_normalized: string;
            active: boolean;
            gender: import(".prisma/client").$Enums.Gender;
            role: import(".prisma/client").$Enums.SystemRole;
            phone: string | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            pageSize: number;
            lastPage: number;
        };
    }>;
    findByCpf(cpf: string): import(".prisma/client").Prisma.Prisma__UserClient<{
        id: string;
        cpf: string;
        fullName: string;
        fullName_normalized: string;
        password: string;
        active: boolean;
        gender: import(".prisma/client").$Enums.Gender;
        role: import(".prisma/client").$Enums.SystemRole;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
    } | null, null, import("@prisma/client/runtime/client").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(cpf: string, updateManagerDto: UpdateManagerDto): Promise<{
        id: string;
        cpf: string;
        fullName: string;
        fullName_normalized: string;
        password: string;
        active: boolean;
        gender: import(".prisma/client").$Enums.Gender;
        role: import(".prisma/client").$Enums.SystemRole;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(cpf: string): Promise<{
        id: string;
        cpf: string;
        fullName: string;
        fullName_normalized: string;
        password: string;
        active: boolean;
        gender: import(".prisma/client").$Enums.Gender;
        role: import(".prisma/client").$Enums.SystemRole;
        phone: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
