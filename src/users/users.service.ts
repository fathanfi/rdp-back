import { Injectable } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
  }

  upgradeToPremium(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.premium },
      select: { id: true, role: true }
    });
  }
}
