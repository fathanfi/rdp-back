import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { LeadStatus, Prisma, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { UpdateLeadDto } from "./dto/update-lead.dto";

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, page = 1, pageSize = 10, search = "", status?: LeadStatus) {
    const where: Prisma.LeadWhereInput = {
      createdBy: userId,
      ...(status ? { status } : {}),
      OR: search
        ? [{ name: { contains: search, mode: "insensitive" as const } }, { email: { contains: search, mode: "insensitive" as const } }, { phone: { contains: search, mode: "insensitive" as const } }, { notes: { contains: search, mode: "insensitive" as const } }]
        : undefined
    };
    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" }
      }),
      this.prisma.lead.count({ where })
    ]);
    return { items, total, page, pageSize };
  }

  async create(userId: string, dto: CreateLeadDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");
    if (user.role === UserRole.free) {
      const count = await this.prisma.lead.count({ where: { createdBy: userId } });
      if (count >= 3) throw new ForbiddenException("Free plan is limited to 3 leads");
    }
    return this.prisma.lead.create({ data: { ...dto, createdBy: userId } });
  }

  async update(userId: string, leadId: string, dto: UpdateLeadDto) {
    const existing = await this.prisma.lead.findFirst({ where: { id: leadId, createdBy: userId } });
    if (!existing) throw new NotFoundException("Lead not found");
    return this.prisma.lead.update({ where: { id: leadId }, data: dto });
  }

  async delete(userId: string, leadId: string) {
    const existing = await this.prisma.lead.findFirst({ where: { id: leadId, createdBy: userId } });
    if (!existing) throw new NotFoundException("Lead not found");
    return this.prisma.lead.delete({ where: { id: leadId } });
  }
}
