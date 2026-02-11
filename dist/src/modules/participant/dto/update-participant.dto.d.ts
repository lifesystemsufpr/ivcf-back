import { CreateParticipantDto } from "./create-participant.dto";
import { UpdateUserDto } from "src/modules/users/dtos/update-user.dto";
declare const ParticipantDataOnlyDto_base: import("@nestjs/common").Type<Omit<CreateParticipantDto, "user">>;
declare class ParticipantDataOnlyDto extends ParticipantDataOnlyDto_base {
}
declare const UpdateParticipantDto_base: import("@nestjs/common").Type<Partial<ParticipantDataOnlyDto>>;
export declare class UpdateParticipantDto extends UpdateParticipantDto_base {
    user?: UpdateUserDto;
}
export {};
