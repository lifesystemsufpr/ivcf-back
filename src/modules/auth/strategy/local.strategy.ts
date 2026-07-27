import { Strategy } from "passport-local";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../auth.service";
import { Payload } from "../interfaces/auth.interface";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: "email",
    });
  }

  async validate(email: string, password: string): Promise<Payload> {
    const user = await this.authService.validateCredentials(email, password);

    if (!user) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    return user as Payload;
  }
}
