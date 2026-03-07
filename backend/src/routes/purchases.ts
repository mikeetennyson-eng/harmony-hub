import express from 'express';
import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Purchase from '../models/Purchase.js';
import Song from '../models/Song.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Create purchase
router.post('/', auth, [
  body('songIds').isArray({ min: 1 }),
  body('songIds.*').isMongoId(),
  body('paymentMethod').isIn(['card', 'upi', 'netbanking', 'wallet'])
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { songIds, paymentMethod } = req.body;
    const userId = (req as any).user._id;

    // Check if songs exist and are available
    const songs = await Song.find({
      _id: { $in: songIds },
      isSold: false
    });

    if (songs.length !== songIds.length) {
      res.status(400).json({ message: 'Some songs are not available' });
      return;
    }

    // Calculate total
    const totalAmount = songs.reduce((sum, song) => sum + song.price, 0);

    // Create purchase record (pending payment)
    const purchase = new Purchase({
      user: userId,
      songs: songIds,
      totalAmount,
      paymentMethod,
      paymentStatus: 'pending', // Start as pending
      transactionId: `PENDING_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

    await purchase.save();

    res.status(201).json({
      purchase,
      message: 'Purchase initiated. Please complete payment.'
    });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's purchase history
router.get('/history', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const purchases = await Purchase.find({ user: (req as any).user._id })
      .populate('songs')
      .sort({ createdAt: -1 });

    res.json({ purchases });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get purchase by ID
router.get('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const purchase = await Purchase.findOne({
      _id: req.params.id,
      user: (req as any).user._id
    }).populate('songs');

    if (!purchase) {
      res.status(404).json({ message: 'Purchase not found' });
      return;
    }

    res.json({ purchase });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;