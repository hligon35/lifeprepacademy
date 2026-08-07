const test = require('node:test');
const assert = require('node:assert/strict');
const { buildPaymentConfig, calculateRegistrationFeeAmount } = require('./payment-config.js');

test('calculates the registration fee from player count', () => {
  assert.equal(calculateRegistrationFeeAmount(1), 75);
  assert.equal(calculateRegistrationFeeAmount(2), 150);
  assert.equal(calculateRegistrationFeeAmount(4), 300);
});

test('buildPaymentConfig defaults to paused mode with provider-neutral guidance', () => {
  const config = buildPaymentConfig({ feePerPlayer: 75, currency: 'USD' });

  assert.equal(config.mode, 'paused');
  assert.equal(config.provider, 'none');
  assert.equal(config.status, 'temporarily-paused');
  assert.equal(config.amount, 75);
  assert.equal(config.currency, 'USD');
  assert.equal(config.paymentUrl, null);
  assert.match(config.instructions, /temporarily paused/i);
});
