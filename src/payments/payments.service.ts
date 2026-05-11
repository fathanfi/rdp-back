import { Injectable } from "@nestjs/common";
import { PaymentStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  async createMockCheckout(userId: string, amount: number) {
    const sessionId = `mock_stripe_${Date.now()}`;
    return this.prisma.payment.create({
      data: {
        userId,
        amount,
        status: PaymentStatus.pending,
        stripeSessionId: sessionId
      }
    });
  }

  async confirmMockSuccess(userId: string, paymentId: string) {
    await this.prisma.payment.updateMany({
      where: { id: paymentId, userId },
      data: { status: PaymentStatus.paid }
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: UserRole.premium }
    });
    return this.prisma.payment.findUnique({ where: { id: paymentId } });
  }
}
