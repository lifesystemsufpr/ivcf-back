import { Gender, SystemRole } from "@prisma/client";
export declare class CreateUserDto {
    cpf: string;
    fullName: string;
    phone?: string;
    gender: Gender;
    role: SystemRole;
    password: string;
    active?: any;
}
