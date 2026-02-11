import { CreateUserDto } from "src/modules/users/dtos/create-user.dto";
declare const CreateHealthProfessionalUserDto_base: import("@nestjs/common").Type<Omit<CreateUserDto, "role">>;
export declare class CreateHealthProfessionalUserDto extends CreateHealthProfessionalUserDto_base {
}
export declare class CreateHealthProfessionalDto {
    user: CreateHealthProfessionalUserDto;
    speciality: string;
    email: string;
}
export {};
