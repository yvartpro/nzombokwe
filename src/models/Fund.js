import { Model, DataTypes } from 'sequelize'; import sequelize from '../config/database.js';
export default class Fund extends Model {}
Fund.init({ id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }, code: { type: DataTypes.ENUM('SOCIAL','AUTO_DEVELOPMENT'), allowNull: false, unique: true }, name: { type: DataTypes.STRING(100), allowNull: false }, joining_fee: { type: DataTypes.DECIMAL(14,2), allowNull: false, defaultValue: '0.00' }, active: { type: DataTypes.BOOLEAN, defaultValue: true } }, { sequelize, modelName: 'Fund', tableName: 'funds', underscored: true });
