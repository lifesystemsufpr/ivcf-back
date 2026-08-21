import { Module } from "@nestjs/common";
import { HistoricoBaseController } from "./historico-base.controller";
import { HistoricoBaseService } from "./historico-base.service";
import { HistoricoBaseRepository } from "./historico-base.repository";
import { HistoricoBaseValidator } from "./historico-base.validator";
import { PrismaModule } from "src/shared/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [HistoricoBaseController],
  providers: [HistoricoBaseService, HistoricoBaseRepository, HistoricoBaseValidator],
})
export class HistoricoBaseModule {}
