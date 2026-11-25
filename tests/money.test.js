import test from 'node:test';
import assert from 'node:assert/strict';
import { cents, money, sumMoney } from '../src/utils/money.js';

test('converts decimal strings to exact integer cents', () => {
  assert.equal(cents('5000'), 500000n);
  assert.equal(cents('12.3'), 1230n);
  assert.equal(money(123456789012345n), '1234567890123.45');
});

test('sums money without binary floating point drift', () => {
  assert.equal(sumMoney(['0.10', '0.20', '100.99']), '101.29');
});

test('rejects malformed, negative, and over-precision amounts', () => {
  for (const value of ['-1', '1.001', 'abc', '1,000.00', '']) assert.throws(() => cents(value));
});
