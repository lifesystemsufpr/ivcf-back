import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";

@Injectable()
export class ShareRequestValidator {
  ensureParticipantExists(
    participant: { id: string } | null,
    participantId: string,
  ): asserts participant is { id: string } {
    if (!participant) {
      throw new NotFoundException(
        `Participante ${participantId} não encontrado ou inativo.`,
      );
    }
  }

  ensureBaseExists(
    base: { id: string; active: boolean; ownerProfessional: { id: string } } | null,
    baseId: string,
  ): asserts base is NonNullable<typeof base> {
    if (!base) {
      throw new NotFoundException(`Base histórica ${baseId} não encontrada.`);
    }
  }

  ensureBaseActive(base: { active: boolean }, baseId: string): void {
    if (!base.active) {
      throw new BadRequestException(`A base histórica ${baseId} não está ativa.`);
    }
  }

  ensureNotSelfRequest(
    base: { ownerProfessional: { id: string } },
    requesterProfessionalId: string,
  ): void {
    if (base.ownerProfessional.id === requesterProfessionalId) {
      throw new BadRequestException(
        "Você não pode solicitar o compartilhamento da sua própria base.",
      );
    }
  }

  ensureRequesterIsHealthProfessional(
    professional: { id: string } | null,
  ): asserts professional is { id: string } {
    if (!professional) {
      throw new ForbiddenException(
        "Registro de profissional de saúde não encontrado ou inativo.",
      );
    }
  }

  ensureBaseBelongsToParticipant(
    base: { participantId: string },
    participantId: string,
    baseId: string,
  ): void {
    if (base.participantId !== participantId) {
      throw new BadRequestException(
        `A base histórica ${baseId} não pertence ao participante informado.`,
      );
    }
  }

  ensureIsPending(
    request: { status: string },
    action: string,
  ): void {
    if (request.status !== "PENDING") {
      throw new UnprocessableEntityException(
        `A solicitação não está pendente para ser ${action}.`,
      );
    }
  }

  ensureIsOwner(
    request: { ownerProfessionalId: string },
    professionalId: string,
  ): void {
    if (request.ownerProfessionalId !== professionalId) {
      throw new ForbiddenException(
        "Apenas o dono da base pode executar esta ação.",
      );
    }
  }

  ensureIsRequester(
    request: { requesterProfessionalId: string },
    professionalId: string,
  ): void {
    if (request.requesterProfessionalId !== professionalId) {
      throw new ForbiddenException(
        "Apenas o solicitante pode executar esta ação.",
      );
    }
  }
}
