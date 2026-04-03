export interface TrendResult {
  direction: "up" | "down" | "neutral";
  color: string;
}

/**
 * Compares the first value (oldest) to the last value (newest) in the array
 * and returns a direction and semantic colour.
 *
 * Thresholds:
 *   |diff| < 0.5  →  neutral  (#94A3B8)
 *   energy / mood:  increase → green (#22C55E),  decrease → red (#EF4444)
 *   stress:         decrease → green (#22C55E),  increase → red (#EF4444)
 */
export function calculateTrend(
  data: number[],
  metric: "energy" | "stress" | "mood"
): TrendResult {
  const neutral: TrendResult = { direction: "neutral", color: "#94A3B8" };

  if (data.length < 2) return neutral;

  const oldest = data[0];
  const newest = data[data.length - 1];
  const diff = newest - oldest;

  if (Math.abs(diff) < 0.5) return neutral;

  const higherIsBetter = metric !== "stress";
  const improved = higherIsBetter ? diff > 0 : diff < 0;

  return {
    direction: diff > 0 ? "up" : "down",
    color: improved ? "#22C55E" : "#EF4444",
  };
}
