import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  ExecutionContext,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Payload } from "../interfaces/auth.interface";

@Injectable()
export class LocalAuthGuard extends AuthGuard("local") {
  private readonly logger = new Logger(LocalAuthGuard.name);

  handleRequest<TUser = Payload>(
    err: Error | UnauthorizedException | null,
    user: TUser,
    info: Record<string, any>,
    _context: ExecutionContext,
    _status?: any,
  ): TUser {
    if (err || !user) {
      const errorMessage: string =
        (typeof info?.message === "string" && info?.message) ||
        (err &&
          typeof (err as Error).message === "string" &&
          (err as Error).message) ||
        "Authentication failed";

      this.logger.error(
        `Authentication failed: ${errorMessage}`,
        err && (err as Error).stack,
      );

      if (info?.message === "Missing credentials") {
        throw new BadRequestException({
          statusCode: 400,
          message: "Campos obrigatórios ausentes ou incorretos.",
          error: "Bad Request",
        });
      }

      throw err instanceof UnauthorizedException
        ? err
        : new UnauthorizedException({
            statusCode: 401,
            message: errorMessage,
            error: "Unauthorized",
          });
    }

    return user;
  }
}
