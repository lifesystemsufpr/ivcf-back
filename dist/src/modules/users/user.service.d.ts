import { PrismaService } from "src/shared/prisma/prisma.service";
import { CreateUserDto } from "./dtos/create-user.dto";
import { SystemRole, Prisma, User } from "@prisma/client";
import { UpdateUserDto } from "./dtos/update-user.dto";
export declare class UserService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createUser(request: CreateUserDto, tx?: Prisma.TransactionClient): Promise<Omit<User, "password">>;
    findAllByRole(role: SystemRole): Prisma.PrismaPromise<{
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
    }[]>;
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
    update(id: string, updateUserDto: UpdateUserDto, tx?: Prisma.TransactionClient): Promise<{
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
    remove(id: string, tx?: Prisma.TransactionClient): Promise<{
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
