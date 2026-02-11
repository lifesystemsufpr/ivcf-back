import { CreateHealthProfessionalDto } from "./create-health-professional.dto";
import { UpdateUserDto } from "src/modules/users/dtos/update-user.dto";
declare const HealthProfessionalDataOnly_base: import("@nestjs/common").Type<Omit<CreateHealthProfessionalDto, "user">>;
declare class HealthProfessionalDataOnly extends HealthProfessionalDataOnly_base {
}
declare const UpdateHealthProfessionalDto_base: import("@nestjs/common").Type<Partial<HealthProfessionalDataOnly>>;
export declare class UpdateHealthProfessionalDto extends UpdateHealthProfessionalDto_base {
    user?: UpdateUserDto;
}
export {};
