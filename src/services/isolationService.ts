import { sequelize } from '../config/database';
import { User, Address } from '../models';
import { Transaction } from 'sequelize';

export class IsolationService {
  /**
   * Demonstrates Read Uncommitted isolation level
   * Transaction 1: Updates user name but doesn't commit
   * Transaction 2: Can read the uncommitted change (dirty read)
   */
  async demonstrateDirtyRead(userId: number): Promise<{
    transaction1: { before: string; after: string };
    transaction2: { readValue: string };
  }> {
    // Transaction 1: Start and update but don't commit
    const transaction1 = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED,
    });

    try {
      const user = await User.findByPk(userId, { transaction: transaction1 });
      if (!user) {
        throw new Error('User not found');
      }

      const beforeName = user.name;

      // Update name but don't commit yet
      await User.update(
        { name: `${user.name}_UPDATED` },
        { where: { id: userId }, transaction: transaction1 }
      );

      const updatedUser = await User.findByPk(userId, { transaction: transaction1 });
      const afterName = updatedUser!.name;

      // Transaction 2: Read uncommitted data (dirty read)
      const transaction2 = await sequelize.transaction({
        isolationLevel: Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED,
      });

      const userInT2 = await User.findByPk(userId, { transaction: transaction2 });
      const readValue = userInT2!.name;

      // Rollback transaction 1 (simulating failure)
      await transaction1.rollback();
      await transaction2.rollback();

      return {
        transaction1: { before: beforeName, after: afterName },
        transaction2: { readValue },
      };
    } catch (error) {
      await transaction1.rollback();
      throw error;
    }
  }

  /**
   * Demonstrates Read Committed isolation level
   * Transaction 1: Updates user name
   * Transaction 2: Cannot read uncommitted changes (no dirty read)
   */
  async demonstrateReadCommitted(userId: number): Promise<{
    transaction1: { before: string; after: string };
    transaction2: { readValue: string; readAfterCommit: string };
  }> {
    // Transaction 1: Start and update
    const transaction1 = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      const user = await User.findByPk(userId, { transaction: transaction1 });
      if (!user) {
        throw new Error('User not found');
      }

      const beforeName = user.name;

      // Update name
      await User.update(
        { name: `${user.name}_UPDATED` },
        { where: { id: userId }, transaction: transaction1 }
      );

      const updatedUser = await User.findByPk(userId, { transaction: transaction1 });
      const afterName = updatedUser!.name;

      // Transaction 2: Try to read (should see old value - no dirty read)
      const transaction2 = await sequelize.transaction({
        isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
      });

      const userInT2Before = await User.findByPk(userId, { transaction: transaction2 });
      const readValue = userInT2Before!.name; // Should be old value

      // Commit transaction 1
      await transaction1.commit();

      // Transaction 2: Read again after commit (should see new value)
      const userInT2After = await User.findByPk(userId, { transaction: transaction2 });
      const readAfterCommit = userInT2After!.name;

      await transaction2.rollback();

      return {
        transaction1: { before: beforeName, after: afterName },
        transaction2: { readValue, readAfterCommit },
      };
    } catch (error) {
      await transaction1.rollback();
      throw error;
    }
  }

  /**
   * Demonstrates Repeatable Read isolation level
   * Same query within a transaction returns the same result
   */
  async demonstrateRepeatableRead(userId: number): Promise<{
    transaction1: { read1: string; read2: string; read3: string };
    transaction2: { updated: boolean };
  }> {
    // Transaction 1: Read multiple times
    const transaction1 = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
    });

    // Transaction 2: Update the user
    const transaction2 = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
    });

    try {
      // Transaction 1: First read
      const user1 = await User.findByPk(userId, { transaction: transaction1 });
      const read1 = user1!.name;

      // Transaction 2: Update user
      await User.update(
        { name: `${user1!.name}_UPDATED_BY_T2` },
        { where: { id: userId }, transaction: transaction2 }
      );
      await transaction2.commit();

      // Transaction 1: Second read (should still see old value - repeatable read)
      const user2 = await User.findByPk(userId, { transaction: transaction1 });
      const read2 = user2!.name;

      // Transaction 1: Third read (should still see old value)
      const user3 = await User.findByPk(userId, { transaction: transaction1 });
      const read3 = user3!.name;

      await transaction1.rollback();

      return {
        transaction1: { read1, read2, read3 },
        transaction2: { updated: true },
      };
    } catch (error) {
      await transaction1.rollback();
      await transaction2.rollback();
      throw error;
    }
  }

  /**
   * Demonstrates Serializable isolation level
   * Highest isolation - transactions are completely isolated
   */
  async demonstrateSerializable(userId: number): Promise<{
    transaction1: { status: string };
    transaction2: { status: string };
  }> {
    const transaction1 = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });

    const transaction2 = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });

    try {
      // Transaction 1: Read and update
      const user1 = await User.findByPk(userId, { transaction: transaction1 });
      if (!user1) {
        throw new Error('User not found');
      }

      // Transaction 2: Try to read and update (may cause deadlock or wait)
      const user2 = await User.findByPk(userId, { transaction: transaction2 });
      if (!user2) {
        throw new Error('User not found');
      }

      // Both transactions try to update
      await User.update(
        { name: `${user1.name}_T1` },
        { where: { id: userId }, transaction: transaction1 }
      );

      // This might wait or cause serialization error
      try {
        await User.update(
          { name: `${user2.name}_T2` },
          { where: { id: userId }, transaction: transaction2 }
        );
        await transaction2.commit();
      } catch (error: any) {
        // Serialization conflict
        await transaction2.rollback();
        return {
          transaction1: { status: 'committed' },
          transaction2: { status: 'rolled_back_due_to_serialization' },
        };
      }

      await transaction1.commit();

      return {
        transaction1: { status: 'committed' },
        transaction2: { status: 'committed' },
      };
    } catch (error) {
      await transaction1.rollback();
      await transaction2.rollback();
      throw error;
    }
  }

  /**
   * Demonstrates Non-Repeatable Read (happens in Read Committed)
   * Same query returns different results within a transaction
   */
  async demonstrateNonRepeatableRead(userId: number): Promise<{
    transaction1: { read1: string; read2: string };
    transaction2: { updated: boolean };
  }> {
    const transaction1 = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      // Transaction 1: First read
      const user1 = await User.findByPk(userId, { transaction: transaction1 });
      const read1 = user1!.name;

      // Transaction 2: Update user (outside transaction1)
      const transaction2 = await sequelize.transaction({
        isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
      });

      await User.update(
        { name: `${user1!.name}_UPDATED` },
        { where: { id: userId }, transaction: transaction2 }
      );
      await transaction2.commit();

      // Transaction 1: Second read (may see different value - non-repeatable read)
      const user2 = await User.findByPk(userId, { transaction: transaction1 });
      const read2 = user2!.name;

      await transaction1.rollback();

      return {
        transaction1: { read1, read2 },
        transaction2: { updated: true },
      };
    } catch (error) {
      await transaction1.rollback();
      throw error;
    }
  }

  /**
   * Demonstrates Phantom Read
   * New rows appear in subsequent reads within a transaction
   */
  async demonstratePhantomRead(): Promise<{
    transaction1: { count1: number; count2: number };
    transaction2: { inserted: boolean };
  }> {
    const transaction1 = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      // Transaction 1: Count users
      const count1 = await User.count({ transaction: transaction1 });

      // Transaction 2: Insert new user
      const transaction2 = await sequelize.transaction({
        isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
      });

      await User.create(
        {
          name: 'Phantom User',
          email: `phantom_${Date.now()}@example.com`,
        },
        { transaction: transaction2 }
      );
      await transaction2.commit();

      // Transaction 1: Count again (may see new row - phantom read)
      const count2 = await User.count({ transaction: transaction1 });

      await transaction1.rollback();

      return {
        transaction1: { count1, count2 },
        transaction2: { inserted: true },
      };
    } catch (error) {
      await transaction1.rollback();
      throw error;
    }
  }

  /**
   * Demonstrates Lost Update problem
   * Two transactions update the same record, one overwrites the other
   */
  async demonstrateLostUpdate(userId: number): Promise<{
    transaction1: { value: string };
    transaction2: { value: string };
    final: { value: string };
  }> {
    // Reset user name first
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const transaction1 = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    const transaction2 = await sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      // Both transactions read the same value
      const user1 = await User.findByPk(userId, { transaction: transaction1 });
      const user2 = await User.findByPk(userId, { transaction: transaction2 });

      // Both update based on their read
      await User.update(
        { name: `${user1!.name}_T1` },
        { where: { id: userId }, transaction: transaction1 }
      );

      await User.update(
        { name: `${user2!.name}_T2` },
        { where: { id: userId }, transaction: transaction2 }
      );

      await transaction1.commit();
      await transaction2.commit();

      // Final value (one update is lost)
      const finalUser = await User.findByPk(userId);
      const finalValue = finalUser!.name;

      return {
        transaction1: { value: `${user1!.name}_T1` },
        transaction2: { value: `${user2!.name}_T2` },
        final: { value: finalValue },
      };
    } catch (error) {
      await transaction1.rollback();
      await transaction2.rollback();
      throw error;
    }
  }
}

