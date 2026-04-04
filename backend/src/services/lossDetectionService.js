const THRESHOLD = () => Number(process.env.LOSS_THRESHOLD_AMOUNT) || 50;

/**
 * Expected - Actual = Loss (opportunity loss framing).
 */
export function computeLoss(predictedIncome, actualIncome) {
  const pred = Number(predictedIncome);
  const act = Number(actualIncome);
  const loss = Math.max(0, pred - act);
  return { predicted: pred, actual: act, loss };
}

export function shouldTriggerClaim(loss) {
  return loss >= THRESHOLD();
}
