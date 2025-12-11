# Isolation (I of ACID) - Implementation Guide

This document explains how Isolation is implemented in this project.

## What is Isolation?

Isolation is the "I" in ACID properties. It ensures that concurrent transactions do not interfere with each other. Each transaction should appear to be the only one operating on the database at that time.

## Isolation Levels

### 1. Read Uncommitted (Lowest Isolation)

**Characteristics:**
- Allows dirty reads
- Allows non-repeatable reads
- Allows phantom reads
- Lowest performance overhead

**When to Use:**
- Rarely used in production
- Only when you can tolerate reading uncommitted data

**Example:**
```typescript
const transaction = await sequelize.transaction({
  isolationLevel: Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED,
});
```

**Test Endpoint:**
```bash
POST /api/isolation/dirty-read/:userId
```

### 2. Read Committed (Default in PostgreSQL)

**Characteristics:**
- Prevents dirty reads
- Allows non-repeatable reads
- Allows phantom reads
- Good balance between performance and data integrity

**When to Use:**
- Default choice for most applications
- When you need to prevent reading uncommitted data

**Example:**
```typescript
const transaction = await sequelize.transaction({
  isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
});
```

**Test Endpoint:**
```bash
POST /api/isolation/read-committed/:userId
```

### 3. Repeatable Read

**Characteristics:**
- Prevents dirty reads
- Prevents non-repeatable reads
- Allows phantom reads
- Ensures same query returns same results within a transaction

**When to Use:**
- When you need consistent reads within a transaction
- When you're doing multiple reads and need them to be consistent

**Example:**
```typescript
const transaction = await sequelize.transaction({
  isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
});
```

**Test Endpoint:**
```bash
POST /api/isolation/repeatable-read/:userId
```

### 4. Serializable (Highest Isolation)

**Characteristics:**
- Prevents dirty reads
- Prevents non-repeatable reads
- Prevents phantom reads
- Highest data integrity
- May cause deadlocks or serialization errors

**When to Use:**
- When you need the highest level of data integrity
- When you can handle potential deadlocks
- When performance is less critical than data consistency

**Example:**
```typescript
const transaction = await sequelize.transaction({
  isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
});
```

**Test Endpoint:**
```bash
POST /api/isolation/serializable/:userId
```

## Isolation Phenomena

### 1. Dirty Read

**Definition:** Reading uncommitted data from another transaction.

**Example:**
- Transaction 1 updates a user's name but doesn't commit
- Transaction 2 reads the user and sees the uncommitted name
- Transaction 1 rolls back
- Transaction 2 has read data that never existed

**Prevented by:** Read Committed, Repeatable Read, Serializable

**Test Endpoint:**
```bash
POST /api/isolation/dirty-read/:userId
```

### 2. Non-Repeatable Read

**Definition:** Same query returns different results within a transaction.

**Example:**
- Transaction 1 reads a user's name: "John"
- Transaction 2 updates the name to "Jane" and commits
- Transaction 1 reads the user again: "Jane" (different value!)

**Prevented by:** Repeatable Read, Serializable

**Test Endpoint:**
```bash
POST /api/isolation/non-repeatable-read/:userId
```

### 3. Phantom Read

**Definition:** New rows appear in subsequent reads within a transaction.

**Example:**
- Transaction 1 counts users: 10
- Transaction 2 inserts a new user and commits
- Transaction 1 counts users again: 11 (new row appeared!)

**Prevented by:** Serializable

**Test Endpoint:**
```bash
POST /api/isolation/phantom-read
```

### 4. Lost Update

**Definition:** Two transactions update the same record, one overwrites the other.

**Example:**
- Transaction 1 reads user balance: $100
- Transaction 2 reads user balance: $100
- Transaction 1 adds $50: updates to $150
- Transaction 2 subtracts $20: updates to $80
- Final balance: $80 (Transaction 1's update is lost!)

**Prevented by:** Using proper locking or Serializable isolation

**Test Endpoint:**
```bash
POST /api/isolation/lost-update/:userId
```

## Testing Isolation

### Step 1: Create a Test User

```bash
POST /api/users
{
  "user": {
    "name": "Isolation Test User",
    "email": "isolation@test.com"
  },
  "addresses": [
    {
      "street": "123 Test St",
      "city": "Test City",
      "state": "TS",
      "zipCode": "12345",
      "country": "USA"
    }
  ]
}
```

Note the `id` from the response.

### Step 2: Test Different Isolation Levels

**Test Dirty Read:**
```bash
POST /api/isolation/dirty-read/{userId}
```

**Test Read Committed:**
```bash
POST /api/isolation/read-committed/{userId}
```

**Test Repeatable Read:**
```bash
POST /api/isolation/repeatable-read/{userId}
```

**Test Non-Repeatable Read:**
```bash
POST /api/isolation/non-repeatable-read/{userId}
```

**Test Phantom Read:**
```bash
POST /api/isolation/phantom-read
```

**Test Lost Update:**
```bash
POST /api/isolation/lost-update/{userId}
```

**Test Serializable:**
```bash
POST /api/isolation/serializable/{userId}
```

## Running Tests

```bash
# Run all isolation tests
npm test -- isolationService.test.ts

# Run specific test
npm test -- isolationService.test.ts -t "Dirty Read"
```

## Best Practices

1. **Use Read Committed as Default**: It's a good balance between performance and data integrity
2. **Use Repeatable Read for Financial Data**: When you need consistent reads
3. **Use Serializable Sparingly**: Only when absolutely necessary due to performance impact
4. **Handle Deadlocks**: Implement retry logic for Serializable transactions
5. **Monitor Performance**: Higher isolation levels can impact concurrency

## Summary

| Isolation Level | Dirty Read | Non-Repeatable Read | Phantom Read | Performance |
|----------------|------------|---------------------|-------------|-------------|
| Read Uncommitted | ✅ Allowed | ✅ Allowed | ✅ Allowed | ⚡ Fastest |
| Read Committed | ❌ Prevented | ✅ Allowed | ✅ Allowed | ⚡ Fast |
| Repeatable Read | ❌ Prevented | ❌ Prevented | ✅ Allowed | ⚡ Moderate |
| Serializable | ❌ Prevented | ❌ Prevented | ❌ Prevented | 🐌 Slowest |

## References

- [PostgreSQL Isolation Levels](https://www.postgresql.org/docs/current/transaction-iso.html)
- [Sequelize Transactions](https://sequelize.org/docs/v6/other-topics/transactions/)
- [ACID Properties](https://en.wikipedia.org/wiki/ACID)

