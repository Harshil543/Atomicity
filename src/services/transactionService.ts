import { sequelize } from '../config/database';
import { User, Address } from '../models';

export interface CreateUserWithAddressesData {
  user: {
    name: string;
    email: string;
  };
  addresses: Array<{
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }>;
}

export class TransactionService {
  /**
   * Creates a user with multiple addresses in a transaction
   * If any error occurs, the entire transaction is rolled back
   */
  async createUserWithAddresses(
    data: CreateUserWithAddressesData,
    shouldFail: boolean = false
  ): Promise<{ user: User; addresses: Address[] }> {
    // Start a transaction
    const transaction = await sequelize.transaction();

    try {
      // Create user within transaction
      const savedUser = await User.create(
        {
          name: data.user.name,
          email: data.user.email,
        },
        { transaction }
      );
      console.log(`User created with ID: ${savedUser.id} (transaction in progress...)`);

      // Create addresses within transaction
      const addresses: Address[] = [];
      for (let i = 0; i < data.addresses.length; i++) {
        const addrData = data.addresses[i];
        const savedAddress = await Address.create(
          {
            street: addrData.street,
            city: addrData.city,
            state: addrData.state,
            zipCode: addrData.zipCode,
            country: addrData.country,
            userId: savedUser.id,
          },
          { transaction }
        );
        addresses.push(savedAddress);
        console.log(`Address ${i + 1} saved (transaction in progress...)`);
      }

      // Simulate failure if requested (for testing rollback)
      if (shouldFail) {
        throw new Error('Simulated transaction failure for testing rollback');
      }

      // Commit transaction
      await transaction.commit();
      console.log('Transaction committed successfully');

      return { user: savedUser, addresses };
    } catch (error) {
      console.error('Error creating user with addresses:', error);
      // Rollback transaction on error
      await transaction.rollback();
      console.log('Transaction rolled back');
      throw error;
    }
  }

  /**
   * Get user with all addresses
   */
  async getUserWithAddresses(userId: number): Promise<User | null> {
    return await User.findByPk(userId, {
      include: [
        {
          model: Address,
          as: 'addresses',
        },
      ],
    });
  }

  /**
   * Get all users with their addresses
   */
  async getAllUsersWithAddresses(): Promise<User[]> {
    return await User.findAll({
      include: [
        {
          model: Address,
          as: 'addresses',
        },
      ],
    });
  }

  /**
   * Delete user and all associated addresses (cascade)
   */
  async deleteUser(userId: number): Promise<boolean> {
    const transaction = await sequelize.transaction();

    try {
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Address,
            as: 'addresses',
          },
        ],
        transaction,
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Delete addresses first (cascade will handle it, but being explicit)
      await Address.destroy({
        where: { userId: user.id },
        transaction,
      });

      // Delete user
      await User.destroy({
        where: { id: user.id },
        transaction,
      });

      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
