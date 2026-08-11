const test = require('node:test');
const assert = require('node:assert/strict');
const { buildPaymentConfig, calculateRegistrationFeeAmount } = require('./payment-config.js');

test('calculates the registration fee from player count', () => {
  assert.equal(calculateRegistrationFeeAmount(1), 75);
  assert.equal(calculateRegistrationFeeAmount(2), 150);
  assert.equal(calculateRegistrationFeeAmount(4), 300);
});

test('buildPaymentConfig defaults to paused mode', () => {
  const config = buildPaymentConfig({ feePerPlayer: 75, currency: 'USD' });

  assert.equal(config.mode, 'paused');
  assert.equal(config.provider, 'none');
  assert.equal(config.status, 'temporarily-paused');
  assert.equal(config.amount, 75);
  assert.equal(config.currency, 'USD');
  assert.equal(config.paymentUrl, null);
  assert.match(config.instructions, /temporarily paused/i);
});

test('buildPaymentConfig supports redirect mode toggle', () => {
  const config = buildPaymentConfig({
    feePerPlayer: 75,
    currency: 'USD',
    mode: 'redirect',
    paymentUrl: 'https://quest.build/get-tickets/1598/71794/info?teamId=686',
  });

  assert.equal(config.mode, 'redirect');
  assert.equal(config.provider, 'quest');
  assert.equal(config.status, 'ready');
  assert.equal(config.paymentUrl, 'https://quest.build/get-tickets/1598/71794/info?teamId=686');
  assert.match(config.instructions, /secure payment/i);
});
