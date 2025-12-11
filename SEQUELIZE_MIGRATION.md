# Migration from TypeORM to Sequelize

This project has been converted from TypeORM to Sequelize. Here's what changed and how to use it.

## Changes Made

### 1. Dependencies Updated
- **Removed:** `typeorm`, `reflect-metadata`
- **Added:** `sequelize`, `pg-hstore`, `sequelize-cli`

### 2. Project Structure Changes

**Before (TypeORM):**
```
src/
  entities/
    User.ts
    Address.ts
  config/
    database.ts (TypeORM DataSource)
```

**After (Sequelize):**
```
src/
  models/
    User.ts
    Address.ts
    index.ts (associations)
  config/
    database.ts (Sequelize instance)
```

### 3. Key Differences

#### Database Connection
- **TypeORM:** `DataSource` with `initialize()`
- **Sequelize:** `Sequelize` instance with `authenticate()` and `sync()`

#### Models
- **TypeORM:** Decorators (`@Entity`, `@Column`, etc.)
- **Sequelize:** `Model.init()` with `DataTypes`

#### Transactions
- **TypeORM:** `QueryRunner` with `startTransaction()`, `commitTransaction()`, `rollbackTransaction()`
- **Sequelize:** `sequelize.transaction()` callback or async/await pattern

#### Queries
- **TypeORM:** `manager.findOne()`, `manager.save()`, `manager.count()`
- **Sequelize:** `Model.findByPk()`, `Model.create()`, `Model.count()`

## Installation

```bash
# Install dependencies
npm install
# or
pnpm install
# or
yarn install
```

## Usage

The API endpoints and functionality remain the same. The transaction behavior is identical:

1. **Success Scenario:** Creates user and addresses, commits transaction
2. **Rollback Scenario:** Creates user and addresses, waits 10 seconds, throws error, rolls back everything

## Transaction Example (Sequelize)

```typescript
// Start transaction
const transaction = await sequelize.transaction();

try {
  // Create user within transaction
  const user = await User.create(
    { name: 'John', email: 'john@example.com' },
    { transaction }
  );

  // Create address within transaction
  const address = await Address.create(
    { street: '123 Main St', userId: user.id },
    { transaction }
  );

  // Commit transaction
  await transaction.commit();
} catch (error) {
  // Rollback on error
  await transaction.rollback();
  throw error;
}
```

## Testing

All tests have been updated to work with Sequelize:
- Unit tests: `src/tests/transactionService.test.ts`
- Integration tests: `src/tests/integration.test.ts`
- Manual test: `npm run test:manual`

## Notes

- Sequelize uses `sync()` to create tables (use migrations in production)
- Associations are defined in `src/models/index.ts`
- The 10-second delay in rollback scenario still works the same way
- All API endpoints remain unchanged

