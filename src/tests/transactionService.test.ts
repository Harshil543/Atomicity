import { TransactionService } from '../services/transactionService';
import { User, Address } from '../models';

describe('TransactionService - Atomicity Tests', () => {
  let transactionService: TransactionService;

  beforeAll(() => {
    transactionService = new TransactionService();
  });

  describe('Success Scenario - Transaction Commit', () => {
    it('should create user with multiple addresses and commit transaction', async () => {
      const testData = {
        user: {
          name: 'John Doe',
          email: 'john.doe@example.com',
        },
        addresses: [
          {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'USA',
          },
          {
            street: '456 Oak Ave',
            city: 'Los Angeles',
            state: 'CA',
            zipCode: '90001',
            country: 'USA',
          },
        ],
      };

      // Execute transaction
      const result = await transactionService.createUserWithAddresses(testData);

      // Verify user was created
      expect(result.user).toBeDefined();
      expect(result.user.id).toBeDefined();
      expect(result.user.name).toBe(testData.user.name);
      expect(result.user.email).toBe(testData.user.email);

      // Verify addresses were created
      expect(result.addresses).toHaveLength(2);
      expect(result.addresses[0].userId).toBe(result.user.id);
      expect(result.addresses[1].userId).toBe(result.user.id);

      // Verify data persists in database
      const userFromDb = await User.findByPk(result.user.id, {
        include: [
          {
            model: Address,
            as: 'addresses',
          },
        ],
      });

      expect(userFromDb).toBeDefined();
      expect(userFromDb?.addresses).toHaveLength(2);
      expect(userFromDb?.addresses[0].street).toBe(testData.addresses[0].street);
      expect(userFromDb?.addresses[1].street).toBe(testData.addresses[1].street);
    });

    it('should verify atomicity - all or nothing', async () => {
      const testData = {
        user: {
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
        },
        addresses: [
          {
            street: '789 Pine Rd',
            city: 'Chicago',
            state: 'IL',
            zipCode: '60601',
            country: 'USA',
          },
        ],
      };

      const result = await transactionService.createUserWithAddresses(testData);

      // Verify both user and address exist
      const userCount = await User.count({
        where: { id: result.user.id },
      });
      const addressCount = await Address.count({
        where: { userId: result.user.id },
      });

      expect(userCount).toBe(1);
      expect(addressCount).toBe(1);
    });
  });

  describe('Rollback Scenario - Transaction Failure', () => {
    it('should rollback entire transaction when error occurs', async () => {
      const testData = {
        user: {
          name: 'Bob Johnson',
          email: 'bob.johnson@example.com',
        },
        addresses: [
          {
            street: '321 Elm St',
            city: 'Houston',
            state: 'TX',
            zipCode: '77001',
            country: 'USA',
          },
          {
            street: '654 Maple Dr',
            city: 'Phoenix',
            state: 'AZ',
            zipCode: '85001',
            country: 'USA',
          },
        ],
      };

      // Count records before transaction
      const usersBefore = await User.count();
      const addressesBefore = await Address.count();

      // Execute transaction with shouldFail = true (will throw error)
      try {
        await transactionService.createUserWithAddresses(testData, true);
        // Should not reach here
        fail('Expected transaction to fail and throw error');
      } catch (error: any) {
        // Verify error was thrown
        expect(error).toBeDefined();
        expect(error.message).toContain('Simulated transaction failure');
      }

      // Verify NO data was persisted (rollback worked)
      const usersAfter = await User.count();
      const addressesAfter = await Address.count();

      expect(usersAfter).toBe(usersBefore);
      expect(addressesAfter).toBe(addressesBefore);

      // Verify user was NOT created
      const user = await User.findOne({
        where: { email: testData.user.email },
      });
      expect(user).toBeNull();

      // Verify addresses were NOT created
      const addresses = await Address.findAll({
        where: { street: testData.addresses[0].street },
      });
      expect(addresses).toHaveLength(0);
    });

    it('should rollback when address creation fails', async () => {
      const testData = {
        user: {
          name: 'Alice Brown',
          email: 'alice.brown@example.com',
        },
        addresses: [
          {
            street: '999 Invalid St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'USA',
          },
        ],
      };

      const usersBefore = await User.count();

      try {
        // Force failure after user creation
        await transactionService.createUserWithAddresses(testData, true);
        fail('Expected transaction to fail');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Verify user was NOT persisted (rolled back)
      const usersAfter = await User.count();
      expect(usersAfter).toBe(usersBefore);
    });
  });

  describe('Data Integrity Tests', () => {
    it('should maintain referential integrity after successful transaction', async () => {
      const testData = {
        user: {
          name: 'Charlie Wilson',
          email: 'charlie.wilson@example.com',
        },
        addresses: [
          {
            street: '111 Test St',
            city: 'Boston',
            state: 'MA',
            zipCode: '02101',
            country: 'USA',
          },
        ],
      };

      const result = await transactionService.createUserWithAddresses(testData);

      // Verify relationship
      const userWithAddresses = await transactionService.getUserWithAddresses(
        result.user.id
      );

      expect(userWithAddresses).toBeDefined();
      expect(userWithAddresses?.addresses).toHaveLength(1);
      expect(userWithAddresses?.addresses[0].userId).toBe(result.user.id);
    });
  });
});
