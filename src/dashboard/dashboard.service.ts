import { Injectable } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const latest = await this.prisma.dashboardMetric.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    const fallback = {
      roas: 4.82,
      gmv: 184000,
      adSpend: 38200,
      ctr: 3.2,
      impressions: 2400000
    };
    const metric = latest || fallback;
    const isPremium = user?.role === UserRole.premium || user?.role === UserRole.admin;
    return {
      role: user?.role ?? UserRole.free,
      metrics: {
        roas: metric.roas,
        gmv: metric.gmv,
        adSpend: isPremium ? metric.adSpend : null,
        ctr: isPremium ? metric.ctr : null,
        impressions: isPremium ? metric.impressions : null
      },
      lockedFields: isPremium ? [] : ["adSpend", "ctr", "impressions"]
    };
  }
}
