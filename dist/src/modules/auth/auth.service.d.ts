import { JwtService } from "@nestjs/jwt";
import { AccessToken, Payload } from "./interfaces/auth.interface";
import { User } from "@prisma/client";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService);
    validateCredentials(cpf: string, password: string): Promise<Partial<User> | null>;
    signIn(user: Payload, keepMeLoggedIn?: boolean): Promise<AccessToken>;
    validateRefreshToken(token: string): Promise<{
        user: Payload;
        persistent: boolean;
    }>;
    getUserFromId(id: string): Promise<Payload | null>;
}
