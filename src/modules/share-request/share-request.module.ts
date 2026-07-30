import { Module } from "@nestjs/common";
import { ShareRequestController } from "./share-request.controller";
import { ShareRequestService } from "./share-request.service";
import { ShareRequestRepository } from "./share-request.repository";
import { ShareRequestValidator } from "./share-request.validator";
import { PrismaModule } from "src/shared/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ShareRequestController],
  providers: [ShareRequestService, ShareRequestRepository, ShareRequestValidator],
})
export class ShareRequestModule {}
