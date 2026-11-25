import { Model, DataTypes } from 'sequelize'; import sequelize from '../config/database.js';
export default class ContributionRate extends Model {}
ContributionRate.init({ id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }, fund_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, amount: { type: DataTypes.DECIMAL(14,2), allowNull: false }, effective_from: { type: DataTypes.DATEONLY, allowNull: false }, effective_until: DataTypes.DATEONLY }, { sequelize, modelName: 'ContributionRate', tableName: 'contribution_rates', underscored: true });
