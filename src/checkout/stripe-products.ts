/** Default Stripe test product IDs (override with STRIPE_PRODUCT_PLAN_* env vars). */
export const DEFAULT_STRIPE_PRODUCT_BY_PLAN: Record<"a" | "b" | "c", string> = {
  a: "prod_UV6qb1RHZEm55g",
  b: "prod_UV6qEwzr7QaQLa",
  c: "prod_UV6r3GELg5dynC"
};

export function normalizePlanKey(raw: string | undefined): "a" | "b" | "c" {
  const k = (raw ?? "b").toLowerCase();
  if (k === "a" || k === "b" || k === "c") return k;
  return "b";
}

export function productIdForPlan(plan: "a" | "b" | "c"): string | undefined {
  const envKey = plan === "a" ? "STRIPE_PRODUCT_PLAN_A" : plan === "b" ? "STRIPE_PRODUCT_PLAN_B" : "STRIPE_PRODUCT_PLAN_C";
  const fromEnv = process.env[envKey]?.trim();
  if (fromEnv) return fromEnv;
  return DEFAULT_STRIPE_PRODUCT_BY_PLAN[plan];
}
