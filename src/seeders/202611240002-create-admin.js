'use strict';

import bcrypt from 'bcryptjs';

export default {
  async up(queryInterface, Sequelize) {
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    if (!username || !password) {
      throw new Error('Set ADMIN_USERNAME and ADMIN_PASSWORD before running db:seed.');
    }
    const existing = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE username = :username LIMIT 1',
      { replacements: { username }, type: Sequelize.QueryTypes.SELECT },
    );
    if (existing.length) return;
    await queryInterface.bulkInsert('users', [{
      username,
      password_hash: await bcrypt.hash(password, 12),
      member_id: null,
      role: 'ADMIN',
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    }]);
  },

  // Keep the provisioned administrator during routine seed rollback.
  async down() {},
};
