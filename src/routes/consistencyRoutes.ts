import { Router, Request, Response } from 'express';
import { ConsistencyService } from '../services/consistencyService';

const router: Router = Router();
const consistencyService = new ConsistencyService();

// Demonstrate Unique Constraint
router.post('/consistency/unique-constraint', async (req: Request, res: Response) => {
  try {
    const result = await consistencyService.demonstrateUniqueConstraint();

    res.json({
      message: 'Unique constraint demonstration completed',
      explanation: 'Trying to create two users with the same email. The second should fail due to unique constraint.',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to demonstrate unique constraint',
      message: error.message,
    });
  }
});

// Demonstrate Not Null Constraint
router.post('/consistency/not-null-constraint', async (req: Request, res: Response) => {
  try {
    const result = await consistencyService.demonstrateNotNullConstraint();

    res.json({
      message: 'Not null constraint demonstration completed',
      explanation: 'Trying to create a user without required fields. Should fail due to not null constraint.',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to demonstrate not null constraint',
      message: error.message,
    });
  }
});

// Demonstrate Foreign Key Constraint
router.post('/consistency/foreign-key-constraint', async (req: Request, res: Response) => {
  try {
    const result = await consistencyService.demonstrateForeignKeyConstraint();

    res.json({
      message: 'Foreign key constraint demonstration completed',
      explanation: 'Trying to create an address with invalid userId. Should fail due to foreign key constraint.',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to demonstrate foreign key constraint',
      message: error.message,
    });
  }
});

// Demonstrate Cascade Delete (Referential Integrity)
router.post('/consistency/cascade-delete', async (req: Request, res: Response) => {
  try {
    const result = await consistencyService.demonstrateCascadeDelete();

    res.json({
      message: 'Cascade delete demonstration completed',
      explanation: 'When user is deleted, all associated addresses are automatically deleted (referential integrity).',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to demonstrate cascade delete',
      message: error.message,
    });
  }
});

// Demonstrate Data Type Consistency
router.post('/consistency/data-type', async (req: Request, res: Response) => {
  try {
    const result = await consistencyService.demonstrateDataTypeConsistency();

    res.json({
      message: 'Data type consistency demonstration completed',
      explanation: 'Trying to insert invalid data types. Should fail due to type validation.',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to demonstrate data type consistency',
      message: error.message,
    });
  }
});

// Demonstrate Business Rule Consistency
router.post('/consistency/business-rules', async (req: Request, res: Response) => {
  try {
    const { user, addresses } = req.body;

    if (!user || !user.name || !user.email) {
      return res.status(400).json({
        error: 'User name and email are required',
      });
    }

    if (!addresses || !Array.isArray(addresses)) {
      return res.status(400).json({
        error: 'Addresses array is required',
      });
    }

    const result = await consistencyService.demonstrateBusinessRuleConsistency(user, addresses);

    if (result.success) {
      res.status(201).json({
        message: result.message,
        data: result,
      });
    } else {
      res.status(400).json({
        message: result.message,
        violations: result.violations,
        data: result,
      });
    }
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to demonstrate business rule consistency',
      message: error.message,
    });
  }
});

// Demonstrate Transaction Consistency
router.post('/consistency/transaction-consistency', async (req: Request, res: Response) => {
  try {
    const result = await consistencyService.demonstrateTransactionConsistency();

    res.json({
      message: 'Transaction consistency demonstration completed',
      explanation: 'Even if transaction fails partway, database remains consistent (no partial updates).',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to demonstrate transaction consistency',
      message: error.message,
    });
  }
});

// Demonstrate Check Constraint (via validation)
router.post('/consistency/check-constraint', async (req: Request, res: Response) => {
  try {
    const result = await consistencyService.demonstrateCheckConstraint();

    res.json({
      message: 'Check constraint demonstration completed',
      explanation: 'Validates data meets certain conditions (e.g., email format).',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to demonstrate check constraint',
      message: error.message,
    });
  }
});

export default router;

