#!/usr/bin/env node
// Generate ESM migration/seeder modules for sequelize-cli's normal runners.
// Usage: npm run db:make:migration -- add-member-index or npm run db:make:seeder -- add-default-rates
import fs from 'node:fs';
import path from 'node:path';

const [kind, rawName] = process.argv.slice(2);
const folders = { migration: 'src/migrations', seeder: 'src/seeders' };
if (!folders[kind] || !rawName) {
  console.error('Usage: npm run db:make:<migration|seeder> -- <name>');
  process.exit(1);
}
const name = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
if (!name) throw new Error('Provide a migration or seeder name.');
const timestamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const file = path.resolve(folders[kind], `${timestamp}-${name}.js`);
const templates = {
  migration: `'use strict';\n\nexport default {\n  async up(queryInterface, Sequelize) {\n    // Add the schema change here with queryInterface.\n  },\n\n  async down(queryInterface) {\n    // Reverse the schema change here.\n  },\n};\n`,
  seeder: `'use strict';\n\nexport default {\n  async up(queryInterface, Sequelize) {\n    // Insert initial or reference data with queryInterface.\n  },\n\n  async down(queryInterface) {\n    // Remove only data owned by this seeder.\n  },\n};\n`,
};
fs.writeFileSync(file, templates[kind], { flag: 'wx' });
console.log(`Created ${path.relative(process.cwd(), file)}`);
