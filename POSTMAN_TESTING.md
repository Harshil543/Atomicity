# Postman Testing Guide - Atomicity Demo

## Quick Start

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Import Postman Collection:**
   - Open Postman → Import → Select `postman_collection.json`

3. **Test both scenarios** as described below

---

## ✅ Success Scenario (Transaction Commit)

### Request Details
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/users`
- **Headers:** `Content-Type: application/json`

### Request Body
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

### Expected Response
- **Status:** `201 Created`
- **Response:** User and addresses created successfully

### Verification
After sending, use `GET http://localhost:3000/api/users` to verify the user exists with both addresses.

---

## ❌ Rollback Scenario (Transaction Failure)

### Request Details
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/users/rollback-test`
- **Headers:** `Content-Type: application/json`

### Request Body
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

### Expected Response
- **Status:** `500 Internal Server Error` (after ~10 seconds)
- **Error Message:** "Transaction rolled back as expected"
- **Note:** The request will take approximately **10 seconds** to respond because:
  1. User is created
  2. Address is saved
  3. System waits 10 seconds (demonstrating long-running transaction)
  4. Error is thrown
  5. **Everything is rolled back** - no data is saved!

### Verification
After sending, use `GET http://localhost:3000/api/users` to verify:
- ✅ `bob.smith@example.com` should **NOT** exist
- ✅ Only the success scenario user should exist
- ✅ This proves rollback worked correctly!

---

## 🔍 Verification Endpoints

### Get All Users
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/users`
- **Purpose:** See all users and their addresses

### Get User by ID
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/users/{id}`
- **Purpose:** Get specific user with addresses

### Health Check
- **Method:** `GET`
- **URL:** `http://localhost:3000/health`
- **Purpose:** Verify server is running

---

## 📋 Complete Testing Checklist

- [ ] Server is running (`npm run dev`)
- [ ] Health check returns 200 OK
- [ ] Success scenario creates user and addresses (201)
- [ ] Verify success user exists in database
- [ ] Rollback scenario returns error (500)
- [ ] Verify rollback user does NOT exist in database
- [ ] **Atomicity confirmed!** ✅

---

## 🎯 What to Look For

### Success Scenario Should Show:
- ✅ User created with ID
- ✅ All addresses created with correct `userId`
- ✅ Data persists after transaction
- ✅ Can retrieve user with addresses

### Rollback Scenario Should Show:
- ⏱️ Request takes ~10 seconds (demonstrating long transaction)
- ✅ Error response (500) after the delay
- ✅ Error message mentions "rolled back"
- ✅ User NOT in database (even though it was created during transaction)
- ✅ Addresses NOT in database (even though they were saved during transaction)
- ✅ **Nothing was saved** (atomicity working - rollback undoes everything!)

---

## 💡 Tips

1. **Clear database between tests:** You can delete users via `DELETE /api/users/{id}` if needed
2. **Use different emails:** Each test should use unique email addresses
3. **Check response times:** Transactions should complete quickly
4. **Verify relationships:** Addresses should have correct `userId` foreign key

---

## 🐛 Troubleshooting

**Server not responding?**
- Check if server is running: `npm run dev`
- Verify port 3000 is not in use
- Check database connection

**Database errors?**
- Ensure PostgreSQL is running: `docker-compose ps`
- Check database credentials in `.env`

**Import errors in Postman?**
- Make sure you're importing the JSON file, not opening it
- Check Postman version (should be recent)

