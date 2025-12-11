# Consistency (C of ACID) - Implementation Guide

This document explains how Consistency is implemented in this project.

## What is Consistency?

Consistency is the "C" in ACID properties. It ensures that a transaction brings the database from one valid state to another valid state. All database rules, constraints, and integrity must be maintained.

## Types of Consistency

### 1. Database Constraints

#### Unique Constraint
Prevents duplicate values in a column.

**Example:**
```typescript
// User model has unique email constraint
email: {
  type: DataTypes.STRING(100),
  allowNull: false,
  unique: true, // Prevents duplicate emails
}
```

**Test Endpoint:**
```bash
POST /api/consistency/unique-constraint
```

**What Happens:**
- First user with email "test@example.com" → ✅ Success
- Second user with same email → ❌ Fails (unique constraint violation)

#### Not Null Constraint
Ensures required fields cannot be null.

**Example:**
```typescript
name: {
  type: DataTypes.STRING(100),
  allowNull: false, // Field is required
}
```

**Test Endpoint:**
```bash
POST /api/consistency/not-null-constraint
```

**What Happens:**
- User with name "John" → ✅ Success
- User with name null → ❌ Fails (not null constraint violation)

#### Foreign Key Constraint
Maintains referential integrity between tables.

**Example:**
```typescript
userId: {
  type: DataTypes.INTEGER,
  allowNull: false,
  references: {
    model: 'users',
    key: 'id',
  },
  onDelete: 'CASCADE', // Delete addresses when user is deleted
}
```

**Test Endpoint:**
```bash
POST /api/consistency/foreign-key-constraint
```

**What Happens:**
- Address with valid userId → ✅ Success
- Address with invalid userId (99999) → ❌ Fails (foreign key constraint violation)

### 2. Referential Integrity

#### Cascade Delete
When a parent record is deleted, child records are automatically deleted.

**Example:**
```typescript
// When user is deleted, all addresses are automatically deleted
onDelete: 'CASCADE'
```

**Test Endpoint:**
```bash
POST /api/consistency/cascade-delete
```

**What Happens:**
1. Create user with 2 addresses
2. Delete user
3. All addresses are automatically deleted ✅

### 3. Data Type Consistency

Ensures data matches the expected type.

**Example:**
```typescript
email: {
  type: DataTypes.STRING(100), // Must be string
  allowNull: false,
}
```

**Test Endpoint:**
```bash
POST /api/consistency/data-type
```

**What Happens:**
- Email as string "test@example.com" → ✅ Success
- Email as number 12345 → ❌ Fails (type mismatch)

### 4. Business Rule Consistency

Custom validation rules enforced within transactions.

**Business Rules Implemented:**
1. Email must contain @ symbol
2. Name must be at least 3 characters
3. User must have at least one address
4. Zip code must be 5 digits

**Test Endpoint:**
```bash
POST /api/consistency/business-rules
Content-Type: application/json

{
  "user": {
    "name": "John Doe",  // ✅ Valid (>= 3 characters)
    "email": "john@example.com"  // ✅ Valid (contains @)
  },
  "addresses": [
    {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",  // ✅ Valid (5 digits)
      "country": "USA"
    }
  ]
}
```

**Invalid Example:**
```json
{
  "user": {
    "name": "AB",  // ❌ Invalid (less than 3 characters)
    "email": "invalid-email"  // ❌ Invalid (missing @)
  },
  "addresses": [
    {
      "street": "123 Test St",
      "city": "Test City",
      "state": "TS",
      "zipCode": "123",  // ❌ Invalid (not 5 digits)
      "country": "USA"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Business rule violations detected",
  "violations": [
    "Name must be at least 3 characters",
    "Email must contain @ symbol",
    "Invalid zip code format: 123"
  ]
}
```

### 5. Transaction Consistency

Ensures database remains consistent even if transaction fails partway.

**Test Endpoint:**
```bash
POST /api/consistency/transaction-consistency
```

**What Happens:**
1. Transaction starts
2. User is created
3. First address is created
4. Error occurs (simulated)
5. Transaction rolls back
6. **Result**: No user or addresses are saved ✅

## Consistency in Action

### Example: Complete Transaction with Validation

```typescript
const transaction = await sequelize.transaction();

try {
  // Validate business rules
  if (!userData.email.includes('@')) {
    throw new Error('Email must contain @ symbol');
  }

  if (userData.name.length < 3) {
    throw new Error('Name must be at least 3 characters');
  }

  // Create user (enforces unique and not null constraints)
  const user = await User.create(
    {
      name: userData.name,
      email: userData.email,
    },
    { transaction }
  );

  // Create addresses (enforces foreign key constraint)
  for (const addrData of addresses) {
    await Address.create(
      {
        ...addrData,
        userId: user.id, // Valid foreign key
      },
      { transaction }
    );
  }

  // Commit - all constraints satisfied
  await transaction.commit();
} catch (error) {
  // Rollback - database remains consistent
  await transaction.rollback();
  throw error;
}
```

## Testing Consistency

### Step 1: Test Unique Constraint

```bash
POST /api/consistency/unique-constraint
```

**Expected Result:**
- First user created successfully
- Second user with same email fails

### Step 2: Test Foreign Key Constraint

```bash
POST /api/consistency/foreign-key-constraint
```

**Expected Result:**
- Address with valid userId succeeds
- Address with invalid userId fails

### Step 3: Test Business Rules

```bash
POST /api/consistency/business-rules
{
  "user": {
    "name": "Valid Name",
    "email": "valid@example.com"
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

**Expected Result:**
- All rules satisfied → User and addresses created
- Rules violated → Transaction rolled back, violations returned

### Step 4: Test Cascade Delete

```bash
POST /api/consistency/cascade-delete
```

**Expected Result:**
- User created with addresses
- User deleted
- All addresses automatically deleted

## Consistency Checklist

When implementing consistency, ensure:

- ✅ **Unique Constraints**: Prevent duplicate values
- ✅ **Not Null Constraints**: Require essential fields
- ✅ **Foreign Key Constraints**: Maintain referential integrity
- ✅ **Cascade Rules**: Handle related data appropriately
- ✅ **Data Type Validation**: Ensure correct data types
- ✅ **Business Rules**: Enforce custom validation
- ✅ **Transaction Rollback**: Maintain consistency on failure

## Best Practices

1. **Use Database Constraints**: Let the database enforce constraints
2. **Validate Early**: Check business rules before database operations
3. **Use Transactions**: Ensure all-or-nothing operations
4. **Handle Errors**: Always rollback on constraint violations
5. **Document Rules**: Clearly document business rules
6. **Test Constraints**: Test all constraint scenarios

## Summary

| Constraint Type | Purpose | Example |
|----------------|---------|---------|
| Unique | Prevent duplicates | Email must be unique |
| Not Null | Require fields | Name cannot be null |
| Foreign Key | Maintain relationships | Address must reference valid user |
| Cascade Delete | Auto-cleanup | Delete addresses when user deleted |
| Data Type | Type safety | Email must be string |
| Business Rules | Custom validation | Name >= 3 characters, zip code = 5 digits |

## References

- [PostgreSQL Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [Sequelize Validations](https://sequelize.org/docs/v6/core-concepts/validations-and-constraints/)
- [ACID Properties](https://en.wikipedia.org/wiki/ACID)

