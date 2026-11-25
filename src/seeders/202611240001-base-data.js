'use strict';

export default {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('funds', [
      { code: 'SOCIAL', name: 'Social Fund', joining_fee: '0.00', active: true, created_at: now, updated_at: now },
      { code: 'AUTO_DEVELOPMENT', name: 'Auto-development Fund', joining_fee: '0.00', active: true, created_at: now, updated_at: now },
    ], { ignoreDuplicates: true });
    await queryInterface.bulkInsert('assistance_types', ['Marriage', 'Illness', 'Death', 'Other'].map(name => ({
      name, default_amount: '0.00', active: true, created_at: now, updated_at: now,
    })), { ignoreDuplicates: true });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('assistance_types', { name: ['Marriage', 'Illness', 'Death', 'Other'] });
    await queryInterface.bulkDelete('funds', { code: ['SOCIAL', 'AUTO_DEVELOPMENT'] });
  },
};
