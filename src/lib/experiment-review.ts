export type ExperimentArmKey = "baseline" | "candidate";
export type QualityChoice = "first" | "tie" | "second";

export function orderedArmKeys(order: readonly string[]): [ExperimentArmKey, ExperimentArmKey] {
  if (order.length === 2 && order.includes("baseline") && order.includes("candidate")) {
    return [order[0] as ExperimentArmKey, order[1] as ExperimentArmKey];
  }
  return ["baseline", "candidate"];
}

export function qualityVerdict(input: {
  choice: QualityChoice;
  firstKey: ExperimentArmKey;
  baselineTokens: number;
  candidateTokens: number;
}): string {
  const difference = input.baselineTokens - input.candidateTokens;
  const magnitude = Math.abs(difference).toLocaleString();
  const tokenResult = difference > 0
    ? `${magnitude} fewer tokens`
    : difference < 0
      ? `${magnitude} more tokens`
      : "the same number of tokens";
  const selectedKey = input.choice === "tie"
    ? undefined
    : input.choice === "first"
      ? input.firstKey
      : input.firstKey === "baseline" ? "candidate" : "baseline";

  if (input.choice === "tie") {
    return `You judged quality a tie. The candidate used ${tokenResult}.`;
  }
  if (selectedKey === "candidate") {
    return `You preferred the candidate output. It used ${tokenResult}.`;
  }
  return `You preferred the baseline output. The candidate used ${tokenResult}, so token count alone does not make it the winner.`;
}
