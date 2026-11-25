import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const migration = require('../src/migrations/202611240001-initial-schema.js');

test('sequelize-cli can require the ESM default migration export on supported Node', () => {
  assert.equal(typeof migration.default.up, 'function');
  assert.equal(typeof migration.default.down, 'function');
});
