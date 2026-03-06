import express from 'express';
import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import CustomRequest from '../models/CustomRequest.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Create custom request
router.post('/', auth, [
  body('occasion').trim().isLength({ min: 2 }),
  body('names').trim().isLength({ min: 1 }),
  body('tone').isIn(['romantic', 'hype', 'emotional', 'devotional', 'corporate', 'celebratory']),
  body('language').isIn(['english', 'hindi', 'tamil', 'telugu', 'punjabi', 'bengali', 'marathi', 'gujarati']),
  body('description').trim().isLength({ min: 10 }),
  body('budget').isNumeric().isFloat({ min: 0 })
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const customRequest = new CustomRequest({
      ...req.body,
      user: (req as any).user._id
    });

    await customRequest.save();

    res.status(201).json({
      customRequest,
      message: 'Custom request submitted successfully'
    });
  } catch (error) {
    console.error('Custom request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's custom requests
router.get('/my-requests', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const requests = await CustomRequest.find({ user: (req as any).user._id })
      .populate('completedSong')
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get custom request by ID
router.get('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const request = await CustomRequest.findOne({
      _id: req.params.id,
      user: (req as any).user._id
    }).populate('completedSong');

    if (!request) {
      res.status(404).json({ message: 'Request not found' });
      return;
    }

    res.json({ request });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;