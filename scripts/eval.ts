import fs from "fs";
import path from "path";
import { runDetectionEngine } from "../src/lib/detection";

interface BenchmarkRow {
  url: string;
  groundTruth: "safe" | "suspicious" | "dangerous";
  notes: string;
}

interface EvalMetricResult {
  url: string;
  groundTruth: string;
  predictedVerdict: string;
  riskScore: number;
  latencyMs: number;
  match: boolean;
  notes: string;
}

async function runEvaluation() {
  console.log("\n=================================================================");
  console.log("  PHISHGUARD AI DETECTION ENGINE — BENCHMARK EVALUATION");
  console.log("=================================================================\n");

  const csvPath = path.resolve(process.cwd(), "eval/urls.csv");
  if (!fs.existsSync(csvPath)) {
    console.error(`Error: Dataset not found at ${csvPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(csvPath, "utf-8");
  const lines = fileContent.split("\n").filter((l) => l.trim().length > 0);
  const rows: BenchmarkRow[] = [];

  // Parse CSV (skip header)
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length >= 2) {
      rows.push({
        url: parts[0].trim(),
        groundTruth: parts[1].trim().toLowerCase() as "safe" | "suspicious" | "dangerous",
        notes: parts.slice(2).join(",").trim(),
      });
    }
  }

  console.log(`Loaded ${rows.length} ground-truth test cases from eval/urls.csv\n`);
  console.log("Executing evaluation pipeline across benchmark set...\n");

  const results: EvalMetricResult[] = [];
  let totalLatency = 0;

  for (const row of rows) {
    const t0 = performance.now();
    try {
      const result = await runDetectionEngine(row.url);
      const latency = Math.round(performance.now() - t0);
      totalLatency += latency;

      // Group: safe vs threat (suspicious / dangerous)
      const isThreatTruth = row.groundTruth === "suspicious" || row.groundTruth === "dangerous";
      const isThreatPred = result.riskLevel === "suspicious" || result.riskLevel === "dangerous";
      const match = row.groundTruth === result.riskLevel || (isThreatTruth && isThreatPred);

      results.push({
        url: row.url,
        groundTruth: row.groundTruth,
        predictedVerdict: result.riskLevel,
        riskScore: result.riskScore,
        latencyMs: latency,
        match,
        notes: row.notes,
      });

      const icon = match ? "✓" : "✗";
      console.log(
        `  ${icon} [${result.riskLevel.toUpperCase().padEnd(10)}] (Score: ${String(result.riskScore).padStart(3)}) Truth: ${row.groundTruth.padEnd(10)} | ${row.url.slice(0, 48)}`
      );
    } catch (err: unknown) {
      const latency = Math.round(performance.now() - t0);
      totalLatency += latency;
      results.push({
        url: row.url,
        groundTruth: row.groundTruth,
        predictedVerdict: "error",
        riskScore: 100,
        latencyMs: latency,
        match: false,
        notes: err instanceof Error ? err.message : "Engine failure",
      });
      console.log(`  ✗ [ERROR] ${row.url}`);
    }
  }

  // Calculate Confusion Matrix for Binary Threat Classification (Threat vs Safe)
  let tp = 0; // True Positive: Actual Threat & Predicted Threat
  let tn = 0; // True Negative: Actual Safe & Predicted Safe
  let fp = 0; // False Positive: Actual Safe but Predicted Threat
  let fn = 0; // False Negative: Actual Threat but Predicted Safe

  for (const r of results) {
    const truthIsThreat = r.groundTruth === "suspicious" || r.groundTruth === "dangerous";
    const predIsThreat = r.predictedVerdict === "suspicious" || r.predictedVerdict === "dangerous";

    if (truthIsThreat && predIsThreat) tp++;
    else if (!truthIsThreat && !predIsThreat) tn++;
    else if (!truthIsThreat && predIsThreat) fp++;
    else if (truthIsThreat && !predIsThreat) fn++;
  }

  const total = results.length;
  const accuracy = total > 0 ? ((tp + tn) / total) * 100 : 0;
  const precision = tp + fp > 0 ? (tp / (tp + fp)) * 100 : 0;
  const recall = tp + fn > 0 ? (tp / (tp + fn)) * 100 : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  const fpr = fp + tn > 0 ? (fp / (fp + tn)) * 100 : 0;
  const avgLatency = total > 0 ? Math.round(totalLatency / total) : 0;

  console.log("\n=================================================================");
  console.log("  EVALUATION SUMMARY & PERFORMANCE METRICS");
  console.log("=================================================================");
  console.log(`  Total Evaluated Samples : ${total}`);
  console.log(`  True Positives (Threat) : ${tp}`);
  console.log(`  True Negatives (Safe)   : ${tn}`);
  console.log(`  False Positives         : ${fp}`);
  console.log(`  False Negatives         : ${fn}`);
  console.log("-----------------------------------------------------------------");
  console.log(`  Accuracy                : ${accuracy.toFixed(1)}%`);
  console.log(`  Precision               : ${precision.toFixed(1)}%`);
  console.log(`  Recall (Sensitivity)    : ${recall.toFixed(1)}%`);
  console.log(`  F1-Score                : ${f1.toFixed(1)}%`);
  console.log(`  False Positive Rate     : ${fpr.toFixed(1)}%`);
  console.log(`  Average Latency         : ${avgLatency} ms`);
  console.log("=================================================================\n");
}

runEvaluation().catch(console.error);
