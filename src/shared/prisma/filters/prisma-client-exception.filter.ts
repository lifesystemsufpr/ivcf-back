import { ArgumentsHost, Catch, HttpStatus } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import { Prisma } from "@prisma/client";
import { Response } from "express";

interface IPrismaErrorShape {
  code: string;
  meta?: { target?: string[] | string };
}

@Catch()
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = exception as IPrismaErrorShape;

      const status = HttpStatus.CONFLICT;

      const target = prismaError.meta?.target;

      if (prismaError.code === "P2002") {
        const targets = Array.isArray(target) ? target : [target];
        const message = targets.includes("email")
          ? "Este e-mail já está cadastrado no sistema."
          : "Já existe um registro com esses dados no sistema.";

        response.status(status).json({
          statusCode: status,
          message: message,
        });
        return;
      }

      if (prismaError.code === "P2025") {
        response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: "Record not found",
        });
        return;
      }
    }

    super.catch(exception, host);
  }
}
