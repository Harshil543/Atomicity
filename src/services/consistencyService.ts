import { sequelize } from '../config/database';
import { User, Address } from '../models';
import { Transaction } from 'sequelize';
import { ValidationError } from 'sequelize';

export class ConsistencyService {
  /**
   * Demonstrates Unique Constraint Violation
   * Tries to create two users with the same email (should fail)
   */
  async demonstrateUniqueConstraint(): Promise<{
    firstUser: { success: boolean; userId?: number };
    secondUser: { success: boolean; error?: string };
  }> {
    const email = `unique_test_${Date.now()}@example.com`;

    try {
      // First user - should succeed
      const user1 = await User.create({
        name: 'First User',
        email: email,
      });

      // Second user with same email - should fail (unique constraint)
      try {
        const user2 = await User.create({
          name: 'Second User',
          email: email, // Same email - violates unique constraint
        });

        return {
          firstUser: { success: true, userId: user1.id },
          secondUser: { success: true, error: 'Should have failed!' },
        };
      } catch (error: any) {
        return {
          firstUser: { success: true, userId: user1.id },
          secondUser: {
            success: false,
            error: error.message || 'Unique constraint violation',
          },
        };
      }
    } catch (error: any) {
      throw new Error(`Failed to demonstrate unique constraint: ${error.message}`);
    }
  }

  /**
   * Demonstrates Not Null Constraint Violation
   * Tries to create a user without required fields (should fail)
   */
  async demonstrateNotNullConstraint(): Promise<{
    validUser: { success: boolean; userId?: number };
    invalidUser: { success: boolean; error?: string };
  }> {
    try {
      // Valid user - should succeed
      const validUser = await User.create({
        name: 'Valid User',
        email: `valid_${Date.now()}@example.com`,
      });

      // Invalid user without name - should fail (not null constraint)
      try {
        const invalidUser = await User.create({
          name: null as any, // Violates not null constraint
          email: `invalid_${Date.now()}@example.com`,
        });

        return {
          validUser: { success: true, userId: validUser.id },
          invalidUser: { success: true, error: 'Should have failed!' },
        };
      } catch (error: any) {
        return {
          validUser: { success: true, userId: validUser.id },
          invalidUser: {
            success: false,
            error: error.message || 'Not null constraint violation',
          },
        };
      }
    } catch (error: any) {
      throw new Error(`Failed to demonstrate not null constraint: ${error.message}`);
    }
  }

  /**
   * Demonstrates Foreign Key Constraint Violation
   * Tries to create an address with invalid userId (should fail)
   */
  async demonstrateForeignKeyConstraint(): Promise<{
    validAddress: { success: boolean; addressId?: number };
    invalidAddress: { success: boolean; error?: string };
  }> {
    const transaction = await sequelize.transaction();

    try {
      // Create a valid user
      const user = await User.create(
        {
          name: 'FK Test User',
          email: `fk_test_${Date.now()}@example.com`,
        },
        { transaction }
      );

      // Valid address - should succeed
      const validAddress = await Address.create(
        {
          street: '123 Valid St',
          city: 'Valid City',
          state: 'VC',
          zipCode: '12345',
          country: 'USA',
          userId: user.id, // Valid foreign key
        },
        { transaction }
      );

      // Invalid address with non-existent userId - should fail
      let invalidAddressResult;
      try {
        const invalidAddress = await Address.create(
          {
            street: '456 Invalid St',
            city: 'Invalid City',
            state: 'IC',
            zipCode: '54321',
            country: 'USA',
            userId: 99999, // Non-existent user ID - violates foreign key constraint
          },
          { transaction }
        );

        invalidAddressResult = {
          success: true,
          error: 'Should have failed!',
        };
      } catch (error: any) {
        invalidAddressResult = {
          success: false,
          error: error.message || 'Foreign key constraint violation',
        };
      }

      await transaction.commit();

      return {
        validAddress: { success: true, addressId: validAddress.id },
        invalidAddress: invalidAddressResult,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Demonstrates Referential Integrity with Cascade Delete
   * When user is deleted, addresses should be automatically deleted
   */
  async demonstrateCascadeDelete(): Promise<{
    user: { id: number; name: string };
    addressesBefore: number;
    addressesAfter: number;
    userDeleted: boolean;
  }> {
    const transaction = await sequelize.transaction();

    try {
      // Create user with addresses
      const user = await User.create(
        {
          name: 'Cascade Test User',
          email: `cascade_${Date.now()}@example.com`,
        },
        { transaction }
      );

      // Create multiple addresses
      await Address.create(
        {
          street: '123 Cascade St',
          city: 'Cascade City',
          state: 'CC',
          zipCode: '12345',
          country: 'USA',
          userId: user.id,
        },
        { transaction }
      );

      await Address.create(
        {
          street: '456 Cascade Ave',
          city: 'Cascade Town',
          state: 'CT',
          zipCode: '54321',
          country: 'USA',
          userId: user.id,
        },
        { transaction }
      );

      await transaction.commit();

      // Count addresses before deletion
      const addressesBefore = await Address.count({
        where: { userId: user.id },
      });

      // Delete user (should cascade delete addresses)
      await User.destroy({
        where: { id: user.id },
      });

      // Count addresses after deletion
      const addressesAfter = await Address.count({
        where: { userId: user.id },
      });

      // Verify user is deleted
      const userExists = await User.findByPk(user.id);

      return {
        user: { id: user.id, name: user.name },
        addressesBefore,
        addressesAfter,
        userDeleted: userExists === null,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Demonstrates Data Type Consistency
   * Tries to insert invalid data types (should fail)
   */
  async demonstrateDataTypeConsistency(): Promise<{
    validData: { success: boolean; userId?: number };
    invalidData: { success: boolean; error?: string };
  }> {
    try {
      // Valid data - should succeed
      const validUser = await User.create({
        name: 'Valid Type User',
        email: `valid_type_${Date.now()}@example.com`,
      });

      // Invalid data type - should fail
      let invalidResult;
      try {
        const invalidUser = await User.create({
          name: 'Invalid Type User',
          email: 12345 as any, // Invalid type - should be string
        });

        invalidResult = {
          success: true,
          error: 'Should have failed!',
        };
      } catch (error: any) {
        invalidResult = {
          success: false,
          error: error.message || 'Data type validation failed',
        };
      }

      return {
        validData: { success: true, userId: validUser.id },
        invalidData: invalidResult,
      };
    } catch (error: any) {
      throw new Error(`Failed to demonstrate data type consistency: ${error.message}`);
    }
  }

  /**
   * Demonstrates Business Rule Consistency
   * Validates business rules within a transaction
   */
  async demonstrateBusinessRuleConsistency(
    userData: { name: string; email: string },
    addresses: Array<{ street: string; city: string; state: string; zipCode: string; country: string }>
  ): Promise<{
    success: boolean;
    message: string;
    violations?: string[];
  }> {
    const transaction = await sequelize.transaction();

    try {
      const violations: string[] = [];

      // Business Rule 1: Email must contain @ symbol
      if (!userData.email.includes('@')) {
        violations.push('Email must contain @ symbol');
      }

      // Business Rule 2: Name must be at least 3 characters
      if (userData.name.length < 3) {
        violations.push('Name must be at least 3 characters');
      }

      // Business Rule 3: Must have at least one address
      if (!addresses || addresses.length === 0) {
        violations.push('User must have at least one address');
      }

      // Business Rule 4: All addresses must have valid zip code (5 digits)
      for (const address of addresses) {
        if (!/^\d{5}$/.test(address.zipCode)) {
          violations.push(`Invalid zip code format: ${address.zipCode}`);
        }
      }

      // If there are violations, rollback
      if (violations.length > 0) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Business rule violations detected',
          violations,
        };
      }

      // All rules passed - create user and addresses
      const user = await User.create(
        {
          name: userData.name,
          email: userData.email,
        },
        { transaction }
      );

      for (const addrData of addresses) {
        await Address.create(
          {
            street: addrData.street,
            city: addrData.city,
            state: addrData.state,
            zipCode: addrData.zipCode,
            country: addrData.country,
            userId: user.id,
          },
          { transaction }
        );
      }

      await transaction.commit();

      return {
        success: true,
        message: 'All business rules satisfied, user and addresses created',
      };
    } catch (error: any) {
      await transaction.rollback();
      throw new Error(`Failed to demonstrate business rule consistency: ${error.message}`);
    }
  }

  /**
   * Demonstrates Transaction Consistency
   * Ensures database remains consistent even if transaction fails partway
   */
  async demonstrateTransactionConsistency(): Promise<{
    beforeTransaction: { userCount: number; addressCount: number };
    afterTransaction: { userCount: number; addressCount: number };
    transactionSucceeded: boolean;
  }> {
    const beforeUserCount = await User.count();
    const beforeAddressCount = await Address.count();

    const transaction = await sequelize.transaction();

    try {
      // Create user
      const user = await User.create(
        {
          name: 'Consistency Test User',
          email: `consistency_${Date.now()}@example.com`,
        },
        { transaction }
      );

      // Create first address
      await Address.create(
        {
          street: '123 Consistency St',
          city: 'Consistency City',
          state: 'CC',
          zipCode: '12345',
          country: 'USA',
          userId: user.id,
        },
        { transaction }
      );

      // Simulate error - this should cause rollback
      throw new Error('Simulated error to test transaction consistency');

      // This should never execute
      await Address.create(
        {
          street: '456 Consistency Ave',
          city: 'Consistency Town',
          state: 'CT',
          zipCode: '54321',
          country: 'USA',
          userId: user.id,
        },
        { transaction }
      );

      await transaction.commit();

      const afterUserCount = await User.count();
      const afterAddressCount = await Address.count();

      return {
        beforeTransaction: {
          userCount: beforeUserCount,
          addressCount: beforeAddressCount,
        },
        afterTransaction: {
          userCount: afterUserCount,
          addressCount: afterAddressCount,
        },
        transactionSucceeded: true,
      };
    } catch (error) {
      await transaction.rollback();

      const afterUserCount = await User.count();
      const afterAddressCount = await Address.count();

      return {
        beforeTransaction: {
          userCount: beforeUserCount,
          addressCount: beforeAddressCount,
        },
        afterTransaction: {
          userCount: afterUserCount,
          addressCount: afterAddressCount,
        },
        transactionSucceeded: false,
      };
    }
  }

  /**
   * Demonstrates Check Constraint (via validation)
   * Validates data meets certain conditions
   */
  async demonstrateCheckConstraint(): Promise<{
    validEmail: { success: boolean; userId?: number };
    invalidEmail: { success: boolean; error?: string };
  }> {
    try {
      // Valid email format - should succeed
      const validUser = await User.create({
        name: 'Valid Email User',
        email: `valid_${Date.now()}@example.com`,
      });

      // Invalid email format - should fail (business rule)
      let invalidResult;
      try {
        const invalidUser = await User.create({
          name: 'Invalid Email User',
          email: 'invalid-email-format', // Missing @ symbol
        });

        invalidResult = {
          success: true,
          error: 'Should have failed validation!',
        };
      } catch (error: any) {
        // Note: Sequelize doesn't enforce email format by default
        // This would need custom validation
        invalidResult = {
          success: false,
          error: 'Email validation would fail in production with custom validator',
        };
      }

      return {
        validEmail: { success: true, userId: validUser.id },
        invalidEmail: invalidResult,
      };
    } catch (error: any) {
      throw new Error(`Failed to demonstrate check constraint: ${error.message}`);
    }
  }
}

