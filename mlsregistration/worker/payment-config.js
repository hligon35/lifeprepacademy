function calculateRegistrationFeeAmount(playerCount, feePerPlayer = 75) {
  const count = Number.isFinite(Number(playerCount)) ? Number(playerCount) : 1;
  return Math.max(0, Math.round(count * Number(feePerPlayer || 75)));
}

const DEFAULT_PAYMENT_MODE = 'paused';
const DEFAULT_PAYMENT_PROVIDER = 'none';
const DEFAULT_PAYMENT_URL = 'https://quest.build/get-tickets/1598/71794/info?teamId=686';

function buildPaymentConfig(options = {}) {
  const feePerPlayer = Number(options.feePerPlayer || 75);
  const playerCount = Number(options.playerCount || 1);
  const currency = String(options.currency || 'USD').trim().toUpperCase() || 'USD';
  const amount = calculateRegistrationFeeAmount(playerCount, feePerPlayer);
  const mode = String(options.mode || DEFAULT_PAYMENT_MODE).trim().toLowerCase();
  const redirectEnabled = mode === 'redirect';
  const paymentUrl = String(options.paymentUrl || DEFAULT_PAYMENT_URL).trim();
  const provider = String(options.provider || (redirectEnabled ? 'quest' : DEFAULT_PAYMENT_PROVIDER)).trim().toLowerCase();

  return {
    mode: redirectEnabled ? 'redirect' : 'paused',
    provider: redirectEnabled ? provider : 'none',
    status: redirectEnabled ? 'ready' : 'temporarily-paused',
    amount,
    currency,
    feePerPlayer,
    playerCount,
    paymentUrl: redirectEnabled ? paymentUrl : null,
    paymentUrlLabel: redirectEnabled ? 'Continue to secure payment' : 'Payment temporarily paused',
    instructions: redirectEnabled
      ? 'Continue to secure payment to complete your registration fee.'
      : 'Payment is temporarily paused while we transition to a new payment provider. Your registration is saved, and we will email a secure payment link when the service is available.',
  };
}

module.exports = {
  buildPaymentConfig,
  calculateRegistrationFeeAmount,
};
