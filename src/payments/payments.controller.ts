import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { PaymentsService } from "./payments.service";

@UseGuards(JwtAuthGuard)
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  list(@CurrentUser() user: { sub: string }) {
    return this.paymentsService.list(user.sub);
  }

  @Post("checkout")
  checkout(@CurrentUser() user: { sub: string }, @Body() body: { amount: number }) {
    return this.paymentsService.createMockCheckout(user.sub, body.amount);
  }

  @Patch(":id/confirm")
  confirm(@CurrentUser() user: { sub: string }, @Param("id") id: string) {
    return this.paymentsService.confirmMockSuccess(user.sub, id);
  }
}
