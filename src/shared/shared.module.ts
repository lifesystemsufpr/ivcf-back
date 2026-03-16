import { Module } from "@nestjs/common";
import { HealthcheckController } from "./controllers/healthcheck.controller";
import { TerminusModule } from "@nestjs/terminus";
import { EmailService } from "./services/email.service";

@Module({
  controllers: [HealthcheckController],
  imports: [TerminusModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class SharedModule {}
