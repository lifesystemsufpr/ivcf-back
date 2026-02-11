import { CreateResearcherDto } from "./create-researcher.dto";
import { UpdateUserDto } from "src/modules/users/dtos/update-user.dto";
declare const ResearcherDataOnlyDto_base: import("@nestjs/common").Type<Omit<CreateResearcherDto, "user">>;
declare class ResearcherDataOnlyDto extends ResearcherDataOnlyDto_base {
}
declare const UpdateResearcherDto_base: import("@nestjs/common").Type<Partial<ResearcherDataOnlyDto>>;
export declare class UpdateResearcherDto extends UpdateResearcherDto_base {
    user?: UpdateUserDto;
}
export {};
