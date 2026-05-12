import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException
} from "@nestjs/common";
import { PaymentStatus } from "@prisma/client";
import { randomBytes, createHash } from "crypto";
import Stripe from "stripe";
import { AuthService } from "../auth/auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { encryptCheckoutPayload, decryptCheckoutPayload } from "./checkout-code.crypto";
import { CompleteCheckoutDto } from "./dto/complete-checkout.dto";
import { CreatePaymentIntentDto } from "./dto/create-payment-intent.dto";
import { RedeemCodeDto } from "./dto/redeem-code.dto";
import { normalizePlanKey, productIdForPlan } from "./stripe-products";

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);
  private readonly idempotentAccessCodes = new Map<string, string>();
  private readonly redeemedCodeHashes = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService
  ) {}

  private stripe() {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    if (!key) {
      throw new ServiceUnavailableException("STRIPE_SECRET_KEY is not configured.");
    }
    if (!key.startsWith("sk_test_")) {
      throw new BadRequestException("Only Stripe test secret keys (sk_test_…) are permitted.");
    }
    return new Stripe(key, { typescript: true });
  }

  private codeSecret(): string {
    const s = process.env.CHECKOUT_CODE_SECRET?.trim();
    if (!s || s.length < 16) {
      throw new ServiceUnavailableException("CHECKOUT_CODE_SECRET must be set to at least 16 characters.");
    }
    return s;
  }

  /** Uses the first active Stripe Price on the product (prefers one-time). */
  private async resolveAmountFromProduct(productId: string): Promise<{ amountCents: number; priceId: string }> {
    const stripe = this.stripe();
    const prices = await stripe.prices.list({ product: productId, active: true, limit: 30 });
    const withUnit = prices.data.filter((p) => typeof p.unit_amount === "number" && p.unit_amount > 0);
    if (!withUnit.length) {
      throw new BadRequestException(
        `No active price with an amount found for Stripe product ${productId}. Add a Price in the Stripe Dashboard.`
      );
    }
    const oneTime = withUnit.find((p) => p.type === "one_time");
    const pick = oneTime ?? withUnit[0];
    return { amountCents: pick.unit_amount!, priceId: pick.id };
  }

  async createPaymentIntent(dto: CreatePaymentIntentDto) {
    const stripe = this.stripe();
    const email = dto.email.trim().toLowerCase();
    const plan = normalizePlanKey(dto.planKey);
    const productId = productIdForPlan(plan);

    let amountCents = dto.amount;
    let stripePriceId: string | null = null;

    if (productId) {
      try {
        const resolved = await this.resolveAmountFromProduct(productId);
        amountCents = resolved.amountCents;
        stripePriceId = resolved.priceId;
        if (Math.abs(amountCents - dto.amount) > 1) {
          this.logger.log(`Checkout amount from Stripe price ${resolved.priceId}: ${amountCents} (client sent ${dto.amount})`);
        }
      } catch (e) {
        this.logger.warn(`Stripe price lookup failed for ${productId}, using client amount: ${e instanceof Error ? e.message : e}`);
        amountCents = dto.amount;
      }
    }

    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        checkoutEmail: email,
        clientSlug: dto.clientSlug ?? "",
        planKey: plan,
        stripeProductId: productId ?? "",
        stripePriceId: stripePriceId ?? ""
      }
    });
    if (!intent.client_secret) {
      this.logger.error("Stripe returned no client_secret");
      throw new ServiceUnavailableException("Unable to start checkout.");
    }
    return {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amountCents,
      stripeProductId: productId ?? null,
      stripePriceId
    };
  }

  async completeCheckout(dto: CompleteCheckoutDto) {
    const stripe = this.stripe();
    const secret = this.codeSecret();

    const cached = this.idempotentAccessCodes.get(dto.paymentIntentId);
    if (cached) {
      return { accessCode: cached };
    }

    const pi = await stripe.paymentIntents.retrieve(dto.paymentIntentId);
    if (pi.status !== "succeeded") {
      throw new BadRequestException("Payment has not succeeded yet.");
    }

    const metaEmail = (pi.metadata?.checkoutEmail ?? "").trim().toLowerCase();
    const bodyEmail = dto.email.trim().toLowerCase();
    if (!metaEmail || metaEmail !== bodyEmail) {
      throw new BadRequestException("Billing email does not match the payment session.");
    }

    const password = randomBytes(14).toString("base64url").slice(0, 18);
    const user = await this.authService.createPremiumAccount({
      name: dto.name.trim(),
      email: dto.email.trim(),
      password
    });

    await this.prisma.payment.create({
      data: {
        userId: user.id,
        amount: (pi.amount_received ?? pi.amount) / 100,
        status: PaymentStatus.paid,
        stripeSessionId: pi.id
      }
    });

    const accessCode = encryptCheckoutPayload(secret, { email: user.email, password });
    this.idempotentAccessCodes.set(dto.paymentIntentId, accessCode);
    return { accessCode };
  }

  redeemAccessCode(dto: RedeemCodeDto) {
    const secret = this.codeSecret();
    const hash = createHash("sha256").update(dto.code, "utf8").digest("hex");
    if (this.redeemedCodeHashes.has(hash)) {
      throw new UnauthorizedException("This access code has already been used.");
    }
    try {
      const creds = decryptCheckoutPayload(secret, dto.code);
      if (!creds?.email || !creds?.password) {
        throw new BadRequestException("Invalid access code.");
      }
      this.redeemedCodeHashes.add(hash);
      return { email: creds.email, password: creds.password };
    } catch (e) {
      this.logger.warn(`Redeem failed: ${e instanceof Error ? e.message : "unknown"}`);
      throw new UnauthorizedException("Invalid or expired access code.");
    }
  }
}
