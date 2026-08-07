function calculateRegistrationFeeAmount(playerCount, feePerPlayer = 75) {
  const count = Number.isFinite(Number(playerCount)) ? Number(playerCount) : 1;
  return Math.max(0, Math.round(count * Number(feePerPlayer || 75)));
}

function buildPaymentConfig(options = {}) {
  const feePerPlayer = Number(options.feePerPlayer || 75);
  const playerCount = Number(options.playerCount || 1);
  const currency = String(options.currency || 'USD').trim().toUpperCase() || 'USD';
  const amount = calculateRegistrationFeeAmount(playerCount, feePerPlayer);

  return {
    mode: 'paused',
    provider: 'none',
    status: 'temporarily-paused',
    amount,
    currency,
    feePerPlayer,
    playerCount,
    paymentUrl: null,
    paymentUrlLabel: 'Payment temporarily paused',
    instructions: 'Payment is temporarily paused while we transition to a new payment provider. Your registration is saved, and we will email a secure payment link when the service is available.',
  };
}

module.exports = {
  buildPaymentConfig,
  calculateRegistrationFeeAmount,
};
