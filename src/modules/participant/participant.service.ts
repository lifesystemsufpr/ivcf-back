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
import { Participant, Prisma, SystemRole, Gender, User } from "@prisma/client";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { BaseService } from "src/shared/services/base.service";
import { Payload } from "src/modules/auth/interfaces/auth.interface";
import {
  FindParticipantQueryDto,
  ParticipantSortField,
  SortDirection,
} from "./dto/find-participant-query.dto";
import { normalizeString } from "src/shared/functions/normalize-string";
import { normalizeEmail } from "src/shared/functions/normalize-email";

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

  async findAll(
    queryDto: FindParticipantQueryDto,
    healthProfessionalId: string,
    rawQuery: Record<string, unknown> = {},
  ) {
    const { page = 1, pageSize = 10, search } = queryDto;

    const where = this.buildWhereFilters(
      rawQuery,
      healthProfessionalId,
      queryDto.active,
      search,
    );
    const orderBy = this.buildOrderBy(queryDto);

    const [participants, total] = await this.prisma.$transaction([
      this.prisma.participant.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: true },
        ...(orderBy ? { orderBy } : {}),
      }),
      this.prisma.participant.count({ where }),
    ]);

    const transformedData = participants.map((participant) =>
      this.transform(participant),
    );

    const dataWithRelations = await Promise.all(
      transformedData.map(async (participant) => {
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
      data: dataWithRelations,
      meta: {
        total,
        page,
        pageSize,
        lastPage: Math.ceil(total / pageSize),
      },
    };
  }

  private buildOrderBy(
    queryDto: FindParticipantQueryDto,
  ): Prisma.ParticipantOrderByWithRelationInput | undefined {
    const { sortField, sortDirection = SortDirection.ASC } = queryDto;

    if (!sortField) {
      return undefined;
    }

    switch (sortField) {
      case ParticipantSortField.FULL_NAME:
        return { user: { fullName: sortDirection } };
      case ParticipantSortField.EMAIL:
        return { user: { email: sortDirection } };
      case ParticipantSortField.CITY:
        return { city: sortDirection };
      case ParticipantSortField.STATE:
        return { state: sortDirection };
      case ParticipantSortField.NEIGHBORHOOD:
        return { neighborhood: sortDirection };
      case ParticipantSortField.BIRTHDAY:
        return { birthday: sortDirection };
      case ParticipantSortField.CREATED_AT:
        return { createdAt: sortDirection };
      case ParticipantSortField.UPDATED_AT:
        return { updatedAt: sortDirection };
      default:
        return undefined;
    }
  }

  private buildWhereFilters(
    rawQuery: Record<string, unknown>,
    healthProfessionalId: string,
    activeFromDto?: boolean,
    search?: string,
  ): Prisma.ParticipantWhereInput {
    const reservedParams = new Set([
      "page",
      "pageSize",
      "search",
      "sortField",
      "sortDirection",
    ]);

    const andFilters: Prisma.ParticipantWhereInput[] = [
      {
        healthProfessionalsLinks: {
          some: { healthProfessionalId },
        },
      },
      { user: { active: true } },
      { active: activeFromDto ?? true },
    ];

    for (const [key, value] of Object.entries(rawQuery)) {
      if (reservedParams.has(key) || value === undefined || value === null) {
        continue;
      }

      const stringValue = String(value).trim();
      if (!stringValue) {
        continue;
      }

      switch (key) {
        case "id":
          andFilters.push({ id: stringValue });
          break;
        case "fullName":
          andFilters.push({
            user: {
              fullName_normalized: {
                contains: normalizeString(stringValue) || "",
                mode: "insensitive",
              },
            },
          });
          break;
        case "email":
          andFilters.push({
            user: {
              email: { contains: stringValue, mode: "insensitive" },
            },
          });
          break;
        case "gender":
          this.assertEnumFilter(
            key,
            stringValue,
            Object.values(Gender) as string[],
          );
          andFilters.push({ gender: stringValue as Gender });
          break;
        case "city":
          andFilters.push({
            city: { contains: stringValue, mode: "insensitive" },
          });
          break;
        case "state":
          andFilters.push({
            state: { contains: stringValue, mode: "insensitive" },
          });
          break;
        case "neighborhood":
          andFilters.push({
            neighborhood: { contains: stringValue, mode: "insensitive" },
          });
          break;
        case "zipCode":
          andFilters.push({
            zipCode: { contains: stringValue, mode: "insensitive" },
          });
          break;
        case "street":
          andFilters.push({
            street: { contains: stringValue, mode: "insensitive" },
          });
          break;
        case "number":
          andFilters.push({
            number: { contains: stringValue, mode: "insensitive" },
          });
          break;
        case "complement":
          andFilters.push({
            complement: { contains: stringValue, mode: "insensitive" },
          });
          break;
        case "weight":
          andFilters.push({
            weight: this.parseIntegerFilter(key, stringValue),
          });
          break;
        case "height":
          andFilters.push({
            height: this.parseIntegerFilter(key, stringValue),
          });
          break;
        case "birthday": {
          const { gte, lt } = this.parseDateRangeFilter(key, stringValue);
          andFilters.push({ birthday: { gte, lt } });
          break;
        }
        case "createdAt": {
          const { gte, lt } = this.parseDateRangeFilter(key, stringValue);
          andFilters.push({ createdAt: { gte, lt } });
          break;
        }
        case "updatedAt": {
          const { gte, lt } = this.parseDateRangeFilter(key, stringValue);
          andFilters.push({ updatedAt: { gte, lt } });
          break;
        }
        case "active":
          andFilters.push({
            active: this.parseBooleanFilter(key, stringValue),
          });
          break;
        default:
          break;
      }
    }

    if (search && search.trim()) {
      const normalizedSearch = normalizeString(search) || "";
      andFilters.push({
        OR: [
          {
            user: {
              fullName_normalized: {
                contains: normalizedSearch,
                mode: "insensitive",
              },
            },
          },
          {
            user: {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
          },
        ],
      });
    }

    return {
      AND: andFilters,
    };
  }

  private parseIntegerFilter(field: string, value: string): number {
    if (!/^-?\d+$/.test(value)) {
      throw new BadRequestException(
        `O filtro '${field}' deve ser um número inteiro válido.`,
      );
    }

    return Number(value);
  }

  private parseBooleanFilter(field: string, value: string): boolean {
    if (value === "true") {
      return true;
    }

    if (value === "false") {
      return false;
    }

    throw new BadRequestException(
      `O filtro '${field}' deve ser 'true' ou 'false'.`,
    );
  }

  private parseDateRangeFilter(
    field: string,
    value: string,
  ): { gte: Date; lt: Date } {
    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException(
        `O filtro '${field}' deve ser uma data válida.`,
      );
    }

    const startOfDay = new Date(parsedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const nextDay = new Date(startOfDay);
    nextDay.setDate(nextDay.getDate() + 1);

    return { gte: startOfDay, lt: nextDay };
  }

  private assertEnumFilter(
    field: string,
    value: string,
    enumValues: string[],
  ): void {
    if (!enumValues.includes(value)) {
      throw new BadRequestException(
        `O filtro '${field}' possui valor inválido.`,
      );
    }
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

  async checkEmail(
    email: string,
  ): Promise<{ userId: string; participantId: string | undefined }> {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
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
