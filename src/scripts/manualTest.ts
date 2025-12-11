import { initializeDatabase, sequelize } from '../config/database';
import { TransactionService } from '../services/transactionService';
import { User, Address } from '../models';

/**
 * Manual test script to demonstrate atomicity
 * Run with: npx ts-node src/scripts/manualTest.ts
 */

async function runTests() {
  try {
    // Initialize database
    await initializeDatabase();

    const transactionService = new TransactionService();

    console.log('\n=== ATOMICITY DEMONSTRATION ===\n');

    // Test 1: Success Scenario
    console.log('📝 TEST 1: Success Scenario - Transaction Commit');
    console.log('Creating user with 2 addresses...\n');

    const successData = {
      user: {
        name: 'Alice Johnson',
        email: 'alice.johnson@example.com',
      },
      addresses: [
        {
          street: '123 Success Street',
          city: 'Success City',
          state: 'SC',
          zipCode: '12345',
          country: 'USA',
        },
        {
          street: '456 Victory Avenue',
          city: 'Victory Town',
          state: 'VT',
          zipCode: '54321',
          country: 'USA',
        },
      ],
    };

    try {
      const result = await transactionService.createUserWithAddresses(successData);
      console.log('✅ Transaction COMMITTED successfully!');
      console.log(`   User ID: ${result.user.id}`);
      console.log(`   User Name: ${result.user.name}`);
      console.log(`   User Email: ${result.user.email}`);
      console.log(`   Addresses Created: ${result.addresses.length}`);
      result.addresses.forEach((addr, index) => {
        console.log(`   Address ${index + 1}: ${addr.street}, ${addr.city}`);
      });

      // Verify data in database
      const userFromDb = await transactionService.getUserWithAddresses(result.user.id);
      console.log(`\n   ✅ Verification: User found in DB with ${userFromDb?.addresses?.length || 0} addresses`);
    } catch (error: any) {
      console.log('❌ Unexpected error:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Rollback Scenario
    console.log('📝 TEST 2: Rollback Scenario - Transaction Failure');
    console.log('Attempting to create user with addresses (will fail)...\n');

    const rollbackData = {
      user: {
        name: 'Bob Smith',
        email: 'bob.smith@example.com',
      },
      addresses: [
        {
          street: '789 Failure Lane',
          city: 'Failure City',
          state: 'FC',
          zipCode: '99999',
          country: 'USA',
        },
      ],
    };

    // Count records before transaction
    const usersBefore = await User.count();
    const addressesBefore = await Address.count();
    console.log(`   Records before transaction: ${usersBefore} users, ${addressesBefore} addresses`);

    try {
      // This will fail and rollback
      await transactionService.createUserWithAddresses(rollbackData, true);
      console.log('❌ ERROR: Transaction should have failed!');
    } catch (error: any) {
      console.log('✅ Transaction ROLLED BACK as expected!');
      console.log(`   Error: ${error.message}`);

      // Verify no data was persisted
      const usersAfter = await User.count();
      const addressesAfter = await Address.count();
      console.log(`   Records after rollback: ${usersAfter} users, ${addressesAfter} addresses`);

      // Verify user was NOT created
      const user = await User.findOne({
        where: { email: rollbackData.user.email },
      });

      if (user === null) {
        console.log('   ✅ Verification: User NOT found in DB (rollback successful)');
      } else {
        console.log('   ❌ ERROR: User found in DB (rollback failed!)');
      }

      // Verify addresses were NOT created
      const addresses = await Address.findAll({
        where: { street: rollbackData.addresses[0].street },
      });

      if (addresses.length === 0) {
        console.log('   ✅ Verification: Addresses NOT found in DB (rollback successful)');
      } else {
        console.log('   ❌ ERROR: Addresses found in DB (rollback failed!)');
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Summary
    console.log('📊 SUMMARY:');
    const allUsers = await transactionService.getAllUsersWithAddresses();
    console.log(`   Total users in database: ${allUsers.length}`);
    allUsers.forEach((user) => {
      const addresses = user.addresses || [];
      console.log(`   - ${user.name} (${user.email}) has ${addresses.length} address(es)`);
    });

    console.log('\n✅ All tests completed!\n');
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

runTests();
