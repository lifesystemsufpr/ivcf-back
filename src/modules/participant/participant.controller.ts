import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { ParticipantService } from "./participant.service";
import { CreateParticipantDto } from "./dto/create-participant.dto";
import { UpdateParticipantDto } from "./dto/update-participant.dto";
import { ApiBearerAuth, ApiNoContentResponse } from "@nestjs/swagger";
import { Roles } from "../auth/decorators/roles.decorator";
import { SystemRole } from "@prisma/client";
import { QueryDto } from "src/shared/dto/query.dto";
import { RequestUser } from "../auth/decorators/request-user.decorator";
import { Payload } from "../auth/interfaces/auth.interface";

@Controller("participant")
export class ParticipantController {
  constructor(private readonly participantService: ParticipantService) {}

  @Roles([SystemRole.HEALTH_PROFESSIONAL])
  @Post()
  create(
    @RequestUser() user: Payload,
    @Body() createParticipantDto: CreateParticipantDto,
  ) {
    return this.participantService.create(createParticipantDto, user.id);
  }

  @Roles([SystemRole.HEALTH_PROFESSIONAL])
  @Get()
  findAll(@RequestUser() user: Payload, @Query() queryDto: QueryDto) {
    return this.participantService.findAll(queryDto, user.id);
  }

  @Roles([SystemRole.PARTICIPANT, SystemRole.HEALTH_PROFESSIONAL])
  @Get(":id")
  findOne(@RequestUser() user: Payload, @Param("id") id: string) {
    return this.participantService.findOne(id, { requestUser: user });
  }

  @Roles([SystemRole.HEALTH_PROFESSIONAL])
  @Patch(":id")
  @ApiNoContentResponse()
  update(
    @RequestUser() user: Payload,
    @Param("id") id: string,
    @Body() updateParticipantDto: UpdateParticipantDto,
  ) {
    return this.participantService.update(id, updateParticipantDto, user);
  }

  @Roles([SystemRole.HEALTH_PROFESSIONAL])
  @Delete(":id")
  @ApiNoContentResponse()
  remove(@RequestUser() user: Payload, @Param("id") id: string) {
    return this.participantService.remove(id, user);
  }

  @Roles([SystemRole.HEALTH_PROFESSIONAL])
  @Get("check-email/:email")
  checkEmail(@RequestUser() user: Payload, @Param("email") email: string) {
    return this.participantService.checkEmail(email);
  }
}
