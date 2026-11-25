import { Model, DataTypes } from 'sequelize'; import sequelize from '../config/database.js';
export default class AssistanceType extends Model {}
AssistanceType.init({ id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }, name: { type: DataTypes.STRING(100), allowNull: false, unique: true }, default_amount: { type: DataTypes.DECIMAL(14,2), allowNull: false }, active: { type: DataTypes.BOOLEAN, defaultValue: true } }, { sequelize, modelName: 'AssistanceType', tableName: 'assistance_types', underscored: true });
