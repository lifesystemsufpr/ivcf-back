import { CreateUserDto } from "src/modules/users/dtos/create-user.dto";
declare const CreateResearcherUserDto_base: import("@nestjs/common").Type<Omit<CreateUserDto, "role">>;
export declare class CreateResearcherUserDto extends CreateResearcherUserDto_base {
}
export declare class CreateResearcherDto {
    user: CreateResearcherUserDto;
    email: string;
    fieldOfStudy?: string;
    institutionId: string;
}
export {};
