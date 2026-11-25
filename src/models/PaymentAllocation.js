import { Model, DataTypes } from 'sequelize'; import sequelize from '../config/database.js';
export default class PaymentAllocation extends Model {}
PaymentAllocation.init({ id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }, payment_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, obligation_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, allocated_amount: { type: DataTypes.DECIMAL(14,2), allowNull: false } }, { sequelize, modelName: 'PaymentAllocation', tableName: 'contribution_payment_allocations', underscored: true });
