import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { LeadStatus } from "@prisma/client";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { UpdateLeadDto } from "./dto/update-lead.dto";
import { LeadsService } from "./leads.service";

@UseGuards(JwtAuthGuard)
@Controller("leads")
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  findAll(
    @CurrentUser() user: { sub: string },
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("search") search?: string,
    @Query("status") status?: LeadStatus
  ) {
    return this.leadsService.findAll(user.sub, Number(page || 1), Number(pageSize || 10), search || "", status);
  }

  @Post()
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(user.sub, dto);
  }

  @Patch(":id")
  update(@CurrentUser() user: { sub: string }, @Param("id") id: string, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(user.sub, id, dto);
  }

  @Delete(":id")
  delete(@CurrentUser() user: { sub: string }, @Param("id") id: string) {
    return this.leadsService.delete(user.sub, id);
  }
}
