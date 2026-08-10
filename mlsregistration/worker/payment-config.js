function calculateRegistrationFeeAmount(playerCount, feePerPlayer = 75) {
  const count = Number.isFinite(Number(playerCount)) ? Number(playerCount) : 1;
  return Math.max(0, Math.round(count * Number(feePerPlayer || 75)));
}

function buildPaymentConfig(options = {}) {
  const feePerPlayer = Number(options.feePerPlayer || 75);
  const playerCount = Number(options.playerCount || 1);
  const currency = String(options.currency || 'USD').trim().toUpperCase() || 'USD';
  const amount = calculateRegistrationFeeAmount(playerCount, feePerPlayer);
  const paymentUrl = String(options.paymentUrl || 'https://quest.build/lpafoundation/paducah-go-soccer/1598/71794/686').trim();

  return {
    mode: 'redirect',
    provider: 'quest',
    status: 'ready',
    amount,
    currency,
    feePerPlayer,
    playerCount,
    paymentUrl,
    paymentUrlLabel: 'Continue to secure payment',
    instructions: 'Continue to secure payment to complete your registration fee.',
  };
}

module.exports = {
  buildPaymentConfig,
  calculateRegistrationFeeAmount,
};
