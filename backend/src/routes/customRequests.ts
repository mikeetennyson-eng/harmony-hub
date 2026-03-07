import express from 'express';
import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import CustomRequest from '../models/CustomRequest.js';
import Song from '../models/Song.js';
import User from '../models/User.js';
import { auth, adminAuth } from '../middleware/auth.js';
import { uploadToR2 } from '../utils/storage.js';

const upload = multer({ storage: multer.memoryStorage() });
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

// Upload song for custom request (admin only)
router.post('/:id/upload', upload.single('audioFile'), auth, adminAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const customRequest = await CustomRequest.findById(req.params.id).populate('user');

    if (!customRequest) {
      res.status(404).json({ message: 'Custom request not found' });
      return;
    }

    const { title, artist, description, price } = req.body as any;

    // Validate required fields
    if (!title || !artist || !price) {
      res.status(400).json({ message: 'Title, artist, and price are required' });
      return;
    }

    // Ensure audio file exists
    if (!req.file) {
      res.status(400).json({ message: 'Audio file is required' });
      return;
    }

    // Upload to R2
    const audioKey = `audio/${Date.now()}_${req.file.originalname}`;
    await uploadToR2(audioKey, req.file.buffer, req.file.mimetype);

    // Create song - store R2 key directly, not the signed URL
    const song = new Song({
      title: title.trim(),
      artist: artist.trim(),
      description: (description || '').trim(),
      audioFile: audioKey, // Store the key, not the signed URL
      tags: [],
      price: parseFloat(price) || 0,
      forSale: false // Custom songs don't appear in marketplace
    });

    await song.save();

    // Add song to requesting user's purchased songs
    const userId = (customRequest.user as any)._id;
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { purchasedSongs: song._id } },
      { new: true }
    );

    // Update custom request as completed
    customRequest.status = 'completed';
    customRequest.completedSong = song._id as any;
    await customRequest.save();

    res.status(201).json({
      song,
      request: customRequest,
      message: 'Song uploaded and added to user\'s library'
    });
  } catch (error) {
    console.error('Custom request upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;