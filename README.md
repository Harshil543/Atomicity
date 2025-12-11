# Atomicity Demo - Node.js TypeScript Project

This project demonstrates database atomicity concepts using PostgreSQL transactions with Sequelize. It implements a User-Address relationship where one user can have multiple addresses, and ensures that all operations are atomic (all-or-nothing).

## Features

- **User and Address Models**: One-to-many relationship (1 user → many addresses)
- **Transaction Support**: All database operations use transactions
- **Atomicity**: If any part of a transaction fails, the entire transaction is rolled back
- **Comprehensive Tests**: Tests for both success and rollback scenarios

## Project Structure

```
Atomicity/
├── src/
│   ├── config/
│   │   └── database.ts          # Sequelize database configuration
│   ├── models/
│   │   ├── User.ts              # User model
│   │   ├── Address.ts           # Address model
│   │   └── index.ts             # Model associations
│   ├── services/
│   │   └── transactionService.ts # Transaction service with commit/rollback
│   ├── routes/
│   │   └── userRoutes.ts        # API routes
│   ├── tests/
│   │   ├── setup.ts             # Test setup
│   │   ├── transactionService.test.ts  # Unit tests
│   │   └── integration.test.ts  # Integration tests
│   ├── scripts/
│   │   └── manualTest.ts        # Manual test script
│   └── index.ts                 # Main application entry
├── docker-compose.yml           # PostgreSQL database setup
├── package.json
├── tsconfig.json
└── README.md
```

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- npm, pnpm, or yarn

## Setup Instructions

### 1. Start PostgreSQL Database

```bash
docker-compose up -d
```

This will start a PostgreSQL container on port 5432 with:
- Username: `admin`
- Password: `admin123`
- Database: `mydb`

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory (optional, defaults are already set):

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=admin
DB_PASSWORD=admin123
DB_NAME=mydb
PORT=3000
```

### 4. Build the Project

```bash
npm run build
```

### 5. Run the Application

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Create User with Addresses (Success Scenario)
```bash
POST /api/users
Content-Type: application/json

{
  "user": {
    "name": "John Doe",
    "email": "john.doe@example.com"
  },
  "addresses": [
    {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    {
      "street": "456 Oak Ave",
      "city": "Los Angeles",
      "state": "CA",
      "zipCode": "90001",
      "country": "USA"
    }
  ]
}
```

### Create User with Addresses (Rollback Test)
```bash
POST /api/users/rollback-test
Content-Type: application/json

{
  "user": {
    "name": "Test User",
    "email": "test@example.com"
  },
  "addresses": [
    {
      "street": "789 Test St",
      "city": "Test City",
      "state": "TS",
      "zipCode": "12345",
      "country": "USA"
    }
  ]
}
```
This endpoint intentionally fails to demonstrate rollback behavior. When an error occurs, the entire transaction is rolled back and no data is saved.

### Get All Users with Addresses
```bash
GET /api/users
```

### Get User by ID with Addresses
```bash
GET /api/users/:id
```

### Delete User (Cascade Delete Addresses)
```bash
DELETE /api/users/:id
```

### Health Check
```bash
GET /health
```

## Testing

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Manual Test Script
To see a live demonstration of both success and rollback scenarios:
```bash
npm run test:manual
```

This script will:
- Create a user with addresses (success scenario)
- Attempt to create a user with addresses but force a failure (rollback scenario)
- Verify that rollback worked correctly
- Display a summary of all data in the database

### Run Isolation Tests
To test isolation levels:
```bash
npm test -- isolationService.test.ts
```

This will test:
- Dirty Read (Read Uncommitted)
- Read Committed (No Dirty Read)
- Repeatable Read
- Non-Repeatable Read
- Phantom Read
- Lost Update
- Serializable isolation

### Run Consistency Tests
To test consistency:
```bash
npm test -- consistencyService.test.ts
```

This will test:
- Unique Constraint
- Not Null Constraint
- Foreign Key Constraint
- Cascade Delete (Referential Integrity)
- Data Type Consistency
- Business Rule Consistency
- Transaction Consistency

## Testing with Postman

### Import Postman Collection

1. Open Postman
2. Click **Import** button
3. Select the `postman_collection.json` file from the project root
4. The collection will be imported with all pre-configured requests

### Testing Success Scenario (Transaction Commit)

**Step 1: Start the server**
```bash
npm run dev
```

**Step 2: Test Success Scenario**

1. In Postman, select **"Success Scenario - Create User with Addresses"**
2. Method: `POST`
3. URL: `http://localhost:3000/api/users`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
```json
{
  "user": {
    "name": "John Doe",
    "email": "john.doe@example.com"
  },
  "addresses": [
    {
      "street": "123 Main Street",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    {
      "street": "456 Oak Avenue",
      "city": "Los Angeles",
      "state": "CA",
      "zipCode": "90001",
      "country": "USA"
    }
  ]
}
```

6. Click **Send**

**Expected Response (201 Created):**
```json
{
  "message": "User and addresses created successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    },
    "addresses": [
      {
        "id": 1,
        "street": "123 Main Street",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA",
        "userId": 1
      },
      {
        "id": 2,
        "street": "456 Oak Avenue",
        "city": "Los Angeles",
        "state": "CA",
        "zipCode": "90001",
        "country": "USA",
        "userId": 1
      }
    ]
  }
}
```

**Step 3: Verify Data Persisted**

1. Select **"Get All Users with Addresses"**
2. Method: `GET`
3. URL: `http://localhost:3000/api/users`
4. Click **Send**

You should see the user and addresses you just created, confirming the transaction was committed.

### Testing Rollback Scenario (Transaction Failure)

**Step 1: Test Rollback Scenario**

1. In Postman, select **"Rollback Scenario - Transaction Failure"**
2. Method: `POST`
3. URL: `http://localhost:3000/api/users/rollback-test`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
```json
{
  "user": {
    "name": "Bob Smith",
    "email": "bob.smith@example.com"
  },
  "addresses": [
    {
      "street": "789 Failure Lane",
      "city": "Failure City",
      "state": "FC",
      "zipCode": "99999",
      "country": "USA"
    }
  ]
}
```

6. Click **Send**

**Expected Response (500 Internal Server Error):**
```json
{
  "error": "Transaction rolled back as expected",
  "message": "Simulated transaction failure for testing rollback"
}
```

**Step 2: Verify Data NOT Persisted (Rollback Worked)**

1. Select **"Get All Users with Addresses"**
2. Method: `GET`
3. URL: `http://localhost:3000/api/users`
4. Click **Send**

**Important:** You should **NOT** see `bob.smith@example.com` in the response. This confirms that:
- The transaction was rolled back
- The user was NOT created
- The addresses were NOT created
- **Atomicity is working correctly!**

### Complete Testing Flow

**Recommended Testing Sequence:**

1. ✅ **Health Check** - Verify server is running
2. ✅ **Success Scenario** - Create user with addresses (should succeed)
3. ✅ **Get All Users** - Verify user and addresses exist
4. ✅ **Rollback Scenario** - Attempt to create user (should fail)
5. ✅ **Get All Users** - Verify rollback user does NOT exist
6. ✅ **Compare Results** - Only the success scenario user should exist

### Postman Collection Features

The imported collection includes:
- Pre-configured requests for all endpoints
- Test scripts that automatically verify responses
- Environment variables for easy URL management
- Detailed descriptions for each endpoint

### Manual Postman Setup (Without Collection)

If you prefer to set up requests manually:

**Success Endpoint:**
- Method: `POST`
- URL: `http://localhost:3000/api/users`
- Body: JSON with user and addresses data

**Rollback Endpoint:**
- Method: `POST`
- URL: `http://localhost:3000/api/users/rollback-test`
- Body: JSON with user and addresses data (will intentionally fail)

**Verification Endpoint:**
- Method: `GET`
- URL: `http://localhost:3000/api/users`
- Use this to verify which data was persisted

## How Atomicity Works

### Transaction Flow

1. **Start Transaction**: `sequelize.transaction()`
2. **Execute Operations**:
   - Create user within transaction
   - Create addresses within transaction
   - If any error occurs → go to step 3
3. **Commit or Rollback**:
   - **Success**: `transaction.commit()` - All changes are saved
   - **Failure**: `transaction.rollback()` - All changes are discarded

## How Isolation Works

### What is Isolation?

Isolation ensures that concurrent transactions do not interfere with each other. Each transaction should appear to be the only one operating on the database at that time.

### Isolation Levels

#### 1. Read Uncommitted (Lowest)
- **Allows**: Dirty reads, non-repeatable reads, phantom reads
- **Use Case**: Rarely used, lowest performance overhead
- **Example**: Transaction 2 can read uncommitted data from Transaction 1

#### 2. Read Committed (Default in PostgreSQL)
- **Prevents**: Dirty reads
- **Allows**: Non-repeatable reads, phantom reads
- **Use Case**: Most common default, good balance
- **Example**: Transaction 2 cannot read uncommitted data, but may see different values in subsequent reads

#### 3. Repeatable Read
- **Prevents**: Dirty reads, non-repeatable reads
- **Allows**: Phantom reads
- **Use Case**: When you need consistent reads within a transaction
- **Example**: Transaction 1 sees the same value in all reads, even if Transaction 2 updates the data

#### 4. Serializable (Highest)
- **Prevents**: Dirty reads, non-repeatable reads, phantom reads
- **Use Case**: Highest data integrity, but may cause deadlocks
- **Example**: Transactions are completely isolated, executed sequentially

### Isolation Phenomena

1. **Dirty Read**: Reading uncommitted data from another transaction
2. **Non-Repeatable Read**: Same query returns different results within a transaction
3. **Phantom Read**: New rows appear in subsequent reads within a transaction
4. **Lost Update**: Two transactions update the same record, one overwrites the other

### Example: Isolation in Action

```typescript
// Transaction 1 with Read Committed
const transaction1 = await sequelize.transaction({
  isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
});

// Transaction 2 with Read Committed
const transaction2 = await sequelize.transaction({
  isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
});

// Transaction 1: Update user
await User.update(
  { name: 'Updated Name' },
  { where: { id: 1 }, transaction: transaction1 }
);

// Transaction 2: Read user (sees old value - no dirty read)
const user = await User.findByPk(1, { transaction: transaction2 });

// Transaction 1: Commit
await transaction1.commit();

// Transaction 2: Read again (now sees new value)
const user2 = await User.findByPk(1, { transaction: transaction2 });
```

### Example: Success Scenario

```typescript
// Start transaction
const transaction = await sequelize.transaction();

try {
  // Create user within transaction
  const user = await User.create(
    { name: 'John', email: 'john@example.com' },
    { transaction }
  );

  // Create addresses within transaction
  const address1 = await Address.create(
    { street: '123 Main St', userId: user.id },
    { transaction }
  );
  const address2 = await Address.create(
    { street: '456 Oak Ave', userId: user.id },
    { transaction }
  );

  // Commit - all changes are saved
  await transaction.commit();
} catch (error) {
  // Rollback on error
  await transaction.rollback();
  throw error;
}
```

### Example: Rollback Scenario

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

  // Error occurs!
  throw new Error('Something went wrong');

  // Rollback - all changes are discarded
  await transaction.rollback();
  // User and addresses are NOT saved to database
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

## Database Schema

### Users Table
- `id` (Primary Key, Auto-increment)
- `name` (VARCHAR)
- `email` (VARCHAR, Unique)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

### Addresses Table
- `id` (Primary Key, Auto-increment)
- `street` (VARCHAR)
- `city` (VARCHAR)
- `state` (VARCHAR)
- `zipCode` (VARCHAR)
- `country` (VARCHAR)
- `user_id` (Foreign Key → users.id, CASCADE DELETE)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

## Isolation (I of ACID) - Implementation

This project demonstrates **Isolation** - ensuring concurrent transactions do not interfere with each other.

### Isolation Levels Demonstrated

1. **Read Uncommitted** - Lowest isolation, allows dirty reads
2. **Read Committed** - Prevents dirty reads, allows non-repeatable reads
3. **Repeatable Read** - Same query returns same results within a transaction
4. **Serializable** - Highest isolation, transactions are completely isolated

### Isolation Endpoints

#### 1. Dirty Read (Read Uncommitted)
```bash
POST /api/isolation/dirty-read/:userId
```
Demonstrates that Transaction 2 can read uncommitted data from Transaction 1.

#### 2. Read Committed (No Dirty Read)
```bash
POST /api/isolation/read-committed/:userId
```
Demonstrates that Transaction 2 cannot read uncommitted data. It only sees changes after Transaction 1 commits.

#### 3. Repeatable Read
```bash
POST /api/isolation/repeatable-read/:userId
```
Demonstrates that Transaction 1 sees the same value in all reads, even if Transaction 2 updates the data.

#### 4. Non-Repeatable Read
```bash
POST /api/isolation/non-repeatable-read/:userId
```
Demonstrates that in Read Committed level, subsequent reads may return different values.

#### 5. Phantom Read
```bash
POST /api/isolation/phantom-read
```
Demonstrates that new rows can appear in subsequent reads within the same transaction.

#### 6. Lost Update
```bash
POST /api/isolation/lost-update/:userId
```
Demonstrates the lost update problem where two transactions update the same record and one update is lost.

#### 7. Serializable
```bash
POST /api/isolation/serializable/:userId
```
Demonstrates the highest isolation level where transactions are completely isolated.

### Testing Isolation

**Example: Test Dirty Read**
1. Create a user first: `POST /api/users`
2. Note the user ID from the response
3. Test dirty read: `POST /api/isolation/dirty-read/{userId}`
4. Observe that Transaction 2 can read uncommitted data

**Example: Test Read Committed**
1. Test read committed: `POST /api/isolation/read-committed/{userId}`
2. Observe that Transaction 2 cannot read uncommitted data
3. After Transaction 1 commits, Transaction 2 can see the changes

## Consistency (C of ACID) - Implementation

This project demonstrates **Consistency** - ensuring that transactions bring the database from one valid state to another, maintaining all constraints, rules, and integrity.

### Consistency Concepts Demonstrated

1. **Unique Constraints** - Prevents duplicate values 
2. **Not Null Constraints** - Ensures required fields are present
3. **Foreign Key Constraints** - Maintains referential integrity
4. **Cascade Delete** - Automatically maintains relationships
5. **Data Type Consistency** - Validates data types
6. **Business Rule Consistency** - Enforces custom business rules
7. **Transaction Consistency** - Ensures database remains consistent even on failure

### Consistency Endpoints

#### 1. Unique Constraint
```bash
POST /api/consistency/unique-constraint
```
Demonstrates that duplicate emails are prevented by unique constraint.

#### 2. Not Null Constraint
```bash
POST /api/consistency/not-null-constraint
```
Demonstrates that required fields cannot be null.

#### 3. Foreign Key Constraint
```bash
POST /api/consistency/foreign-key-constraint
```
Demonstrates that addresses must reference valid users.

#### 4. Cascade Delete
```bash
POST /api/consistency/cascade-delete
```
Demonstrates that deleting a user automatically deletes associated addresses.

#### 5. Data Type Consistency
```bash
POST /api/consistency/data-type
```
Demonstrates that invalid data types are rejected.

#### 6. Business Rule Consistency
```bash
POST /api/consistency/business-rules
Content-Type: application/json

{
  "user": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "addresses": [
    {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  ]
}
```
Validates business rules (email format, name length, zip code format, etc.).

#### 7. Transaction Consistency
```bash
POST /api/consistency/transaction-consistency
```
Demonstrates that database remains consistent even when transaction fails partway.

### Testing Consistency

**Example: Test Unique Constraint**
```bash
POST /api/consistency/unique-constraint
```

**Example: Test Business Rules**
```bash
POST /api/consistency/business-rules
{
  "user": {
    "name": "AB",  // Too short - will fail
    "email": "invalid-email"  // Missing @ - will fail
  },
  "addresses": [
    {
      "street": "123 Test St",
      "city": "Test City",
      "state": "TS",
      "zipCode": "123",  // Invalid format - will fail
      "country": "USA"
    }
  ]
}
```

## Key Concepts Demonstrated

1. **ACID Properties**: 
   - **Atomicity (A)**: All-or-nothing transactions
   - **Consistency (C)**: Database remains in valid state
   - **Isolation (I)**: Concurrent transactions don't interfere
2. **Transaction Management**: Using Sequelize transactions with isolation levels
3. **Error Handling**: Proper rollback on failures
4. **Data Integrity**: Maintaining referential integrity through constraints
5. **One-to-Many Relationships**: User → Addresses
6. **Isolation Levels**: Read Uncommitted, Read Committed, Repeatable Read, Serializable
7. **Database Constraints**: Unique, Not Null, Foreign Key, Cascade Delete
8. **Business Rules**: Custom validation rules enforced within transactions

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **ORM**: Sequelize
- **Database**: PostgreSQL
- **Testing**: Jest with Supertest

## Troubleshooting

### Database Connection Issues
- Ensure Docker container is running: `docker-compose ps`
- Check database credentials in `.env` file
- Verify PostgreSQL is accessible on port 5432

### TypeScript Compilation Errors
- Run `npm install` or `pnpm install` to ensure all dependencies are installed
- Check `tsconfig.json` configuration
- Ensure Node.js version is compatible

### Test Failures
- Ensure database is running
- Check that test database connection is configured correctly
- Verify no conflicting data exists in database

## License

ISC
