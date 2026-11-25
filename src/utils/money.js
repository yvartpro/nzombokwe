export function cents(value) {
  const text = String(value ?? '').trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) { const error = new Error('Amount must be a non-negative decimal with up to two fractional digits'); error.status = 400; throw error; }
  const [whole, fraction = ''] = text.split('.'); return BigInt(whole) * 100n + BigInt((fraction + '00').slice(0,2));
}
export function money(value) { const c = typeof value === 'bigint' ? value : cents(value); return `${c / 100n}.${String(c % 100n).padStart(2,'0')}`; }
export function sumMoney(values) { return money(values.reduce((sum, value) => sum + cents(value), 0n)); }
