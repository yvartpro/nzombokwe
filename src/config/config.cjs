const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const shared = {
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || null,
  database: process.env.DB_NAME || 'nzombokwe',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  dialect: 'mysql',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  seederStorage: 'sequelize',
  define: { underscored: true, timestamps: true },
};

module.exports = {
  development: shared,
  test: { ...shared, database: process.env.DB_NAME_TEST || 'nzombokwe_test' },
  production: shared,
};
