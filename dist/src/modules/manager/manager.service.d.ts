import { UserService } from "../users/user.service";
import { CreateManagerDto } from "./dto/create-manager.dto";
import { UpdateManagerDto } from "./dto/update-manager.dto";
import { Prisma, User } from "@prisma/client";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { QueryDto } from "src/shared/dto/query.dto";
type ManagerResponse = Omit<User, "password">;
export declare class ManagerService {
    private readonly userService;
    private readonly prisma;
    constructor(userService: UserService, prisma: PrismaService);
    private transform;
    create(request: CreateManagerDto): Promise<Omit<{
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
        data: ManagerResponse[];
        meta: {
            total: number;
            page: number;
            pageSize: number;
            lastPage: number;
        };
    }>;
    findOne(id: string): Prisma.Prisma__UserClient<{
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
    } | null, null, import("@prisma/client/runtime/client").DefaultArgs, Prisma.PrismaClientOptions>;
    findByCpf(cpf: string): Prisma.Prisma__UserClient<{
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
    } | null, null, import("@prisma/client/runtime/client").DefaultArgs, Prisma.PrismaClientOptions>;
    update(id: string, updateUserDto: UpdateManagerDto): Promise<{
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
    remove(id: string): Promise<{
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
export {};
