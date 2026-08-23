import { launchPricesGbp, planDefinition, type PaidPlanId } from "@/lib/plans";

export type AccountPlanContext = {
  id: PaidPlanId;
  name: string;
  priceGbp: number;
  standardPriceGbp: number;
  launchPrice: boolean;
  summary: string;
};

export function accountPlanContext(id: PaidPlanId, launchAvailable: boolean): AccountPlanContext {
  const plan = planDefinition(id);
  return {
    id,
    name: plan.name,
    priceGbp: launchAvailable ? launchPricesGbp[id] : plan.priceGbp,
    standardPriceGbp: plan.priceGbp,
    launchPrice: launchAvailable,
    summary: plan.summary,
  };
}

export function accountPlanCallbackUrl(id: PaidPlanId): string {
  return `/account?plan=${encodeURIComponent(id)}`;
}

