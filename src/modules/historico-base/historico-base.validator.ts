import { Injectable, NotFoundException } from "@nestjs/common";

@Injectable()
export class HistoricoBaseValidator {
  ensureParticipantExists(
    participant: { id: string } | null,
  ): asserts participant is { id: string } {
    if (!participant) {
      throw new NotFoundException("Participante não encontrado.");
    }
  }
}
