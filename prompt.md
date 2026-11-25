# MASTER PROJECT PROMPT — NZOMBOKWE FAMILY MANAGEMENT SYSTEM

## 1. ROLE AND OBJECTIVE

Act as a senior full-stack software architect and developer.

Your task is to design and build a complete, production-oriented, responsive web application for managing the descendants of a family founded by a grandparent named **Nzombokwe**.

The application must manage two major areas:

1. **Family genealogy:** Register and organize all descendants of Nzombokwe across multiple generations.
2. **Family financial management:** Manage independent member contributions, two separate funds, treasury transactions, social assistance, and financial reporting.

This is a real family management system, not a demo or a simple CRUD application.

Follow the specifications below carefully. Do not introduce features that contradict the business rules. Do not simplify financial operations in ways that compromise accounting accuracy.

Before implementing complex features, establish the architecture, database schema, relationships, migrations, and business logic.

---

# 2. TECHNOLOGY STACK

Use exactly the following technologies unless a genuine technical incompatibility requires an explanation and an alternative proposal.

### Frontend
- HTML5
- Vanilla JavaScript
- JavaScript ES Modules (ESM)
- Tailwind CSS
- No React, Vue, Angular, or other frontend frameworks.
- No TypeScript.
- Use reusable JavaScript components and modular page organization.
- Build Tailwind CSS through a small npm workflow.

### Backend
- Node.js
- Express.js
- JavaScript ES Modules (ESM)
- MySQL database
- Sequelize ORM
- sequelize-cli for database migrations and seeders.
- ESM migrations and seeders.
- Class-based Sequelize models extending Sequelize's Model class.
- Class-based controllers.
- Separate services for complex business logic.

Important: Verify that the selected sequelize-cli version actually supports the requested ESM migration and seeder setup. Do not assume that simply adding `"type": "module"` makes every CLI migration work. Configure the migration runner correctly and document the solution. Do not silently convert migrations to CommonJS.

### Application type
- Responsive web application.
- Progressive Web App (PWA).
- Desktop and mobile support.
- Installable on supported browsers and devices.

---

# 3. PROJECT IDENTITY AND UI DESIGN

The application represents the Nzombokwe family.

Use a clean, elegant, modern, and professional interface.

### Visual identity
- Primary color: Sky blue.
- Suggested primary color: `#37A8EE`.
- Background: White.
- Use dark, readable text.
- Use subtle borders and separators.
- Use small corner radii.
- Flat design.
- Avoid large rounded cards.
- Avoid gradients.
- Avoid excessive shadows.
- Avoid unnecessary decorative elements.

The design should look like a professional administrative and financial management application.

### Desktop layout
- Left sidebar for primary navigation.
- Main content area.
- Header containing the page title and account actions.
- Responsive tables and forms.

### Mobile layout
- Bottom navigation for the most important destinations.
- Additional navigation options inside a left-side offcanvas menu.
- Forms and tables must adapt to small screens.
- Avoid horizontal overflow wherever possible.

Suggested mobile bottom navigation:
- Home
- Family
- Treasury
- More

### Suggested navigation

1. Dashboard
2. Genealogy
3. Members
4. Contributions
5. Treasury
6. Social Assistance
7. Reports
8. Settings

Use clear labels and appropriate icons.

---

# 4. GENEALOGY MANAGEMENT

The family tree begins with one founding grandparent:

**Nzombokwe**

The application must support an unlimited number of generations.

Examples:
- Nzombokwe
- His children
- His grandchildren
- His great-grandchildren
- Further descendants

### Important design rule

Do not create separate database tables for children, grandchildren, great-grandchildren, etc.

Use one unified `members` table with self-referencing parent relationships.

Each member should support:

- Unique member number.
- First name.
- Last name.
- Gender.
- Date of birth.
- Phone number.
- Email.
- Father ID.
- Mother ID.
- Birth order.
- Notes.
- Creation date.
- Update date.

Father and mother must reference other records in the same `members` table.

The founding member Nzombokwe is the root record and does not need parents within this genealogy.

### Genealogy features

Implement:

- Register family members.
- Edit member information.
- View member profiles.
- View descendants.
- View parents.
- View siblings.
- Navigate through generations.
- Display a visual family tree.
- Search members.
- Filter by generation.
- Display the number of descendants.
- Navigate from one family member to another.

Do not automatically enroll newly registered family members into financial contributions.

Genealogy membership and financial participation are independent.

---

# 5. FINANCIAL STRUCTURE: TWO INDEPENDENT FUNDS

The application must manage exactly two initial funds:

1. SOCIAL
2. AUTO_DEVELOPMENT

These funds must remain financially independent.

### SOCIAL FUND

Used to support family members during events such as:

- Marriage.
- Illness.
- Death.
- Other approved family assistance situations.

### AUTO-DEVELOPMENT FUND

Used for collective family development needs and investments, such as:

- Purchasing family land.
- Purchasing agricultural tools.
- Other collective development expenses.

### Critical financial rule

Money must NEVER be transferred between these two funds.

Every financial transaction must belong to exactly one fund.

A central treasury transaction table is allowed, but every transaction must have a mandatory `fund_id`.

The system must never use the combined balance to authorize spending.

It may display a combined overview, but all financial operations and balances must remain separated.

---

# 6. CONTRIBUTOR ENROLLMENT

A family member is not automatically a contributor.

Every person initially belongs only to the genealogy.

A member becomes a contributor only after explicitly enrolling in a fund.

### Independent enrollment

A member may:

- Join the social fund only.
- Join the auto-development fund only.
- Join both funds.
- Stop contributing to one fund while continuing to contribute to the other.

Enrollment must be managed independently for each fund.

Each fund enrollment must record:

- Member ID.
- Fund ID.
- Enrollment date.
- Effective start date.
- Effective end date, nullable.
- Joining fee amount snapshot, if applicable.
- Enrollment information.
- Created date.

A member must be allowed to leave a fund and potentially rejoin later.

Do not permanently delete old enrollment history.

Stopping participation in one fund must never affect participation in the other fund.

### Joining fees

Each fund may have its own joining fee.

For example:

- Social joining fee: independently configured.
- Auto-development joining fee: independently configured.

If a member joins both funds, they may have to pay two different joining fees.

A joining fee paid for one fund must never be allocated to the other fund.

Represent joining fees as separate contribution obligations linked to the appropriate member-fund enrollment.

Preserve the joining fee amount that applied when the member enrolled.

---

# 7. MONTHLY CONTRIBUTIONS

Each fund has a fixed monthly contribution amount.

The two funds may have different amounts.

Contribution amounts must be configurable.

### Historical contribution rates

Do not simply overwrite an existing contribution rate when the amount changes.

Store rates with effective dates:

- Fund ID.
- Amount.
- Effective from.
- Effective until.
- Creation date.

When a new contribution amount is introduced, create a new rate record.

Existing obligations must preserve their original expected amounts.

### Automatic monthly obligations

The system must generate monthly contribution obligations automatically for eligible enrolled members.

Each obligation must include:

- Member-fund enrollment ID.
- Member ID, where useful for efficient querying.
- Fund ID.
- Obligation type.
- Period year.
- Period month.
- Expected amount.
- Due date.
- Creation date.

Supported obligation types:

- MONTHLY
- JOINING_FEE

### Idempotency

The monthly obligation generator must be idempotent.

Running it multiple times must never create duplicate obligations for the same member, fund enrollment, and month.

Use database unique constraints and transactional logic.

Only active enrollments should generate new monthly obligations.

Preserve historical obligations after a member withdraws.

Do not generate future obligations after the effective withdrawal date.

Define and document how enrollment dates and withdrawal dates affect monthly obligations, especially when enrollment or withdrawal happens in the middle of a month.

---

# 8. CONTRIBUTION PAYMENTS AND ALLOCATIONS

A member may pay contributions in different ways.

Examples:

- Pay one month.
- Pay several months at once.
- Pay only part of an obligation.
- Pay outstanding obligations together with the current month.

Therefore, do not assume one payment corresponds to one monthly obligation.

Use two related tables:

### `contribution_payments`

Stores the actual payment received.

Suggested fields:

- ID.
- Member ID.
- Fund ID.
- Payment date.
- Amount.
- Receipt number.
- Treasury transaction ID.
- Recorded by.
- Notes.
- Created at.

### `contribution_payment_allocations`

Connects payments to one or more obligations.

Suggested fields:

- ID.
- Payment ID.
- Obligation ID.
- Allocated amount.
- Created at.

### Example

A member owes:

| Month | Expected | Paid |
|---|---:|---:|
| January | 5,000 | 0 |
| February | 5,000 | 0 |
| March | 5,000 | 0 |

The member pays 12,000 in March.

The system should allocate:

- January: 5,000.
- February: 5,000.
- March: 2,000.

Remaining March balance: 3,000.

The system must support both automatic allocation and manually selected allocations if appropriate.

### Financial validation

Enforce these rules on the backend:

- Allocations cannot exceed the actual payment amount.
- Allocations cannot exceed the remaining obligation amount.
- Payment and obligation must belong to the same member.
- Payment and obligation must belong to the same fund.
- A payment cannot be used to pay obligations belonging to another fund.
- Amounts must be positive.
- All allocations and corresponding treasury entries must be processed transactionally.

Never trust frontend validation alone.

---

# 9. CONTRIBUTION STATUS CALCULATION

Do not store a manually maintained contribution status column.

Calculate contribution status dynamically using:

- Expected obligations.
- Amounts allocated.
- Due dates.
- Enrollment status.

Calculate status independently for each fund.

Possible statuses:

1. NOT A CONTRIBUTOR
2. UP TO DATE
3. PARTIALLY PAID
4. PENDING
5. IN ARREARS

Rules:

- A member not enrolled in a fund is NOT A CONTRIBUTOR.
- An obligation with no payment is unpaid.
- An obligation with a partial payment is partially paid.
- An unpaid obligation whose due date has not passed is pending.
- An unpaid or partially paid obligation whose due date has passed is in arrears.
- A member with all currently due obligations fully paid is up to date.
- Future obligations must not make a member appear overdue.

Display financial information clearly in the member profile.

Example:

| Fund | Expected | Paid | Outstanding | Status |
|---|---:|---:|---:|---|
| Social | 50,000 | 50,000 | 0 | Up to date |
| Auto-development | 60,000 | 40,000 | 20,000 | Partially paid |

The displayed figures must be calculated from actual obligations and allocations.

---

# 10. SOCIAL ASSISTANCE

The social fund must support assistance for registered family members.

### Assistance types

Create a configurable list of assistance types.

Examples:

- Marriage.
- Illness.
- Death.
- Other.

Each assistance type has a configurable default amount.

The administrator can change the default amount for future assistance records.

### Historical amount preservation

When an assistance record is created, snapshot the applicable amount.

Changing the default amount later must never change historical assistance records.

### Assistance records

Suggested fields:

- ID.
- Beneficiary member ID.
- Assistance type ID.
- Amount snapshot.
- Request date.
- Approval date.
- Disbursement date.
- Description.
- Status.
- Treasury transaction ID.
- Recorded by.
- Created at.

### Assistance workflow

Support the following stages:

1. Requested.
2. Approved.
3. Disbursed.
4. Rejected, where applicable.

Important:

An assistance request or approval is not yet a treasury expense.

Only when the assistance is actually disbursed should the system create an EXIT transaction in the SOCIAL fund.

The assistance record and treasury transaction must be created or updated atomically.

Never record assistance expenses against the auto-development fund.

---

# 11. TREASURY MANAGEMENT

Implement a central treasury transaction table.

Each transaction must belong to exactly one fund.

Suggested fields:

- ID.
- Fund ID.
- Transaction date.
- Transaction type.
- Amount.
- Description / Libellé.
- Reference number.
- Source information.
- Recorded by.
- Created at.
- Updated at.

Transaction classifications should support:

- ENTRY.
- EXIT.
- OPENING_BALANCE.

Use a clear and consistent accounting model for opening balances.

Opening balances must be recorded independently for SOCIAL and AUTO_DEVELOPMENT.

Do not silently initialize a fund with an unexplained balance.

### Treasury entries

Examples:

- Monthly contribution received.
- Joining fee received.
- Opening balance.

### Treasury exits

Examples:

- Social assistance disbursement.
- Purchase of family land.
- Purchase of agricultural tools.
- Other approved development expenses.

### Important simplification

Do not create separate `development_purchases` or `family_assets` tables.

Purchases and investments are simply EXIT transactions recorded in the AUTO_DEVELOPMENT treasury journal with a meaningful description.

For example:

`Purchase of family agricultural land`

### Transaction integrity

When a contribution payment is recorded:

1. Create the contribution payment.
2. Create its treasury ENTRY.
3. Create payment allocations.
4. Commit everything in one database transaction.

If one operation fails, roll back all operations.

For social assistance disbursement:

1. Update the assistance record.
2. Create the social treasury EXIT.
3. Link both records.
4. Commit atomically.

Never allow one side to succeed while the other fails.

### Financial corrections

Never hard-delete financial transactions or contribution payment history.

Use reversals or adjustment transactions with descriptions and audit history.

Maintain traceability.

---

# 12. ACCOUNTING PERIODS AND MONTHLY CLOSING

Implement monthly accounting periods.

Suggested table:

`accounting_periods`

Fields:

- ID.
- Year.
- Month.
- Start date.
- End date.
- Status: OPEN or CLOSED.
- Closed at.
- Closed by.

Implement:

`fund_period_closings`

Fields:

- ID.
- Accounting period ID.
- Fund ID.
- Opening balance.
- Total entries.
- Total exits.
- Closing balance.
- Closed at.

There must be one closing record per fund per accounting period.

### Monthly closing

Calculate separately for each fund:

Closing balance = Opening balance + Total entries - Total exits.

The monthly closing process must:

- Calculate the opening balance.
- Calculate total entries.
- Calculate total exits.
- Calculate closing balance.
- Save a closing snapshot for each fund.
- Mark the accounting period as closed when both fund closings are completed.

Once closed, ordinary financial transactions for that period must be blocked.

If a correction is necessary, provide a controlled correction process with an audit trail.

Do not allow the social balance to affect the auto-development balance or vice versa.

---

# 13. FINANCIAL REPORTS

Generate reports from actual financial records.

Do not create unnecessary report tables for information that can be calculated from existing transactions.

Required reports:

### Dashboard
- Total family members.
- Total descendants.
- Number of contributors.
- Contributors by fund.
- Social fund balance.
- Auto-development fund balance.
- Recent financial transactions.
- Outstanding contributions.
- Monthly collection overview.

### Treasury reports
- Monthly treasury report.
- Social fund journal.
- Auto-development fund journal.
- Combined overview, for display only.
- Opening balances.
- Total entries.
- Total exits.
- Closing balances.

### Contribution reports
- Monthly contribution summary.
- Contributions by member.
- Contributions by fund.
- Expected contributions.
- Actual payments.
- Outstanding balances.
- Unpaid obligations.
- Partially paid obligations.
- Members in arrears.
- Members who are up to date.

### Social assistance reports
- Assistance history.
- Assistance by type.
- Assistance by beneficiary.
- Total social assistance disbursed.
- Pending requests.
- Approved but not yet disbursed assistance.

### Member financial statement

Each member should have a financial statement showing:

- Enrollment in each fund.
- Joining fee obligations.
- Monthly obligations.
- Payments.
- Payment allocations.
- Outstanding amounts.
- Contribution status by fund.
- Social assistance received, if any.

Reports should support useful date filters and printing or PDF export.

---

# 14. AUTHENTICATION AND USERS

Initially, there is only one administrator/treasurer.

The application must not have a public registration page.

The system administrator account should be created through a secure initial seeder or setup process.

### Users table

Suggested fields:

- ID.
- Username.
- Password hash.
- Optional member ID.
- Role.
- Active status.
- Created at.
- Updated at.

Requirements:

- Login.
- Logout.
- Protected application routes.
- Password hashing with a suitable secure password-hashing algorithm.
- Secure session handling.
- HTTP-only cookies where cookie-based authentication is used.
- CSRF protection when required.
- Login rate limiting.
- No public registration.
- No plaintext passwords.
- Do not commit real administrator credentials into source control.

Use environment variables or a secure initial setup process for administrator credentials.

Design the architecture so additional authorized users can be supported in the future without redesigning the entire system.

---

# 15. AUDIT LOGS

Create an `audit_logs` table.

Record important financial and administrative changes.

Examples:

- Member creation and updates.
- Contributor enrollment.
- Withdrawal from a fund.
- Contribution rate changes.
- Payment registration.
- Payment allocation changes.
- Treasury transactions.
- Assistance approval.
- Assistance disbursement.
- Accounting period closing.
- Financial corrections.

Store:

- User ID.
- Action.
- Entity type.
- Entity ID.
- Description or structured change details.
- Timestamp.

Do not allow ordinary users to modify or delete audit records.

---

# 16. PROPOSED DATABASE TABLES

Use the following as the initial database inventory.

1. `members`
2. `funds`
3. `contributor_enrollments`, only if a general member-level enrollment record provides a real business benefit.
4. `member_fund_enrollments`
5. `contribution_rates`
6. `contribution_obligations`
7. `contribution_payments`
8. `contribution_payment_allocations`
9. `assistance_types`
10. `social_assistance`
11. `treasury_transactions`
12. `accounting_periods`
13. `fund_period_closings`
14. `users`
15. `audit_logs`

You may refine this inventory when necessary, but explain every additional table and why it is needed.

Do not introduce:

- Separate children/grandchildren tables.
- `development_purchases`.
- `family_assets`.
- A manually maintained contribution status table.
- Unnecessary report tables.
- Fund-to-fund transfer records.

The actual enrollment in a fund must be independently represented.

Avoid redundant enrollment tables unless they serve a clearly justified purpose.

---

# 17. DATABASE DESIGN AND CONSTRAINTS

Design a normalized relational database.

Use appropriate:

- Primary keys.
- Foreign keys.
- Unique constraints.
- Indexes.
- Check constraints where supported.
- Referential integrity.
- Transactional operations.

Important constraints include:

- Unique member number.
- No member can be their own father or mother.
- No duplicate monthly obligation for the same enrollment and period.
- One monthly closing per fund per accounting period.
- Positive financial amounts.
- Payment allocation cannot exceed the payment amount.
- Payment allocation cannot exceed the remaining obligation.
- Payment and obligation must belong to the same member and fund.
- Every treasury transaction must belong to one fund.
- No transfer between funds.
- Preserve financial history.
- Prevent ordinary transactions in closed accounting periods.

MySQL does not support PostgreSQL-style partial unique indexes in the same way. Implement active-enrollment uniqueness safely using an appropriate schema and transactional application validation.

Use `DECIMAL` for financial amounts rather than JavaScript floating-point arithmetic.

Document how amounts are handled in JavaScript to prevent precision errors.

---

# 18. BACKEND ARCHITECTURE

Organize the backend into clear layers:

- Configuration.
- Models.
- Associations.
- Controllers.
- Services.
- Routes.
- Middleware.
- Validators.
- Utilities.
- Migrations.
- Seeders.

### Models

Use class-based Sequelize models.

Example style:

```javascript
import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database.js";

class Member extends Model {}

Member.init(
    {
        first_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        last_name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        father_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        mother_id: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    },
    {
        sequelize,
        modelName: "Member",
        tableName: "members",
        timestamps: true,
        underscored: true
    }
);

export default Member;
```

Create a central model association file.

Do not put all business logic inside models or controllers.

### Controllers

Use class-based controllers.

Example:

```javascript
class MemberController {
    constructor(memberService) {
        this.memberService = memberService;
    }

    getAll = async (req, res, next) => {
        try {
            const members = await this.memberService.getAll();

            res.json({
                success: true,
                data: members
            });
        } catch (error) {
            next(error);
        }
    };
}

export default MemberController;
```

Use arrow-function handlers or another safe binding strategy to preserve `this` when Express calls controller methods.

### Services

Create services for important business processes, including:

- MemberService.
- GenealogyService.
- EnrollmentService.
- ContributionService.
- ObligationService.
- TreasuryService.
- AssistanceService.
- AccountingService.
- ReportService.
- AuthService.

Complex financial operations belong in services and must use Sequelize database transactions.

### API

Use RESTful API routes.

Return consistent JSON responses.

Implement centralized error handling.

Validate all incoming data on the backend.

Never rely exclusively on frontend validation.

---

# 19. FRONTEND ARCHITECTURE

Use vanilla JavaScript with ES modules.

Organize the frontend into reusable modules.

Suggested structure:

```text
src/
├── js/
│   ├── app.js
│   ├── router.js
│   ├── components/
│   │   ├── sidebar.js
│   │   ├── bottom-nav.js
│   │   ├── offcanvas.js
│   │   ├── header.js
│   │   ├── modal.js
│   │   ├── table.js
│   │   ├── form.js
│   │   └── notification.js
│   ├── pages/
│   │   ├── dashboard.js
│   │   ├── login.js
│   │   ├── genealogy.js
│   │   ├── members.js
│   │   ├── member-profile.js
│   │   ├── contributions.js
│   │   ├── treasury.js
│   │   ├── assistance.js
│   │   ├── reports.js
│   │   └── settings.js
│   ├── services/
│   │   └── api.js
│   ├── utils/
│   └── styles/
└── input.css
```

The frontend must communicate with the backend through a centralized API service.

Use reusable components and avoid duplicating markup and JavaScript logic.

Implement proper loading states, error states, empty states, confirmation dialogs, and success notifications.

Never display a successful payment message before the backend confirms the transaction.

---

# 20. PWA REQUIREMENTS

Implement a proper Progressive Web App.

Include:

- `manifest.webmanifest`.
- Service worker.
- Application icons in 192px and 512px sizes.
- Installability on supported devices.
- Offline caching of the application shell.
- Update detection and update notification.
- Appropriate theme colors.
- Responsive layouts.

Important financial safety requirement:

Offline access may display cached application content, but do not pretend that financial operations succeeded while offline.

Initially, require a live server connection for financial mutations.

Do not queue payments or treasury transactions offline unless a deliberate, secure synchronization and conflict-resolution system is designed.

---

# 21. SECURITY AND DATA INTEGRITY

This application handles family information and financial records.

Implement appropriate protections:

- Secure authentication.
- Password hashing.
- Input validation.
- SQL injection protection through Sequelize and validated queries.
- XSS protection.
- CSRF protection where necessary.
- Rate limiting.
- Secure HTTP headers.
- Environment-based secrets.
- Restricted CORS.
- Protected API endpoints.
- Audit logging.
- Database transactions for financial operations.
- No hard deletion of financial history.
- No public registration.

Do not expose sensitive financial or personal information unnecessarily.

---

# 22. DEVELOPMENT WORKFLOW

Build the application progressively.

Do not generate the entire project as a collection of disconnected code snippets.

Follow these phases:

### Phase 1 — Architecture and database
1. Review all requirements.
2. Produce the final ERD.
3. Explain all relationships.
4. Define the final database schema.
5. Identify unique constraints and indexes.
6. Explain financial integrity rules.
7. Confirm the migration and ESM setup.

Do not begin implementing frontend pages before the database structure is clear.

### Phase 2 — Project setup
1. Create project directories.
2. Configure Node.js and Express.
3. Configure ESM.
4. Configure Sequelize.
5. Configure MySQL.
6. Configure sequelize-cli migrations and seeders with ESM.
7. Configure Tailwind CSS.
8. Configure environment variables.
9. Configure development scripts.

### Phase 3 — Database implementation
1. Create migrations.
2. Create seeders.
3. Create class-based models.
4. Define associations.
5. Seed the two initial funds.
6. Seed initial assistance types where appropriate.
7. Create the administrator through a secure setup process.
8. Seed the Nzombokwe root member only if its initial information is available and confirmed.

### Phase 4 — Backend implementation
Implement in this order:

1. Authentication.
2. Member management.
3. Genealogy.
4. Fund enrollment.
5. Contribution rates.
6. Obligation generation.
7. Contribution payments and allocations.
8. Treasury.
9. Social assistance.
10. Accounting periods and closing.
11. Reports.
12. Audit logs.

### Phase 5 — Frontend implementation
Implement:

1. Login.
2. Dashboard.
3. Members.
4. Genealogy.
5. Member profiles.
6. Fund enrollment.
7. Contributions.
8. Treasury journals.
9. Social assistance.
10. Reports.
11. Settings.

### Phase 6 — PWA and responsive design
Implement installability, caching, responsive navigation, and update handling.

### Phase 7 — Testing
Test the actual business rules, not just whether pages render.

---

# 23. REQUIRED BUSINESS LOGIC TESTS

Create automated tests for at least the following scenarios.

### Genealogy
- Register Nzombokwe.
- Register a child.
- Register a grandchild.
- Retrieve descendants.
- Reject invalid parent relationships.
- Prevent a member from being their own parent.

### Enrollment
- Register a member without enrolling them in any fund.
- Enroll a member in SOCIAL only.
- Enroll another member in AUTO_DEVELOPMENT only.
- Enroll one member in both funds.
- Withdraw from one fund without affecting the other.
- Allow re-enrollment while preserving historical records.

### Contributions
- Generate monthly obligations.
- Run the generator twice without creating duplicates.
- Change contribution rates without changing old obligations.
- Create joining fee obligations separately for each fund.
- Make partial payments.
- Pay several months using one payment.
- Reject allocations exceeding the payment.
- Reject allocations belonging to another member or fund.
- Calculate contribution status correctly.

### Treasury
- Record opening balances independently.
- Record contribution entries.
- Record social assistance exits.
- Record development exits.
- Verify independent balances.
- Verify that no transaction can transfer money between funds.
- Verify atomicity when one part of a financial operation fails.

### Social assistance
- Create an assistance request.
- Approve a request without creating a treasury exit.
- Disburse assistance and create the corresponding SOCIAL exit.
- Change the default assistance amount without modifying historical records.

### Accounting
- Calculate monthly totals.
- Close a monthly accounting period.
- Verify opening and closing balances.
- Prevent ordinary transactions in a closed period.
- Preserve the audit trail for corrections.

---

# 24. IMPLEMENTATION RULES FOR THE AI AGENT

Follow these instructions throughout development:

1. Do not silently change the specified technology stack.
2. Do not use TypeScript.
3. Do not introduce frontend frameworks.
4. Do not mix the two funds.
5. Do not automatically make every family member a contributor.
6. Do not store contribution status as manually maintained data.
7. Do not create development purchase or family asset tables.
8. Do not hard-delete financial records.
9. Do not create treasury transactions outside the appropriate database transaction.
10. Do not use floating-point arithmetic for financial calculations.
11. Do not allow payments to cross fund boundaries.
12. Do not generate duplicate monthly obligations.
13. Do not modify historical financial amounts when configuration changes.
14. Do not create a public registration page.
15. Do not implement fake financial operations or simulated success responses.
16. Do not leave important business logic as TODO comments.
17. Do not create unnecessary abstractions or overcomplicate the architecture.
18. Write readable, maintainable code with clear naming.
19. Document important technical decisions.
20. Use migrations as the source of truth for database structure.
21. Do not use Sequelize `sync({ alter: true })` as a replacement for migrations in production.
22. Never commit secrets or real credentials.
23. Keep the implementation consistent with the business rules throughout all layers.

If a requirement is ambiguous, identify it and ask a focused question rather than inventing a business rule.

---

# 25. FIRST RESPONSE EXPECTED FROM THE AI AGENT

Before writing application code, provide:

1. A concise architecture overview.
2. The proposed final database ERD.
3. A table-by-table explanation.
4. Important relationships and foreign keys.
5. A clear explanation of how fund separation is enforced.
6. How monthly obligations and payment allocations work.
7. How treasury transactions remain atomic.
8. How ESM migrations will work with the selected sequelize-cli version.
9. The proposed project folder structure.
10. Any essential unresolved business questions.

Wait for approval of the database design before proceeding to implementation.

The final objective is a reliable, maintainable, secure, responsive family genealogy and financial management application for the Nzombokwe family.
