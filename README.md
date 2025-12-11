# Atomicity Demo - Node.js TypeScript Project

This project demonstrates database atomicity concepts using PostgreSQL transactions with TypeORM. It implements a User-Address relationship where one user can have multiple addresses, and ensures that all operations are atomic (all-or-nothing).

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
│   │   └── database.ts          # Database configuration
│   ├── entities/
│   │   ├── User.ts              # User entity
│   │   └── Address.ts           # Address entity
│   ├── services/
│   │   └── transactionService.ts # Transaction service with commit/rollback
│   ├── routes/
│   │   └── userRoutes.ts        # API routes
│   ├── tests/
│   │   ├── setup.ts             # Test setup
│   │   ├── transactionService.test.ts  # Unit tests
│   │   └── integration.test.ts  # Integration tests
│   └── index.ts                 # Main application entry
├── docker-compose.yml           # PostgreSQL database setup
├── package.json
├── tsconfig.json
└── README.md
```

## Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- npm or yarn

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
This endpoint intentionally fails to demonstrate rollback behavior. **Note:** The request will take approximately 10 seconds to respond because:
1. User is created in the transaction
2. Address is saved in the transaction
3. System waits 10 seconds (simulating a long-running operation)
4. Error is thrown
5. **Everything is rolled back** - proving atomicity works even during long transactions!

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

**⚠️ Important:** The request will take approximately **10 seconds** to respond. This is intentional to demonstrate that:
- The transaction is in progress (user and address are being saved)
- Even after 10 seconds of processing, when an error occurs, **everything is rolled back**
- Check the server console logs to see the progress messages

**Expected Response (500 Internal Server Error - after ~10 seconds):**
```json
{
  "error": "Transaction rolled back as expected",
  "message": "Simulated transaction failure after 10 seconds - demonstrating rollback"
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

### Test Scenarios

The project includes comprehensive tests covering:

1. **Success Scenario** (`transactionService.test.ts`):
   - Creates user with multiple addresses
   - Verifies all data is persisted
   - Confirms referential integrity

2. **Rollback Scenario** (`transactionService.test.ts`):
   - Simulates transaction failure
   - Verifies no data is persisted (rollback works)
   - Confirms atomicity (all-or-nothing)

3. **Integration Tests** (`integration.test.ts`):
   - Tests API endpoints
   - Verifies HTTP responses
   - Tests end-to-end flow

## How Atomicity Works

### Transaction Flow

1. **Start Transaction**: `queryRunner.startTransaction()`
2. **Execute Operations**:
   - Create user
   - Create addresses
   - If any error occurs → go to step 3
3. **Commit or Rollback**:
   - **Success**: `queryRunner.commitTransaction()` - All changes are saved
   - **Failure**: `queryRunner.rollbackTransaction()` - All changes are discarded
4. **Release Resources**: `queryRunner.release()`

### Example: Success Scenario

```typescript
// Transaction starts
await queryRunner.startTransaction();

// Create user
const user = await queryRunner.manager.save(User, userData);

// Create addresses
const address1 = await queryRunner.manager.save(Address, address1Data);
const address2 = await queryRunner.manager.save(Address, address2Data);

// Commit - all changes are saved
await queryRunner.commitTransaction();
```

### Example: Rollback Scenario

```typescript
// Transaction starts
await queryRunner.startTransaction();

// Create user
const user = await queryRunner.manager.save(User, userData);

// Error occurs!
throw new Error('Something went wrong');

// Rollback - all changes are discarded
await queryRunner.rollbackTransaction();
// User and addresses are NOT saved to database
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
- `user_id` (Foreign Key → users.id)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

## Key Concepts Demonstrated

1. **ACID Properties**: Specifically Atomicity
2. **Transaction Management**: Using TypeORM QueryRunner
3. **Error Handling**: Proper rollback on failures
4. **Data Integrity**: Maintaining referential integrity
5. **One-to-Many Relationships**: User → Addresses

## Troubleshooting

### Database Connection Issues
- Ensure Docker container is running: `docker-compose ps`
- Check database credentials in `.env` file
- Verify PostgreSQL is accessible on port 5432

### TypeScript Compilation Errors
- Run `npm install` to ensure all dependencies are installed
- Check `tsconfig.json` configuration
- Ensure Node.js version is compatible

### Test Failures
- Ensure database is running
- Check that test database connection is configured correctly
- Verify no conflicting data exists in database

## License

ISC

