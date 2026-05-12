import { Body, Controller, Post } from "@nestjs/common";
import { CheckoutService } from "./checkout.service";
import { CompleteCheckoutDto } from "./dto/complete-checkout.dto";
import { CreatePaymentIntentDto } from "./dto/create-payment-intent.dto";
import { RedeemCodeDto } from "./dto/redeem-code.dto";

@Controller("checkout")
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post("payment-intent")
  createIntent(@Body() dto: CreatePaymentIntentDto) {
    return this.checkoutService.createPaymentIntent(dto);
  }

  @Post("complete")
  complete(@Body() dto: CompleteCheckoutDto) {
    return this.checkoutService.completeCheckout(dto);
  }

  @Post("redeem-code")
  redeem(@Body() dto: RedeemCodeDto) {
    return this.checkoutService.redeemAccessCode(dto);
  }
}
