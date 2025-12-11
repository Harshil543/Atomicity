import { IsolationService } from '../services/isolationService';
import { User } from '../models';

describe('IsolationService - Isolation Level Tests', () => {
  let isolationService: IsolationService;
  let testUserId: number;

  beforeAll(async () => {
    isolationService = new IsolationService();
    // Create a test user
    const testUser = await User.create({
      name: 'Test User',
      email: `test_${Date.now()}@example.com`,
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      await User.destroy({ where: { id: testUserId } });
    }
  });

  describe('Read Uncommitted - Dirty Read', () => {
    it('should demonstrate dirty read - Transaction 2 can read uncommitted data', async () => {
      const result = await isolationService.demonstrateDirtyRead(testUserId);

      expect(result.transaction1.before).toBeDefined();
      expect(result.transaction1.after).toBeDefined();
      expect(result.transaction2.readValue).toBeDefined();
      // Transaction 2 should see the uncommitted update
      expect(result.transaction2.readValue).toContain('_UPDATED');
    });
  });

  describe('Read Committed - No Dirty Read', () => {
    it('should prevent dirty reads - Transaction 2 cannot read uncommitted data', async () => {
      const result = await isolationService.demonstrateReadCommitted(testUserId);

      expect(result.transaction1.before).toBeDefined();
      expect(result.transaction1.after).toBeDefined();
      expect(result.transaction2.readValue).toBeDefined();
      expect(result.transaction2.readAfterCommit).toBeDefined();

      // Transaction 2 should see old value before commit
      expect(result.transaction2.readValue).not.toContain('_UPDATED');
      // Transaction 2 should see new value after commit
      expect(result.transaction2.readAfterCommit).toContain('_UPDATED');
    });
  });

  describe('Repeatable Read', () => {
    it('should maintain same value across multiple reads in a transaction', async () => {
      const result = await isolationService.demonstrateRepeatableRead(testUserId);

      expect(result.transaction1.read1).toBeDefined();
      expect(result.transaction1.read2).toBeDefined();
      expect(result.transaction1.read3).toBeDefined();
      expect(result.transaction2.updated).toBe(true);

      // All reads in transaction 1 should return the same value
      expect(result.transaction1.read1).toBe(result.transaction1.read2);
      expect(result.transaction1.read2).toBe(result.transaction1.read3);
    });
  });

  describe('Non-Repeatable Read', () => {
    it('should demonstrate non-repeatable read in Read Committed level', async () => {
      const result = await isolationService.demonstrateNonRepeatableRead(testUserId);

      expect(result.transaction1.read1).toBeDefined();
      expect(result.transaction1.read2).toBeDefined();
      expect(result.transaction2.updated).toBe(true);

      // In Read Committed, subsequent reads may see different values
      // This is expected behavior for this isolation level
    });
  });

  describe('Phantom Read', () => {
    it('should demonstrate phantom read - new rows appear in subsequent reads', async () => {
      const result = await isolationService.demonstratePhantomRead();

      expect(result.transaction1.count1).toBeDefined();
      expect(result.transaction1.count2).toBeDefined();
      expect(result.transaction2.inserted).toBe(true);

      // Count should increase (phantom read)
      expect(result.transaction1.count2).toBeGreaterThan(result.transaction1.count1);
    });
  });

  describe('Lost Update', () => {
    it('should demonstrate lost update problem', async () => {
      const result = await isolationService.demonstrateLostUpdate(testUserId);

      expect(result.transaction1.value).toBeDefined();
      expect(result.transaction2.value).toBeDefined();
      expect(result.final.value).toBeDefined();

      // One of the updates should be lost
      // The final value should match one of the transaction values
      expect(
        result.final.value === result.transaction1.value ||
          result.final.value === result.transaction2.value
      ).toBe(true);
    });
  });
});

