export default {
  async up(queryInterface, Sequelize) {
    const description = await queryInterface.describeTable('members');
    if (!description.spouse_name) await queryInterface.addColumn('members', 'spouse_name', { type: Sequelize.DataTypes.STRING(201), allowNull: true });
  },
  async down(queryInterface) {
    const description = await queryInterface.describeTable('members');
    if (description.spouse_name) await queryInterface.removeColumn('members', 'spouse_name');
  },
};
