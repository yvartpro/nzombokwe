import test from 'node:test';
import assert from 'node:assert/strict';
import { amountCents, money, moneyFromCents, sumAmounts } from '../src/public/js/components/ui.js';

test('browser money display preserves fractional values exactly', () => {
  assert.equal(amountCents('5000.25'), 500025n);
  assert.equal(money('5000.25'), '5,000.25 BIF');
  assert.equal(moneyFromCents(sumAmounts(['0.10', '0.20'])), '0.30 BIF');
});
