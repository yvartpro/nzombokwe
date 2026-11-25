# Nzombokwe family management

Responsive family genealogy and two-fund treasury application built with Node.js, Express, Sequelize/MySQL, vanilla JavaScript modules and Tailwind CSS.

## Setup

1. Install Node.js 22.12+ and MySQL 8. Copy `.env.example` to `.env` and set a long `SESSION_SECRET`.
2. Install packages with `npm install`.
3. Configure `ADMIN_USERNAME` and a strong `ADMIN_PASSWORD` in the environment for first-run account creation. The password is hashed and is never seeded into source control.
4. Run `npm run db:create`, `npm run db:migrate`, then `npm run db:seed`.
5. Run `npm run build:css`, then `npm run dev` and visit `http://localhost:3000`.

A session-bound CSRF synchronizer token and origin/fetch-metadata checks protect unsafe requests. No public registration route exists. The base-data seeder creates the two fund records and assistance categories; the Nzombokwe root member is not created because no confirmed birth/name details were supplied. Create it through Members after login.

## Sequelize CLI migrations and seeders

Migrations and seeders are native ESM modules under `src/migrations` and `src/seeders`. The project follows the `sequelize-cli` workflow used in the referenced Giraso and HSVC projects: `.sequelizerc` points the CLI at those folders, `src/config/config.cjs` supplies shared environment-based settings, and `db:migrate` / `db:seed` run through sequelize-cli directly. The CLI's built-in generators emit CommonJS, so `npm run db:make:migration -- <name>` and `npm run db:make:seeder -- <name>` create ESM templates while the normal CLI runs and tracks them. The initial schema migration is safe to rerun after partial DDL failure because MySQL commits DDL statement by statement. This setup requires Node.js 22.12+ for native `require(esm)` support in the CLI's Umzug v2 loader. Use `npm run db:migrate`, `npm run db:migrate:undo`, `npm run db:seed`, and `npm run db:seed:undo` for database changes. `npm run db:migrate:status` shows migration status. To add schema/data changes, generate ESM files with `npm run db:make:migration -- <name>` or `npm run db:make:seeder -- <name>`.
## Accounting rules

Each payment, obligation and treasury row is bound to exactly one fund. The application exposes no transfer operation. Decimal values are sent and handled as strings; MySQL stores them as `DECIMAL(14,2)`. Payment receipt, its journal entry and its allocations commit in a single SQL transaction. Disbursing approved assistance and its SOCIAL exit are likewise atomic. Historical rates, joining fee snapshots and assistance amounts are preserved.

Enrollments create a monthly obligation for each calendar month they overlap, without proration. An effective withdrawal date ends the final eligible month; if withdrawal occurs before a month starts, no obligation is generated for that month. Generation is idempotent. Closed periods reject ordinary journal writes.

## Structure

- `src/models`: class-based Sequelize models and associations
- `src/migrations`, `src/seeders`: ESM database history and base data
- `src/services`: business processes and transactional financial logic
- `src/controllers`, `src/routes`: REST API
- `src/public`: app shell, ES modules, PWA assets and Tailwind styles
- `scripts`: ESM migration/seeder file generator
