import { ConflictException, Injectable } from "@nestjs/common";
import { HistoricoBaseRepository } from "./historico-base.repository";
import { HistoricoBaseValidator } from "./historico-base.validator";
import type { HistoricoBaseListResponseDto } from "./dto/historico-base-response.dto";
import type { HistoricoBaseCreateResponseDto } from "./dto/historico-base-response.dto";

@Injectable()
export class HistoricoBaseService {
  constructor(
    private readonly repo: HistoricoBaseRepository,
    private readonly validator: HistoricoBaseValidator,
  ) {}

  async list(
    professionalId: string,
    participantId: string,
  ): Promise<HistoricoBaseListResponseDto> {
    const participant = await this.repo.findParticipantById(participantId);
    this.validator.ensureParticipantExists(participant);

    const bases = await this.repo.findBasesByParticipant(participantId);

    const items = bases.map((b) => ({
      id: b.id,
      origin: b.origin,
      createdAt: b.createdAt.toISOString(),
      responsesCount: b._count.responses,
      isCurrentUserOwner: b.ownerProfessionalId === professionalId,
      owner: {
        id: b.ownerProfessional.id,
        name: b.ownerProfessional.user.fullName,
        specialty: b.ownerProfessional.speciality,
      },
    }));

    return {
      hasOwnBase: items.some((i) => i.isCurrentUserOwner),
      bases: items,
    };
  }

  async create(
    professionalId: string,
    participantId: string,
  ): Promise<HistoricoBaseCreateResponseDto> {
    const participant = await this.repo.findParticipantById(participantId);
    this.validator.ensureParticipantExists(participant);

    const result = await this.repo.upsertBase(participantId, professionalId);

    if (result.status === "conflict") {
      throw new ConflictException(
        "O profissional já possui uma base ativa para este participante.",
      );
    }

    const base = result.base;

    return {
      id: base.id,
      origin: base.origin,
      active: base.active,
      participantId: base.participantId,
      ownerProfessionalId: base.ownerProfessionalId,
      createdAt: base.createdAt.toISOString(),
    };
  }
}
