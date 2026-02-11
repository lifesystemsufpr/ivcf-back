import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import { RoleGuard } from "../guards/role-guard.guard";
export default function provideGlobalAppGuards(): ({
    provide: string;
    useClass: typeof JwtAuthGuard;
} | {
    provide: string;
    useClass: typeof RoleGuard;
})[];
