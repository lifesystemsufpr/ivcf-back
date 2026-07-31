import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class HistoricoBaseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findParticipantById(id: string) {
    return this.prisma.participant.findUnique({
      where: { id, active: true },
      select: { id: true },
    });
  }

  async findBasesByParticipant(participantId: string) {
    return this.prisma.historicoBase.findMany({
      where: { participantId, active: true },
      select: {
        id: true,
        origin: true,
        createdAt: true,
        ownerProfessionalId: true,
        ownerProfessional: {
          select: {
            id: true,
            speciality: true,
            user: { select: { fullName: true } },
          },
        },
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Baguio eh atomico 😳; checa ate mesmo por exceções de banco pq vai que ne
  async upsertBase(participantId: string, ownerProfessionalId: string) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.historicoBase.findUnique({
        where: {
          participantId_ownerProfessionalId: {
            participantId,
            ownerProfessionalId,
          },
        },
        select: { id: true, active: true },
      });

      if (existing?.active) {
        return { status: "conflict" as const };
      }

      try {
        const base = existing
          ? await tx.historicoBase.update({
              where: { id: existing.id },
              data: { active: true, origin: "FROM_SCRATCH" },
            })
          : await tx.historicoBase.create({
              data: {
                participantId,
                ownerProfessionalId,
                origin: "FROM_SCRATCH",
                active: true,
              },
            });

        return { status: "created" as const, base };
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002"
        ) {
          return { status: "conflict" as const };
        }
        throw err;
      }
    });
  }
}
