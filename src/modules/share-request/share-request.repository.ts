import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/shared/prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class ShareRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findParticipantById(id: string) {
    return this.prisma.participant.findUnique({
      where: { id, active: true },
      select: { id: true },
    });
  }

  async findBaseById(id: string) {
    return this.prisma.historicoBase.findUnique({
      where: { id },
      select: {
        id: true,
        participantId: true,
        active: true,
        ownerProfessional: {
          select: { id: true, user: { select: { id: true } } },
        },
      },
    });
  }

  async findHealthProfessionalById(id: string) {
    return this.prisma.healthProfessional.findUnique({
      where: { id, active: true },
      select: { id: true },
    });
  }

  async findRequestById(id: string) {
    return this.prisma.shareRequest.findUnique({
      where: { id },
      include: {
        sourceHistoricoBase: { select: { id: true, participantId: true } },
        requesterProfessional: {
          select: { id: true, user: { select: { id: true, fullName: true } } },
        },
        ownerProfessional: {
          select: { id: true, user: { select: { id: true, fullName: true } } },
        },
      },
    });
  }

  async listRequests(params: {
    professionalId: string;
    as: "owner" | "requester";
    status?: string;
    page: number;
    limit: number;
  }) {
    const where: Prisma.ShareRequestWhereInput = {
      ...(params.as === "owner"
        ? { ownerProfessionalId: params.professionalId }
        : { requesterProfessionalId: params.professionalId }),
      ...(params.status ? { status: params.status as Prisma.EnumShareRequestStatusFilter["equals"] } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.shareRequest.findMany({
        where,
        select: {
          id: true,
          status: true,
          participantId: true,
          participant: { select: { user: { select: { fullName: true } } } },
          ownerProfessionalId: true,
          ownerProfessional: { select: { user: { select: { fullName: true } } } },
          requesterProfessionalId: true,
          requesterProfessional: { select: { user: { select: { fullName: true } } } },
          sourceHistoricoBaseId: true,
          targetHistoricoBaseId: true,
          snapshotAt: true,
          requestedAt: true,
          respondedAt: true,
        },
        orderBy: { requestedAt: "desc" },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.shareRequest.count({ where }),
    ]);

    return { data, total };
  }

  async approveRequest(requestId: string, ownerProfessionalId: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.shareRequest.findUnique({
        where: { id: requestId },
        include: {
          sourceHistoricoBase: {
            select: { id: true, participantId: true },
          },
          requesterProfessional: {
            select: { id: true, user: { select: { id: true } } },
          },
        },
      });

      if (!request || request.ownerProfessionalId !== ownerProfessionalId) {
        return null;
      }

      if (request.status !== "PENDING") {
        return { status: "not_pending" as const };
      }

      const existingTarget = await tx.historicoBase.findUnique({
        where: {
          participantId_ownerProfessionalId: {
            participantId: request.participantId,
            ownerProfessionalId: request.requesterProfessionalId,
          },
        },
        select: { id: true, active: true },
      });

      const targetBase = existingTarget?.active
        ? existingTarget
        : existingTarget
          ? await tx.historicoBase.update({
              where: { id: existingTarget.id },
              data: { active: true, origin: "COPIED" },
            })
          : await tx.historicoBase.create({
              data: {
                participantId: request.participantId,
                ownerProfessionalId: request.requesterProfessionalId,
                origin: "COPIED",
                active: true,
              },
            });

      await tx.$queryRaw`
        WITH "copied_responses" AS (
          INSERT INTO "questionnaire_response" (
            "id", "totalScore", "classification", "date",
            "historicoBaseId", "participantId", "appliedByProfessionalId",
            "questionnaireId", "sourceResponseId", "createdAt", "updatedAt"
          )
          SELECT
            gen_random_uuid(),
            qr."totalScore",
            qr."classification",
            qr."date",
            ${targetBase.id},
            qr."participantId",
            qr."appliedByProfessionalId",
            qr."questionnaireId",
            qr."id",
            NOW(),
            NOW()
          FROM "questionnaire_response" AS qr
          WHERE qr."historicoBaseId" = ${request.sourceHistoricoBaseId}
            AND qr."date" <= ${request.snapshotAt}
            AND qr."id" NOT IN (
              SELECT "sourceResponseId"
              FROM "questionnaire_response"
              WHERE "historicoBaseId" = ${targetBase.id}
                AND "sourceResponseId" IS NOT NULL
            )
          RETURNING "id", "sourceResponseId"
        )
        INSERT INTO "answer" (
          "id", "questionnaireResponseId", "questionId",
          "selectedOptionId", "valueText"
        )
        SELECT
          gen_random_uuid(),
          cr."id",
          a."questionId",
          a."selectedOptionId",
          a."valueText"
        FROM "answer" AS a
        INNER JOIN "copied_responses" AS cr
          ON cr."sourceResponseId" = a."questionnaireResponseId"
      `;

      await tx.shareRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          targetHistoricoBaseId: targetBase.id,
          respondedAt: new Date(),
        },
      });

      await tx.historicoBase.update({
        where: { id: targetBase.id },
        data: { updatedAt: new Date() },
      });

      await tx.notification.create({
        data: {
          recipientUserId: request.requesterProfessional.user.id,
          type: "SHARE_REQUEST_APPROVED",
          title: "Solicitação de compartilhamento aprovada",
          body: `O profissional aprovou sua solicitação. O histórico foi copiado para sua base.`,
          shareRequestId: requestId,
          entityType: "ShareRequest",
          entityId: requestId,
        },
      });

      return { status: "approved" as const, targetBaseId: targetBase.id };
    });
  }

  async rejectRequest(requestId: string, ownerProfessionalId: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.shareRequest.findUnique({
        where: { id: requestId },
        select: {
          id: true,
          status: true,
          ownerProfessionalId: true,
          requesterProfessional: {
            select: { user: { select: { id: true } } },
          },
        },
      });

      if (!request || request.ownerProfessionalId !== ownerProfessionalId) {
        return null;
      }

      if (request.status !== "PENDING") {
        return { status: "not_pending" as const };
      }

      await tx.shareRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED", respondedAt: new Date() },
      });

      await tx.notification.create({
        data: {
          recipientUserId: request.requesterProfessional.user.id,
          type: "SHARE_REQUEST_REJECTED",
          title: "Solicitação de compartilhamento recusada",
          body: `O profissional recusou sua solicitação de compartilhamento.`,
          shareRequestId: requestId,
          entityType: "ShareRequest",
          entityId: requestId,
        },
      });

      return { status: "rejected" as const };
    });
  }

  async cancelRequest(requestId: string, requesterProfessionalId: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.shareRequest.findUnique({
        where: { id: requestId },
        select: { id: true, status: true, requesterProfessionalId: true },
      });

      if (!request || request.requesterProfessionalId !== requesterProfessionalId) {
        return null;
      }

      if (request.status !== "PENDING") {
        return { status: "not_pending" as const };
      }

      await tx.shareRequest.update({
        where: { id: requestId },
        data: { status: "CANCELLED" },
      });

      return { status: "cancelled" as const };
    });
  }

  async createRequestWithNotification(params: {
    participantId: string;
    requesterProfessionalId: string;
    sourceHistoricoBaseId: string;
  }): Promise<
    | { shareRequestId: string }
    | "duplicate"
    | "base_inactive"
    | "wrong_participant"
  > {
    return this.prisma.$transaction(async (tx) => {
      const base = await tx.historicoBase.findUnique({
        where: { id: params.sourceHistoricoBaseId, active: true },
        select: {
          id: true,
          participantId: true,
          ownerProfessional: {
            select: { id: true, user: { select: { id: true } } },
          },
        },
      });

      if (!base) {
        return "base_inactive" as const;
      }

      if (base.participantId !== params.participantId) {
        return "wrong_participant" as const;
      }

      const existing = await tx.shareRequest.findFirst({
        where: {
          requesterProfessionalId: params.requesterProfessionalId,
          sourceHistoricoBaseId: params.sourceHistoricoBaseId,
          status: "PENDING",
        },
      });

      if (existing) {
        return "duplicate" as const;
      }

      const request = await tx.shareRequest.create({
        data: {
          participant: { connect: { id: params.participantId } },
          requesterProfessional: {
            connect: { id: params.requesterProfessionalId },
          },
          ownerProfessional: {
            connect: { id: base.ownerProfessional.id },
          },
          sourceHistoricoBase: {
            connect: { id: params.sourceHistoricoBaseId },
          },
          snapshotAt: new Date(),
        },
      });

      await tx.notification.create({
        data: {
          recipientUserId: base.ownerProfessional.user.id,
          type: "SHARE_REQUEST_RECEIVED",
          title: "Nova solicitação de compartilhamento",
          body: `Um profissional solicitou acesso ao histórico do participante.`,
          shareRequestId: request.id,
          entityType: "ShareRequest",
          entityId: request.id,
        },
      });

      return { shareRequestId: request.id };
    });
  }
}
