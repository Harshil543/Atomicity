import { Router, Request, Response } from 'express';
import { TransactionService } from '../services/transactionService';

const router: Router = Router();
const transactionService = new TransactionService();

// Create user with addresses (success scenario)
router.post('/users', async (req: Request, res: Response) => {
  try {
    const { user, addresses } = req.body;

    if (!user || !user.name || !user.email) {
      return res.status(400).json({
        error: 'User name and email are required',
      });
    }

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({
        error: 'At least one address is required',
      });
    }

    const result = await transactionService.createUserWithAddresses({
      user,
      addresses,
    });

    res.status(201).json({
      message: 'User and addresses created successfully',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to create user with addresses',
      message: error.message,
    });
  }
});

// Create user with addresses (rollback scenario - for testing)
router.post('/users/rollback-test', async (req: Request, res: Response) => {
  try {
    const { user, addresses } = req.body;

    if (!user || !user.name || !user.email) {
      return res.status(400).json({
        error: 'User name and email are required',
      });
    }

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({
        error: 'At least one address is required',
      });
    }

    // Force rollback by passing shouldFail = true
    const result = await transactionService.createUserWithAddresses(
      { user, addresses },
      true
    );

    res.status(201).json({
      message: 'This should not be reached',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Transaction rolled back as expected',
      message: error.message,
    });
  }
});

// Get all users with addresses
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await transactionService.getAllUsersWithAddresses();
    res.json({
      message: 'Users retrieved successfully',
      data: users,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve users',
      message: error.message,
    });
  }
});

// Get user by ID with addresses
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await transactionService.getUserWithAddresses(userId);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.json({
      message: 'User retrieved successfully',
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to retrieve user',
      message: error.message,
    });
  }
});

// Delete user (cascade delete addresses)
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const deleted = await transactionService.deleteUser(userId);

    if (!deleted) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.json({
      message: 'User and addresses deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to delete user',
      message: error.message,
    });
  }
});

export default router;

