import 'dotenv/config';
import { Sequelize } from 'sequelize';
import databaseConfigs from './config.cjs';

const environment = process.env.NODE_ENV || 'development';
const config = databaseConfigs[environment] || databaseConfigs.development;
const { username, password, database, seederStorage, ...options } = config;

const sequelize = new Sequelize(database, username, password, {
  ...options,
  dialectOptions: { decimalNumbers: false, supportBigNumbers: true, bigNumberStrings: true },
});

export default sequelize;
