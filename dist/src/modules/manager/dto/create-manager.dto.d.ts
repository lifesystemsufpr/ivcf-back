import { CreateUserDto } from "src/modules/users/dtos/create-user.dto";
declare const CreateManagerDto_base: import("@nestjs/common").Type<Omit<CreateUserDto, "role">>;
export declare class CreateManagerDto extends CreateManagerDto_base {
}
export {};
