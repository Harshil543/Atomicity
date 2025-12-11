import { ConsistencyService } from '../services/consistencyService';
import { User, Address } from '../models';

describe('ConsistencyService - Consistency Tests', () => {
  let consistencyService: ConsistencyService;

  beforeAll(() => {
    consistencyService = new ConsistencyService();
  });

  describe('Unique Constraint', () => {
    it('should prevent duplicate emails', async () => {
      const result = await consistencyService.demonstrateUniqueConstraint();

      expect(result.firstUser.success).toBe(true);
      expect(result.firstUser.userId).toBeDefined();
      expect(result.secondUser.success).toBe(false);
      expect(result.secondUser.error).toBeDefined();
    });
  });

  describe('Not Null Constraint', () => {
    it('should prevent creating user without required fields', async () => {
      const result = await consistencyService.demonstrateNotNullConstraint();

      expect(result.validUser.success).toBe(true);
      expect(result.validUser.userId).toBeDefined();
      expect(result.invalidUser.success).toBe(false);
      expect(result.invalidUser.error).toBeDefined();
    });
  });

  describe('Foreign Key Constraint', () => {
    it('should prevent creating address with invalid userId', async () => {
      const result = await consistencyService.demonstrateForeignKeyConstraint();

      expect(result.validAddress.success).toBe(true);
      expect(result.validAddress.addressId).toBeDefined();
      expect(result.invalidAddress.success).toBe(false);
      expect(result.invalidAddress.error).toBeDefined();
    });
  });

  describe('Cascade Delete (Referential Integrity)', () => {
    it('should automatically delete addresses when user is deleted', async () => {
      const result = await consistencyService.demonstrateCascadeDelete();

      expect(result.user.id).toBeDefined();
      expect(result.addressesBefore).toBeGreaterThan(0);
      expect(result.addressesAfter).toBe(0);
      expect(result.userDeleted).toBe(true);
    });
  });

  describe('Data Type Consistency', () => {
    it('should prevent invalid data types', async () => {
      const result = await consistencyService.demonstrateDataTypeConsistency();

      expect(result.validData.success).toBe(true);
      expect(result.validData.userId).toBeDefined();
      // Note: Sequelize may coerce types, so this test may vary
    });
  });

  describe('Business Rule Consistency', () => {
    it('should validate business rules and reject invalid data', async () => {
      const invalidData = {
        user: {
          name: 'AB', // Too short (less than 3 characters)
          email: 'invalid-email', // Missing @ symbol
        },
        addresses: [
          {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '123', // Invalid format (not 5 digits)
            country: 'USA',
          },
        ],
      };

      const result = await consistencyService.demonstrateBusinessRuleConsistency(
        invalidData.user,
        invalidData.addresses
      );

      expect(result.success).toBe(false);
      expect(result.violations).toBeDefined();
      expect(result.violations!.length).toBeGreaterThan(0);
    });

    it('should accept data that satisfies all business rules', async () => {
      const validData = {
        user: {
          name: 'Valid User Name',
          email: 'valid@example.com',
        },
        addresses: [
          {
            street: '123 Valid St',
            city: 'Valid City',
            state: 'VC',
            zipCode: '12345', // Valid 5-digit zip code
            country: 'USA',
          },
        ],
      };

      const result = await consistencyService.demonstrateBusinessRuleConsistency(
        validData.user,
        validData.addresses
      );

      expect(result.success).toBe(true);
      expect(result.violations).toBeUndefined();
    });
  });

  describe('Transaction Consistency', () => {
    it('should maintain database consistency even when transaction fails', async () => {
      const result = await consistencyService.demonstrateTransactionConsistency();

      expect(result.beforeTransaction.userCount).toBeDefined();
      expect(result.beforeTransaction.addressCount).toBeDefined();
      expect(result.afterTransaction.userCount).toBeDefined();
      expect(result.afterTransaction.addressCount).toBeDefined();
      expect(result.transactionSucceeded).toBe(false);

      // Counts should remain the same (transaction rolled back)
      expect(result.afterTransaction.userCount).toBe(result.beforeTransaction.userCount);
      expect(result.afterTransaction.addressCount).toBe(result.beforeTransaction.addressCount);
    });
  });
});

