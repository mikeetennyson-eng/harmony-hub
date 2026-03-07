import express from 'express';
import { Request, Response } from 'express';
import multer from 'multer';
import Song from '../models/Song.js';
import CustomRequest from '../models/CustomRequest.js';
import User from '../models/User.js';
import Purchase from '../models/Purchase.js';
import { auth, adminAuth } from '../middleware/auth.js';
import { uploadToR2, deleteFromR2 } from '../utils/storage.js';

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

    // Store keys directly instead of signed URLs (for consistency and to avoid expiration)
    const songData = {
      title: title.trim(),
      artist: artist.trim(),
      description: (description || '').trim(),
      audioFile: audioKey,
      previewUrl: previewKey,
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
    const song = await Song.findById(req.params.id);
    if (!song) {
      res.status(404).json({ message: 'Song not found' });
      return;
    }

    const updateData: any = { ...req.body };

    // Handle new audio file upload
    if (req.files && (req.files as any).audioFile) {
      const audio = (req.files as any).audioFile[0];
      const audioKey = `audio/${Date.now()}_${audio.originalname}`;

      // Upload new file to R2
      await uploadToR2(audioKey, audio.buffer, audio.mimetype);

      // Delete old audio file from R2 if it exists
      if (song.audioFile) {
        try {
          // Extract key from stored value (could be URL or key)
          let oldKey = song.audioFile;
          if (oldKey.startsWith('http')) {
            const parts = oldKey.split('/songs/');
            if (parts.length > 1 && parts[1]) {
              oldKey = parts[1];
            }
          }
          await deleteFromR2(oldKey);
        } catch (deleteError) {
          console.error('Failed to delete old audio file:', deleteError);
          // Don't fail the update if old file deletion fails
        }
      }

      updateData.audioFile = audioKey; // Store key directly
    }

    // Handle new preview file upload
    if (req.files && (req.files as any).previewFile) {
      const preview = (req.files as any).previewFile[0];
      const previewKey = `previews/${Date.now()}_${preview.originalname}`;

      // Upload new file to R2
      await uploadToR2(previewKey, preview.buffer, preview.mimetype);

      // Delete old preview file from R2 if it exists
      if (song.previewUrl) {
        try {
          // Extract key from stored value (could be URL or key)
          let oldKey = song.previewUrl;
          if (oldKey.startsWith('http')) {
            const parts = oldKey.split('/songs/');
            if (parts.length > 1 && parts[1]) {
              oldKey = parts[1];
            }
          }
          await deleteFromR2(oldKey);
        } catch (deleteError) {
          console.error('Failed to delete old preview file:', deleteError);
          // Don't fail the update if old file deletion fails
        }
      }

      updateData.previewUrl = previewKey; // Store key directly
    }

    const updatedSong = await Song.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json({ song: updatedSong });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/songs/:id', protectedRoute, async (req: Request, res: Response) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      res.status(404).json({ message: 'Song not found' });
      return;
    }

    // Delete audio file from R2 if it exists
    if (song.audioFile) {
      try {
        // Extract key from stored value (could be URL or key)
        let audioKey = song.audioFile;
        if (audioKey.startsWith('http')) {
          const parts = audioKey.split('/songs/');
          if (parts.length > 1 && parts[1]) {
            audioKey = parts[1];
          }
        }
        await deleteFromR2(audioKey);
      } catch (deleteError) {
        console.error('Failed to delete audio file from R2:', deleteError);
        // Don't fail the deletion if R2 cleanup fails
      }
    }

    // Delete preview file from R2 if it exists
    if (song.previewUrl) {
      try {
        // Extract key from stored value (could be URL or key)
        let previewKey = song.previewUrl;
        if (previewKey.startsWith('http')) {
          const parts = previewKey.split('/songs/');
          if (parts.length > 1 && parts[1]) {
            previewKey = parts[1];
          }
        }
        await deleteFromR2(previewKey);
      } catch (deleteError) {
        console.error('Failed to delete preview file from R2:', deleteError);
        // Don't fail the deletion if R2 cleanup fails
      }
    }

    // Delete from database
    await Song.findByIdAndDelete(req.params.id);
    res.json({ message: 'Song deleted successfully' });
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