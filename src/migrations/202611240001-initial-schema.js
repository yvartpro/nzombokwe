function schema(Sequelize) {
  const { DataTypes } = Sequelize;
  const id = { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true, allowNull: false };
  const money = { type: DataTypes.DECIMAL(14, 2), allowNull: false };
  const timestamps = { created_at: { type: DataTypes.DATE, allowNull: false }, updated_at: { type: DataTypes.DATE, allowNull: false } };
  const fk = (table, allowNull = false, onDelete = 'RESTRICT') => ({ type: DataTypes.INTEGER.UNSIGNED, allowNull, references: { model: table, key: 'id' }, onUpdate: 'CASCADE', onDelete });
  return { DataTypes, id, money, timestamps, fk };
}

function normalizedTableName(value) {
  return String(typeof value === 'string' ? value : value.tableName || value.name).toLowerCase();
}

async function createTableIfMissing(queryInterface, existingTables, tableName, attributes) {
  const key = tableName.toLowerCase();
  if (existingTables.has(key)) return;
  await queryInterface.createTable(tableName, attributes);
  existingTables.add(key);
}

async function addIndexIfMissing(queryInterface, tableName, fields, options = {}) {
  const desired = fields.map(String);
  const indexes = await queryInterface.showIndex(tableName);
  const exists = indexes.some(index => {
    const actual = index.fields.map(field => String(field.attribute || field.name || field));
    return actual.length === desired.length && actual.every((field, position) => field === desired[position]) && Boolean(index.unique) === Boolean(options.unique);
  });
  if (!exists) await queryInterface.addIndex(tableName, fields, options);
}

export default {
async up(qi, Sequelize) {
  const { DataTypes, id, money, timestamps, fk } = schema(Sequelize);
  // MySQL's CHECK parser rejects a parent-id check against the AUTO_INCREMENT
  // primary key; self-parenting and ancestry cycles are validated in MemberService.
  const existingTables = new Set((await qi.showAllTables()).map(normalizedTableName));
  await createTableIfMissing(qi, existingTables, 'members', {
    id, member_number: { type: DataTypes.STRING(32), allowNull: false, unique: true }, first_name: { type: DataTypes.STRING(100), allowNull: false }, last_name: { type: DataTypes.STRING(100), allowNull: false },
    gender: { type: DataTypes.ENUM('MALE','FEMALE','OTHER','UNSPECIFIED'), allowNull: false, defaultValue: 'UNSPECIFIED' }, date_of_birth: DataTypes.DATEONLY,
    phone: DataTypes.STRING(40), email: DataTypes.STRING(190), father_id: fk('members', true), mother_id: fk('members', true), birth_order: DataTypes.INTEGER.UNSIGNED, notes: DataTypes.TEXT, ...timestamps
  });
  await addIndexIfMissing(qi, 'members', ['father_id']); await addIndexIfMissing(qi, 'members', ['mother_id']); await addIndexIfMissing(qi, 'members', ['last_name','first_name']);
  await createTableIfMissing(qi, existingTables, 'funds', { id, code: { type: DataTypes.ENUM('SOCIAL','AUTO_DEVELOPMENT'), allowNull: false, unique: true }, name: { type: DataTypes.STRING(100), allowNull: false }, joining_fee: { ...money, defaultValue: '0.00' }, active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }, ...timestamps });
  await createTableIfMissing(qi, existingTables, 'users', { id, username: { type: DataTypes.STRING(80), allowNull: false, unique: true }, password_hash: { type: DataTypes.STRING(255), allowNull: false }, member_id: fk('members', true), role: { type: DataTypes.ENUM('ADMIN','TREASURER','VIEWER'), allowNull: false, defaultValue: 'ADMIN' }, active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }, ...timestamps });
  await createTableIfMissing(qi, existingTables, 'member_fund_enrollments', { id, member_id: fk('members'), fund_id: fk('funds'), enrolled_at: { type: DataTypes.DATEONLY, allowNull: false }, effective_start_date: { type: DataTypes.DATEONLY, allowNull: false }, effective_end_date: DataTypes.DATEONLY, joining_fee_snapshot: { ...money, defaultValue: '0.00' }, information: DataTypes.TEXT, ...timestamps });
  await addIndexIfMissing(qi, 'member_fund_enrollments', ['member_id','fund_id','effective_start_date'], { unique: true, name: 'enrollment_history_uq' }); await addIndexIfMissing(qi, 'member_fund_enrollments', ['member_id','fund_id','effective_end_date']);
  await createTableIfMissing(qi, existingTables, 'contribution_rates', { id, fund_id: fk('funds'), amount: money, effective_from: { type: DataTypes.DATEONLY, allowNull: false }, effective_until: DataTypes.DATEONLY, ...timestamps });
  await addIndexIfMissing(qi, 'contribution_rates', ['fund_id','effective_from'], { unique: true });
  await createTableIfMissing(qi, existingTables, 'contribution_obligations', { id, enrollment_id: fk('member_fund_enrollments'), member_id: fk('members'), fund_id: fk('funds'), obligation_type: { type: DataTypes.ENUM('MONTHLY','JOINING_FEE'), allowNull: false }, period_year: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false }, period_month: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false }, expected_amount: money, due_date: { type: DataTypes.DATEONLY, allowNull: false }, ...timestamps });
  await addIndexIfMissing(qi, 'contribution_obligations', ['enrollment_id','obligation_type','period_year','period_month'], { unique: true, name: 'obligation_idempotency_uq' }); await addIndexIfMissing(qi, 'contribution_obligations', ['member_id','fund_id','due_date']);
  await createTableIfMissing(qi, existingTables, 'treasury_transactions', { id, fund_id: fk('funds'), transaction_date: { type: DataTypes.DATEONLY, allowNull: false }, transaction_type: { type: DataTypes.ENUM('ENTRY','EXIT','OPENING_BALANCE','ADJUSTMENT'), allowNull: false }, amount: money, description: { type: DataTypes.STRING(500), allowNull: false }, reference_number: { type: DataTypes.STRING(100), unique: true }, source_type: DataTypes.STRING(60), source_id: DataTypes.INTEGER.UNSIGNED, recorded_by: fk('users', true), reversed_transaction_id: fk('treasury_transactions', true), ...timestamps });
  await addIndexIfMissing(qi, 'treasury_transactions', ['fund_id','transaction_date','id']);
  await addIndexIfMissing(qi, 'treasury_transactions', ['reversed_transaction_id'], { unique: true, name: 'treasury_reversal_once_uq' });
  await createTableIfMissing(qi, existingTables, 'contribution_payments', { id, member_id: fk('members'), fund_id: fk('funds'), payment_date: { type: DataTypes.DATEONLY, allowNull: false }, amount: money, receipt_number: { type: DataTypes.STRING(100), allowNull: false, unique: true }, treasury_transaction_id: { ...fk('treasury_transactions'), unique: true }, recorded_by: fk('users', true), notes: DataTypes.TEXT, ...timestamps });
  await createTableIfMissing(qi, existingTables, 'contribution_payment_allocations', { id, payment_id: fk('contribution_payments'), obligation_id: fk('contribution_obligations'), allocated_amount: money, ...timestamps });
  await addIndexIfMissing(qi, 'contribution_payment_allocations', ['payment_id','obligation_id'], { unique: true }); await addIndexIfMissing(qi, 'contribution_payment_allocations', ['obligation_id']);
  await createTableIfMissing(qi, existingTables, 'assistance_types', { id, name: { type: DataTypes.STRING(100), allowNull: false, unique: true }, default_amount: money, active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }, ...timestamps });
  await createTableIfMissing(qi, existingTables, 'social_assistance', { id, beneficiary_member_id: fk('members'), assistance_type_id: fk('assistance_types'), amount_snapshot: money, request_date: { type: DataTypes.DATEONLY, allowNull: false }, approval_date: DataTypes.DATEONLY, disbursement_date: DataTypes.DATEONLY, description: DataTypes.TEXT, status: { type: DataTypes.ENUM('REQUESTED','APPROVED','DISBURSED','REJECTED'), allowNull: false, defaultValue: 'REQUESTED' }, treasury_transaction_id: { ...fk('treasury_transactions', true), unique: true }, recorded_by: fk('users', true), ...timestamps });
  await createTableIfMissing(qi, existingTables, 'accounting_periods', { id, year: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false }, month: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false }, start_date: { type: DataTypes.DATEONLY, allowNull: false }, end_date: { type: DataTypes.DATEONLY, allowNull: false }, status: { type: DataTypes.ENUM('OPEN','CLOSED'), allowNull: false, defaultValue: 'OPEN' }, closed_at: DataTypes.DATE, closed_by: fk('users', true), ...timestamps });
  await addIndexIfMissing(qi, 'accounting_periods', ['year','month'], { unique: true });
  await createTableIfMissing(qi, existingTables, 'fund_period_closings', { id, accounting_period_id: fk('accounting_periods'), fund_id: fk('funds'), opening_balance: money, total_entries: money, total_exits: money, closing_balance: money, closed_at: { type: DataTypes.DATE, allowNull: false }, ...timestamps });
  await addIndexIfMissing(qi, 'fund_period_closings', ['accounting_period_id','fund_id'], { unique: true });
  await createTableIfMissing(qi, existingTables, 'audit_logs', { id, user_id: fk('users', true), action: { type: DataTypes.STRING(80), allowNull: false }, entity_type: { type: DataTypes.STRING(80), allowNull: false }, entity_id: DataTypes.INTEGER.UNSIGNED, details: DataTypes.JSON, ip_address: DataTypes.STRING(45), created_at: { type: DataTypes.DATE, allowNull: false } });
  await addIndexIfMissing(qi, 'audit_logs', ['entity_type','entity_id']); await addIndexIfMissing(qi, 'audit_logs', ['created_at']);
  // MySQL enforces CHECK constraints from 8.0.16 onward. Cross-row invariants
  // such as allocation totals are additionally checked under service transactions.
  for (const [table, name, condition] of [
    ['funds','funds_nonnegative_fee_ck','joining_fee >= 0'],
    ['member_fund_enrollments','enrollment_dates_ck','effective_end_date IS NULL OR effective_end_date >= effective_start_date'],
    ['contribution_rates','rates_positive_amount_ck','amount > 0'],
    ['contribution_obligations','obligations_positive_amount_ck','expected_amount > 0 AND period_month BETWEEN 1 AND 12'],
    ['contribution_payments','payments_positive_amount_ck','amount > 0'],
    ['contribution_payment_allocations','allocations_positive_amount_ck','allocated_amount > 0'],
    ['treasury_transactions','treasury_positive_amount_ck','amount > 0'],
    ['assistance_types','assistance_nonnegative_default_ck','default_amount >= 0'],
    ['social_assistance','assistance_positive_amount_ck','amount_snapshot > 0'],
    ['accounting_periods','period_month_ck','month BETWEEN 1 AND 12'],
    ['fund_period_closings','closing_nonnegative_totals_ck','total_entries >= 0 AND total_exits >= 0']
  ]) {
    const [existing] = await qi.sequelize.query(
      'SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = :table AND CONSTRAINT_NAME = :name LIMIT 1',
      { replacements: { table, name } },
    );
    if (!existing.length) await qi.sequelize.query(`ALTER TABLE \`${table}\` ADD CONSTRAINT \`${name}\` CHECK (${condition})`);
  }
},

async down(qi) {
  for (const t of ['audit_logs','fund_period_closings','accounting_periods','social_assistance','assistance_types','contribution_payment_allocations','contribution_payments','treasury_transactions','contribution_obligations','contribution_rates','member_fund_enrollments','users','funds','members']) await qi.dropTable(t);
},
};
