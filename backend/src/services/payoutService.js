import crypto from 'crypto';

/**
 * Simulated UPI payout success payload.
 */
export function simulateUpiPayout({ claimId, userId, amount }) {
  const ref = `UPI-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
  return {
    success: true,
    message: 'Payout initiated successfully (simulated)',
    upi_reference: ref,
    claim_id: claimId,
    user_id: userId,
    amount: Number(amount),
    timestamp: new Date().toISOString(),
  };
}
