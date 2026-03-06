import express from 'express';
import { Request, Response } from 'express';
import multer from 'multer';
import Song from '../models/Song.js';
import CustomRequest from '../models/CustomRequest.js';
import User from '../models/User.js';
import Purchase from '../models/Purchase.js';
import { auth, adminAuth } from '../middleware/auth.js';
import { uploadToR2, getSignedUrlForAudio } from '../utils/storage.js';

// multer memory storage so we can forward buffers to R2
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Auth middleware wrapper for admin routes
const protectedRoute = [auth, adminAuth];

// Dashboard stats
router.get('/stats', protectedRoute, async (req: Request, res: Response) => {
  try {
    const [totalSongs, totalUsers, totalPurchases, pendingRequests] = await Promise.all([
      Song.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Purchase.countDocuments({ paymentStatus: 'completed' }),
      CustomRequest.countDocuments({ status: 'pending' })
    ]);

    const totalRevenue = await Purchase.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      totalSongs,
      totalUsers,
      totalPurchases,
      pendingRequests,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Song management
router.get('/songs', protectedRoute, async (req: Request, res: Response) => {
  try {
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json({ songs });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// create song with file uploads (audio + optional preview)
router.post('/songs', upload.fields([
  { name: 'audioFile', maxCount: 1 },
  { name: 'previewFile', maxCount: 1 }
]), protectedRoute, async (req: Request, res: Response) => {
  try {
    console.log('Upload request received');
    console.log('Body:', req.body);
    console.log('Files:', req.files ? Object.keys(req.files) : 'No files');

    const {
      title,
      artist,
      description,
      price,
      tags
    } = req.body as any;

    console.log('Parsed data:', { title, artist, description, price, tags });

    // ensure audio file exists
    if (!req.files || !('audioFile' in req.files)) {
      console.log('No audio file found');
      res.status(400).json({ message: 'Audio file is required' });
      return;
    }

    // validate required fields
    if (!title || !artist || !price) {
      console.log('Missing required fields:', { title: !!title, artist: !!artist, price: !!price });
      res.status(400).json({ message: 'Title, artist, and price are required' });
      return;
    }

    const audio = (req.files as any).audioFile[0];
    const preview = (req.files as any).previewFile?.[0];

    console.log('Audio file:', audio.originalname, audio.mimetype, audio.size);
    if (preview) console.log('Preview file:', preview.originalname, preview.mimetype, preview.size);

    // upload to R2
    let audioKey;
    try {
      audioKey = `audio/${Date.now()}_${audio.originalname}`;
      await uploadToR2(audioKey, audio.buffer, audio.mimetype);
    } catch (uploadError) {
      console.error('Audio upload error:', uploadError);
      res.status(500).json({ message: 'Failed to upload audio file' });
      return;
    }

    let previewKey;
    if (preview) {
      try {
        previewKey = `previews/${Date.now()}_${preview.originalname}`;
        await uploadToR2(previewKey, preview.buffer, preview.mimetype);
      } catch (uploadError) {
        console.error('Preview upload error:', uploadError);
        // Don't fail the whole request if preview upload fails
      }
    }

    // Generate signed URLs
    let audioUrl, previewUrl;
    try {
      audioUrl = await getSignedUrlForAudio(audioKey);
      if (previewKey) {
        previewUrl = await getSignedUrlForAudio(previewKey);
      }
    } catch (urlError) {
      console.error('URL generation error:', urlError);
      res.status(500).json({ message: 'Failed to generate access URLs' });
      return;
    }

    const songData = {
      title: title.trim(),
      artist: artist.trim(),
      description: (description || '').trim(),
      audioFile: audioUrl,
      previewUrl,
      tags: tags ? tags.split(',').map((t: string) => t.trim()).filter((t: string) => t) : [],
      price: parseFloat(price) || 0,
    };

    console.log('Song data to save:', songData);

    const song = new Song(songData);

    try {
      await song.save();
      console.log('Song saved successfully:', song._id);
      res.status(201).json({ song });
    } catch (saveError) {
      console.error('Song save error:', saveError);
      res.status(500).json({ message: 'Failed to save song to database' });
    }
  } catch (error) {
    console.error('Admin create song error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// update song, allowing new files
router.put('/songs/:id', upload.fields([
  { name: 'audioFile', maxCount: 1 },
  { name: 'previewFile', maxCount: 1 }
]), protectedRoute, async (req: Request, res: Response): Promise<void> => {
  try {
    const updateData: any = { ...req.body };
    // handle new uploads
    if (req.files) {
      if ((req.files as any).audioFile) {
        const audio = (req.files as any).audioFile[0];
        const audioKey = `audio/${Date.now()}_${audio.originalname}`;
        updateData.audioFile = await uploadToR2(audioKey, audio.buffer, audio.mimetype);
      }
      if ((req.files as any).previewFile) {
        const preview = (req.files as any).previewFile[0];
        const previewKey = `previews/${Date.now()}_${preview.originalname}`;
        updateData.previewUrl = await uploadToR2(previewKey, preview.buffer, preview.mimetype);
      }
    }

    const song = await Song.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!song) {
      res.status(404).json({ message: 'Song not found' });
      return;
    }
    res.json({ song });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/songs/:id', protectedRoute, async (req: Request, res: Response) => {
  try {
    await Song.findByIdAndDelete(req.params.id);
    res.json({ message: 'Song deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Custom request management
router.get('/custom-requests', protectedRoute, async (req: Request, res: Response) => {
  try {
    const requests = await CustomRequest.find()
      .populate('user', 'name email')
      .populate('assignedTo', 'name')
      .populate('completedSong')
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/custom-requests/:id/status', protectedRoute, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, notes, assignedTo } = req.body;
    const updateData: any = { status };

    if (notes) updateData.notes = notes;
    if (assignedTo) updateData.assignedTo = assignedTo;

    const request = await CustomRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('user completedSong');

    if (!request) {
      res.status(404).json({ message: 'Request not found' });
      return;
    }

    res.json({ request });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// User management
router.get('/users', protectedRoute, async (req: Request, res: Response) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .populate('purchasedSongs')
      .sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Purchase management
router.get('/purchases', protectedRoute, async (req: Request, res: Response) => {
  try {
    const purchases = await Purchase.find()
      .populate('user', 'name email')
      .populate('songs')
      .sort({ createdAt: -1 });
    res.json({ purchases });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;