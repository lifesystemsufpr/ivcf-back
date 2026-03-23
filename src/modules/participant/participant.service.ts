import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateParticipantDto } from "./dto/create-participant.dto";
import { UpdateParticipantDto } from "./dto/update-participant.dto";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { UserService } from "../users/user.service";
import { Participant, Prisma, SystemRole, User } from "@prisma/client";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { BaseService } from "src/shared/services/base.service";
import { QueryDto } from "src/shared/dto/query.dto";
import { Payload } from "src/modules/auth/interfaces/auth.interface";

type ParticipantWithUser = Participant & { user: User };
export type ParticipantResponse = Omit<ParticipantWithUser, "user"> &
  Omit<User, "password">;

@Injectable()
export class ParticipantService extends BaseService<
  Prisma.ParticipantDelegate,
  ParticipantResponse
> {
  constructor(
    protected readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {
    super(prisma, prisma.participant, ["user.fullName", "user.email"], {
      user: true,
    });
  }

  protected transform(participant: ParticipantWithUser): ParticipantResponse {
    const { password: _password, ...userData } = participant.user;
    const { user: _user, ...participantData } = participant;
    return {
      ...participantData,
      ...userData,
    };
  }

  async create(
    createParticipantDto: CreateParticipantDto,
    healthProfessionalId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const {
        user: userData,
        birthday,
        ...participantData
      } = createParticipantDto;
      const timeZone = "America/Sao_Paulo";
      const dateString = new Date(birthday).toISOString().split("T")[0];
      const correctDate = fromZonedTime(dateString, timeZone);
      const password = formatInTimeZone(correctDate, timeZone, "ddMMyyyy");
      const user = await this.userService.createUser(
        {
          ...userData,
          password: password,
          role: SystemRole.PARTICIPANT,
        },
        tx,
      );

      const participant = await tx.participant.create({
        data: {
          ...participantData,
          birthday,
          id: user.id,
          healthProfessionalsLinks: {
            create: {
              healthProfessionalId,
            },
          },
        },
      });

      return { ...user, ...participant };
    });
  }
  async findAll(queryDto: QueryDto, healthProfessionalId: string) {
    const customWhere = {
      active: true,
      user: { active: true },
      healthProfessionalsLinks: {
        some: { healthProfessionalId },
      },
    };

    console.time("findAll-prisma-query");
    const result = await super.findAll(queryDto, customWhere);
    console.timeEnd("findAll-prisma-query");

    const dataWithRelations = await Promise.all(
      result.data.map(async (participant, index) => {
        try {
          const safetyInfo = await this.checkDeletability(participant.id);

          return {
            ...participant,
            hasRelations: safetyInfo.hasRelations,
            relationsDetails: safetyInfo.details,
          };
        } catch (error) {
          console.error(
            `[SERVICE] Falha ao processar relações do ID ${participant.id}:`,
            error,
          );
          return participant;
        }
      }),
    );

    return {
      ...result,
      data: dataWithRelations,
    };
  }

  async findOne(
    id: string,
    options?: {
      tx?: Prisma.TransactionClient;
      requestUser?: Payload;
    },
  ): Promise<ParticipantResponse> {
    const prismaClient = options?.tx || this.prisma;
    const requestUser = options?.requestUser;
    const where: Prisma.ParticipantWhereInput = {
      id,
      active: true,
      user: { active: true },
    };

    if (requestUser?.role === SystemRole.HEALTH_PROFESSIONAL) {
      where.healthProfessionalsLinks = {
        some: { healthProfessionalId: requestUser.id },
      };
    }

    if (requestUser?.role === SystemRole.PARTICIPANT && requestUser.id !== id) {
      throw new ForbiddenException(
        "Acesso não autorizado para este participante.",
      );
    }

    const participantWithUser = await prismaClient.participant.findFirstOrThrow(
      {
        where,
        include: { user: true },
      },
    );

    return this.transform(participantWithUser);
  }

  async update(
    id: string,
    updateParticipantDto: UpdateParticipantDto,
    requestUser: Payload,
  ) {
    try {
      await this.findOne(id, { requestUser });
      let hasEffectiveChanges = false;
      const timeZone = "America/Sao_Paulo";

      return await this.prisma.$transaction(async (tx) => {
        const { user: userData, ...participantData } = updateParticipantDto;
        let newPassword: string | undefined = undefined;

        if (participantData && participantData.birthday) {
          const dateString = new Date(participantData.birthday)
            .toISOString()
            .split("T")[0];
          const correctDate = fromZonedTime(dateString, timeZone);
          newPassword = formatInTimeZone(correctDate, timeZone, "ddMMyyyy");
        }

        if (userData && Object.keys(userData).length > 0) {
          delete userData.password;

          if (newPassword) {
            userData.password = newPassword;
          }

          if (Object.keys(userData).length > 0) {
            await this.userService.update(id, userData, tx);
            hasEffectiveChanges = true;
          }
        } else if (newPassword) {
          await this.userService.update(id, { password: newPassword }, tx);
          hasEffectiveChanges = true;
        }

        if (participantData && Object.keys(participantData).length > 0) {
          await tx.participant.update({
            where: { id },
            data: participantData,
          });
          hasEffectiveChanges = true;
        }

        if (!hasEffectiveChanges) {
          throw new BadRequestException(
            "Nenhum campo válido para atualização foi fornecido.",
          );
        }

        return this.findOne(id, { tx, requestUser });
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException(
          `Paciente com o ID '${id}' não encontrado.`,
        );
      }
      throw error;
    }
  }

  async remove(id: string, requestUser: Payload) {
    await this.findOne(id, { requestUser });
    const relationInfo = await this.checkDeletability(id);

    try {
      const deactivatedParticipant = await this.prisma.$transaction(
        async (tx) => {
          const participant = await tx.participant.update({
            where: { id },
            data: { active: false },
            include: { user: true },
          });

          await tx.user.update({
            where: { id },
            data: { active: false },
          });

          return participant;
        },
      );

      const responseData = this.transform(deactivatedParticipant);

      return {
        ...responseData,
        hasRelations: relationInfo.hasRelations,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException(
          `Participante com ID '${id}' não encontrado.`,
        );
      }
      throw error;
    }
  }

  async reactivate(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const participant = await tx.participant.update({
        where: { id },
        data: { active: true },
      });

      await this.userService.update(id, { active: true }, tx);

      return participant;
    });
  }

  async checkDeletability(id: string) {
    return await this.prisma.checkDeletionSafety("Participant", id);
  }

  async checkEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        participant: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException({ message: "Email not found" });
    }

    return { userId: user.id, participantId: user.participant?.id };
  }
}
