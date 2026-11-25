import test from 'node:test';
import assert from 'node:assert/strict';
import { Sequelize } from 'sequelize';
import migration from '../src/migrations/202611240001-initial-schema.js';

const names = [
  'members','funds','users','member_fund_enrollments','contribution_rates','contribution_obligations',
  'treasury_transactions','contribution_payments','contribution_payment_allocations','assistance_types',
  'social_assistance','accounting_periods','fund_period_closings','audit_logs','SequelizeMeta',
];
const indexes = {
  members: [[['father_id'],false],[['mother_id'],false],[['last_name','first_name'],false]],
  member_fund_enrollments: [[['member_id','fund_id','effective_start_date'],true],[['member_id','fund_id','effective_end_date'],false]],
  contribution_rates: [[['fund_id','effective_from'],true]],
  contribution_obligations: [[['enrollment_id','obligation_type','period_year','period_month'],true],[['member_id','fund_id','due_date'],false]],
  treasury_transactions: [[['fund_id','transaction_date','id'],false],[['reversed_transaction_id'],true]],
  contribution_payment_allocations: [[['payment_id','obligation_id'],true],[['obligation_id'],false]],
  accounting_periods: [[['year','month'],true]],
  fund_period_closings: [[['accounting_period_id','fund_id'],true]],
  audit_logs: [[['entity_type','entity_id'],false],[['created_at'],false]],
};

test('initial migration resumes after MySQL committed DDL but failed before migration tracking', async () => {
  let ddlAttempts = 0;
  const queryInterface = {
    showAllTables: async () => names,
    showIndex: async table => (indexes[table] || []).map(([fields, unique]) => ({ fields: fields.map(attribute => ({ attribute })), unique })),
    createTable: async () => { ddlAttempts++; throw new Error('would recreate an existing table'); },
    addIndex: async () => { ddlAttempts++; throw new Error('would duplicate an existing index'); },
    sequelize: { query: async sql => sql.startsWith('SELECT') ? [[{ CONSTRAINT_NAME: 'already_present' }], {}] : (ddlAttempts++, [[], {}]) },
  };
  await migration.up(queryInterface, Sequelize);
  assert.equal(ddlAttempts, 0);
});
