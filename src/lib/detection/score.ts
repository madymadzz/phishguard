import type { RiskLevel } from "@/types/database.types";

export interface ScoreEvaluationResult {
  score: number;
  riskLevel: RiskLevel;
  displayLabel: "SAFE" | "SUSPICIOUS" | "HIGH RISK";
}

export function evaluateRiskScore(rawScore: number, forceDangerous = false): ScoreEvaluationResult {
  if (forceDangerous) {
    return {
      score: 100,
      riskLevel: "dangerous",
      displayLabel: "HIGH RISK",
    };
  }

  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  if (score < 30) {
    return {
      score,
      riskLevel: "safe",
      displayLabel: "SAFE",
    };
  } else if (score <= 64) {
    return {
      score,
      riskLevel: "suspicious",
      displayLabel: "SUSPICIOUS",
    };
  } else {
    return {
      score,
      riskLevel: "dangerous",
      displayLabel: "HIGH RISK",
    };
  }
}
