import { AuthService } from "./auth.service";
import { Payload } from "./interfaces/auth.interface";
import { LoginDto } from "./dto/login.dto";
import { Response, Request } from "express";
import { ConfigService } from "@nestjs/config";
export declare class AuthController {
    private readonly authService;
    private readonly configService;
    constructor(authService: AuthService, configService: ConfigService);
    login(user: Payload, loginDto: LoginDto, res: Response): Promise<{
        access_token: string;
    }>;
    refresh(req: Request, res: Response): Promise<{
        access_token: string;
    }>;
}
