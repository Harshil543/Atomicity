import { Router, Request, Response } from 'express';
import { IsolationService } from '../services/isolationService';

const router: Router = Router();
const isolationService = new IsolationService();

// Demonstrate Dirty Read (Read Uncommitted)
router.post('/isolation/dirty-read/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const result = await isolationService.demonstrateDirtyRead(userId);

    res.json({
      message: 'Dirty Read demonstration completed',
      explanation: 'Transaction 2 was able to read uncommitted data from Transaction 1',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to demonstrate dirty read',
      message: error.message,
    });
  }
});

// Demonstrate Read Committed (No Dirty Read)
router.post('/isolation/read-committed/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const result = await isolationService.demonstrateReadCommitted(userId);

    res.json({
      message: 'Read Committed demonstration completed',
      explanation: 'Transaction 2 could NOT read uncommitted data. It only saw changes after Transaction 1 committed.',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to demonstrate read committed',
      message: error.message,
    });
  }
});

// Demonstrate Repeatable Read
router.post('/isolation/repeatable-read/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const result = await isolationService.demonstrateRepeatableRead(userId);

    res.json({
      message: 'Repeatable Read demonstration completed',
      explanation: 'Transaction 1 saw the same value in all reads, even though Transaction 2 updated the data',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to demonstrate repeatable read',
      message: error.message,
    });
  }
});

// Demonstrate Serializable
router.post('/isolation/serializable/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const result = await isolationService.demonstrateSerializable(userId);

    res.json({
      message: 'Serializable isolation demonstration completed',
      explanation: 'Highest isolation level - transactions are completely isolated',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to demonstrate serializable isolation',
      message: error.message,
    });
  }
});

// Demonstrate Non-Repeatable Read
router.post('/isolation/non-repeatable-read/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const result = await isolationService.demonstrateNonRepeatableRead(userId);

    res.json({
      message: 'Non-Repeatable Read demonstration completed',
      explanation: 'Transaction 1 saw different values in subsequent reads (happens in Read Committed)',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to demonstrate non-repeatable read',
      message: error.message,
    });
  }
});

// Demonstrate Phantom Read
router.post('/isolation/phantom-read', async (req: Request, res: Response) => {
  try {
    const result = await isolationService.demonstratePhantomRead();

    res.json({
      message: 'Phantom Read demonstration completed',
      explanation: 'New rows appeared in subsequent reads within the same transaction',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to demonstrate phantom read',
      message: error.message,
    });
  }
});

// Demonstrate Lost Update
router.post('/isolation/lost-update/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const result = await isolationService.demonstrateLostUpdate(userId);

    res.json({
      message: 'Lost Update demonstration completed',
      explanation: 'Two transactions updated the same record - one update was lost',
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to demonstrate lost update',
      message: error.message,
    });
  }
});

export default router;

