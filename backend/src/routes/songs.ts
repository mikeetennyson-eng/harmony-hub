import express from 'express';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Song from '../models/Song.js';
import { auth } from '../middleware/auth.js';
import { getSignedUrlForAudio, s3Client, BUCKET_NAME } from '../utils/storage.js';
import { GetObjectCommand } from '@aws-sdk/client-s3';

const router = express.Router();

// helper to optionally extract user id from JWT
const getUserId = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header) return null;
  const token = header.split(' ')[1];
  try {
    // token definitely exists here
    const payload: any = jwt.verify(token as string, process.env.JWT_SECRET!);
    return payload.id;
  } catch {
    return null;
  }
};

// Stream audio from R2 (with proper CORS headers and range request support)
router.get('/stream/:songId', async (req: Request, res: Response): Promise<void> => {
  try {
    // Require JWT token to access stream
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    let userId: string | null = null;
    try {
      const payload: any = jwt.verify(token, process.env.JWT_SECRET!);
      userId = payload.userId;
    } catch {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    const song = await Song.findById(req.params.songId);
    if (!song) {
      res.status(404).json({ message: 'Song not found' });
      return;
    }

    const purchased = userId
      ? await Song.exists({ _id: req.params.songId, soldTo: userId })
      : false;

    // Determine which file to serve
    let audioKey: string | undefined;
    if (purchased && song.audioFile) {
      audioKey = song.audioFile;
    } else if (!song.isSold && song.previewUrl) {
      audioKey = song.previewUrl;
    } else {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    // Extract key if it's a full URL
    if (audioKey.startsWith('http')) {
      const parts = audioKey.split('/songs/');
      audioKey = parts[1] || audioKey;
    }

    console.log(`Streaming audio to user ${userId}: ${audioKey}`);

    // Fetch from R2
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: audioKey,
    });

    const result = await s3Client.send(command);
    
    const contentLength = result.ContentLength || 0;
    const contentType = result.ContentType || 'audio/mpeg';

    // Handle range requests (for seeking/buffering)
    const rangeHeader = req.headers.range;
    
    if (rangeHeader) {
      const [startStr = '0', endStr] = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : contentLength - 1;

      res.status(206); // Partial Content
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', end - start + 1);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${contentLength}`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Content-Disposition', 'inline'); // Prevent download dialog

      // Fetch only the requested range from R2
      const rangeCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: audioKey,
        Range: `bytes=${start}-${end}`,
      });

      const rangeResult = await s3Client.send(rangeCommand);
      if (rangeResult.Body) {
        (rangeResult.Body as any).pipe(res);
      }
    } else {
      // Full file request
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', contentLength);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Content-Disposition', 'inline'); // Prevent download dialog

      if (result.Body) {
        (result.Body as any).pipe(res);
      }
    }
  } catch (error) {
    console.error('Stream audio error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error' });
    } else {
      res.end();
    }
  }
});

// Get all songs (public - but hide sold ones)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, tags, page = '1', limit = '12' } = req.query;

    let query: any = { isSold: false };

    // Search functionality
    if (search) {
      query.$text = { $search: search as string };
    }

    // Tag filtering
    if (tags) {
      const tagArray = (tags as string).split(',');
      query.tags = { $in: tagArray };
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);

    let songs = await Song.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .select('-soldTo'); // Don't expose purchaser info

    const total = await Song.countDocuments(query);

    // Generate stream URLs for previews
    if (songs.length > 0) {
      songs = await Promise.all(songs.map(async (s: any) => {
        const obj = s.toObject();
        // Use full stream URL for preview
        if (obj._id) {
          obj.previewUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/songs/stream/${obj._id}`;
        }
        // Always remove full audio from public listing
        delete obj.audioFile;
        return obj;
      }));
    }

    res.json({
      songs,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total
    });
  } catch (error) {
    console.error('Get songs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's purchased songs (must come before /:id)
router.get('/user/purchased', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const songs = await Song.find({
      soldTo: (req as any).user._id
    }).sort({ createdAt: -1 });

    res.json({ songs });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Download purchased song (must come before /:id)
router.get('/:id/download', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const song = await Song.findOne({
      _id: req.params.id,
      soldTo: (req as any).user._id
    });

    if (!song) {
      res.status(404).json({ message: 'Song not found or not purchased' });
      return;
    }

    if (!song.audioFile || typeof song.audioFile !== 'string') {
      res.status(400).json({ message: 'No audio file available' });
      return;
    }

    // Return full stream URL for download
    res.json({ url: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/songs/stream/${song._id}` });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check if user has purchased a song (must come before /:id)
router.get('/:id/purchased', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const song = await Song.findOne({
      _id: req.params.id,
      soldTo: (req as any).user._id
    });

    res.json({ purchased: !!song });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get song by ID (generic - comes last)
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      res.status(404).json({ message: 'Song not found' });
      return;
    }

    const userId = getUserId(req);
    const purchased = userId
      ? await Song.exists({ _id: req.params.id, soldTo: userId })
      : false;

    const obj = song.toObject();

    // Provide stream URLs based on purchase status
    if (purchased) {
      // User owns the song - provide full audio URL
      if (obj._id) {
        obj.audioFile = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/songs/stream/${obj._id}`;
      }
    } else if (!obj.isSold) {
      // Song available for purchase - provide preview URL
      if (obj._id) {
        obj.previewUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/songs/stream/${obj._id}`;
      }
    }
    // If song is sold and not purchased by this user, don't provide any audio URLs

    res.json({ song: obj });
  } catch (error) {
    console.error('Get song by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;