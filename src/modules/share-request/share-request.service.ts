import { Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { ShareRequestRepository } from "./share-request.repository";
import { ShareRequestValidator } from "./share-request.validator";
import type { CreateShareRequestDto } from "./dto/create-share-request.dto";
import type { BatchShareRequestResponseDto } from "./dto/batch-share-request-response.dto";
import type {
  ListShareRequestsQueryDto,
  ListShareRequestsResponseDto,
} from "./dto/list-share-requests.dto";

type BatchItem = {
  sourceHistoricoBaseId: string;
  shareRequestId?: string;
  reason?: string;
};

@Injectable()
export class ShareRequestService {
  constructor(
    private readonly repo: ShareRequestRepository,
    private readonly validator: ShareRequestValidator,
  ) {}

  async create(
    requesterProfessionalId: string,
    dto: CreateShareRequestDto,
  ): Promise<BatchShareRequestResponseDto> {
    const professional = await this.repo.findHealthProfessionalById(
      requesterProfessionalId,
    );
    this.validator.ensureRequesterIsHealthProfessional(professional);

    const participant = await this.repo.findParticipantById(dto.participantId);
    this.validator.ensureParticipantExists(participant, dto.participantId);

    const created: BatchItem[] = [];
    const skipped: BatchItem[] = [];
    const blocked: BatchItem[] = [];

    for (const baseId of dto.sourceHistoricoBaseIds) {
      const base = await this.repo.findBaseById(baseId);

      try {
        this.validator.ensureBaseExists(base, baseId);
        this.validator.ensureBaseActive(base, baseId);
        this.validator.ensureBaseBelongsToParticipant(
          base,
          dto.participantId,
          baseId,
        );
        this.validator.ensureNotSelfRequest(base, requesterProfessionalId);
      } catch (err: unknown) {
        blocked.push({
          sourceHistoricoBaseId: baseId,
          reason: (err as Error).message,
        });
        continue;
      }

      try {
        const result = await this.repo.createRequestWithNotification({
          participantId: dto.participantId,
          requesterProfessionalId,
          sourceHistoricoBaseId: baseId,
        });

        if (result === "base_inactive") {
          blocked.push({
            sourceHistoricoBaseId: baseId,
            reason: "A base foi desativada durante o processamento.",
          });
        } else if (result === "wrong_participant") {
          blocked.push({
            sourceHistoricoBaseId: baseId,
            reason: "A base não pertence ao participante informado.",
          });
        } else if (result === "duplicate") {
          skipped.push({
            sourceHistoricoBaseId: baseId,
            reason: "Já existe uma solicitação pendente para esta base.",
          });
        } else {
          created.push({
            sourceHistoricoBaseId: baseId,
            shareRequestId: result.shareRequestId,
          });
        }
      } catch (err: unknown) {
        blocked.push({
          sourceHistoricoBaseId: baseId,
          reason: (err as Error).message,
        });
      }
    }

    return {
      created,
      skipped,
      blocked,
      counts: {
        created: created.length,
        skipped: skipped.length,
        blocked: blocked.length,
      },
    };
  }

  async list(
    professionalId: string,
    query: ListShareRequestsQueryDto,
  ): Promise<ListShareRequestsResponseDto> {
    const { as, status, page = 1, limit = 10 } = query;

    const { data, total } = await this.repo.listRequests({
      professionalId,
      as,
      status,
      page,
      limit,
    });

    return {
      data: data.map((r) => ({
        id: r.id,
        status: r.status,
        participantId: r.participantId,
        participantName: r.participant.user.fullName,
        ownerProfessionalId: r.ownerProfessionalId,
        ownerName: r.ownerProfessional.user.fullName,
        requesterProfessionalId: r.requesterProfessionalId,
        requesterName: r.requesterProfessional.user.fullName,
        sourceHistoricoBaseId: r.sourceHistoricoBaseId,
        targetHistoricoBaseId: r.targetHistoricoBaseId ?? undefined,
        snapshotAt: r.snapshotAt.toISOString(),
        requestedAt: r.requestedAt.toISOString(),
        respondedAt: r.respondedAt?.toISOString(),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async approve(professionalId: string, requestId: string) {
    const request = await this.repo.findRequestById(requestId);
    if (!request) {
      throw new NotFoundException("Solicitação não encontrada.");
    }

    this.validator.ensureIsOwner(request, professionalId);
    this.validator.ensureIsPending(request, "aprovada");

    const result = await this.repo.approveRequest(requestId, professionalId);

    if (!result) {
      throw new NotFoundException("Solicitação não encontrada.");
    }

    if (result.status === "not_pending") {
      throw new UnprocessableEntityException(
        "A solicitação não está pendente para ser aprovada.",
      );
    }

    return { status: "approved", targetBaseId: result.targetBaseId };
  }

  async reject(professionalId: string, requestId: string) {
    const request = await this.repo.findRequestById(requestId);
    if (!request) {
      throw new NotFoundException("Solicitação não encontrada.");
    }

    this.validator.ensureIsOwner(request, professionalId);
    this.validator.ensureIsPending(request, "rejeitada");

    const result = await this.repo.rejectRequest(requestId, professionalId);

    if (!result) {
      throw new NotFoundException("Solicitação não encontrada.");
    }

    if (result.status === "not_pending") {
      throw new UnprocessableEntityException(
        "A solicitação não está pendente para ser rejeitada.",
      );
    }

    return { status: "rejected" };
  }

  async cancel(professionalId: string, requestId: string) {
    const request = await this.repo.findRequestById(requestId);
    if (!request) {
      throw new NotFoundException("Solicitação não encontrada.");
    }

    this.validator.ensureIsRequester(request, professionalId);
    this.validator.ensureIsPending(request, "cancelada");

    const result = await this.repo.cancelRequest(requestId, professionalId);

    if (!result) {
      throw new NotFoundException("Solicitação não encontrada.");
    }

    if (result.status === "not_pending") {
      throw new UnprocessableEntityException(
        "Não é possível cancelar uma solicitação que já foi respondida.",
      );
    }

    return { status: "cancelled" };
  }
}
