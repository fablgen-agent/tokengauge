export type PlanId = "free" | "pro" | "pro_plus" | "ultimate";
export type PaidPlanId = Exclude<PlanId, "free">;

export type PlanDefinition = {
  id: PlanId;
  name: string;
  priceGbp: number;
  rank: number;
  summary: string;
  features: readonly string[];
};

export const plans: readonly PlanDefinition[] = [
  {
    id: "free",
    name: "Free",
    priceGbp: 0,
    rank: 0,
    summary: "Current rate cards, the open method set, and ChatGPT-backed starter recipes.",
    features: ["Official rate directory", "12 open evidence cards", "Starter ChatGPT lab recipes"],
  },
  {
    id: "pro",
    name: "Pro",
    priceGbp: 9,
    rank: 1,
    summary: "The complete evidence library and every supported bring-your-own-key adapter.",
    features: ["All 120 evidence cards", "All nine encrypted provider connections", "100-row experiment dashboard"],
  },
  {
    id: "pro_plus",
    name: "Pro+",
    priceGbp: 19,
    rank: 2,
    summary: "Review and export a larger set of measured experiments.",
    features: ["Everything in Pro", "250-row dashboard history", "Experiment CSV export"],
  },
  {
    id: "ultimate",
    name: "Ultimate",
    priceGbp: 39,
    rank: 3,
    summary: "The largest current dashboard and export window for repeat testing.",
    features: ["Everything in Pro+", "1,000-row dashboard history", "1,000-row CSV export"],
  },
] as const;

export const paidPlans = plans.filter((plan): plan is PlanDefinition & { id: PaidPlanId } => plan.id !== "free");

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && plans.some((plan) => plan.id === value);
}

export function isPaidPlanId(value: unknown): value is PaidPlanId {
  return isPlanId(value) && value !== "free";
}

export function planDefinition(id: PlanId): PlanDefinition {
  return plans.find((plan) => plan.id === id) ?? plans[0];
}

export function planAtLeast(current: PlanId, required: PlanId): boolean {
  return planDefinition(current).rank >= planDefinition(required).rank;
}

export function highestPlan(ids: readonly string[]): PlanId {
  return ids
    .filter(isPlanId)
    .reduce<PlanId>((highest, candidate) => planAtLeast(candidate, highest) ? candidate : highest, "free");
}
