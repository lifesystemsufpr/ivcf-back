import { Scholarship, SocialEconomicLevel } from "@prisma/client";
import { CreateUserDto } from "src/modules/users/dtos/create-user.dto";
declare const CreateParticipantUserDto_base: import("@nestjs/common").Type<Omit<CreateUserDto, "password" | "role">>;
export declare class CreateParticipantUserDto extends CreateParticipantUserDto_base {
}
export declare class CreateParticipantDto {
    user: CreateParticipantUserDto;
    birthday: Date;
    scholarship: Scholarship;
    socio_economic_level: SocialEconomicLevel;
    weight: number;
    height: number;
    zipCode: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
}
export {};
