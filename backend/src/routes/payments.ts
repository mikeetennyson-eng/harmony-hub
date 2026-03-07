import express from 'express';
import { Request, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { auth } from '../middleware/auth.js';
import Purchase from '../models/Purchase.js';
import Song from '../models/Song.js';
import User from '../models/User.js';

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Create payment order
router.post('/create-order', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { songIds } = req.body;
    const userId = (req as any).user._id;

    if (!songIds || !Array.isArray(songIds) || songIds.length === 0) {
      res.status(400).json({ message: 'Song IDs are required' });
      return;
    }

    // Check if songs exist and are available
    const songs = await Song.find({
      _id: { $in: songIds },
      isSold: false
    });

    if (songs.length !== songIds.length) {
      res.status(400).json({ message: 'Some songs are not available for purchase' });
      return;
    }

    // Calculate total amount (convert to paise for Razorpay)
    const totalAmount = songs.reduce((sum, song) => sum + song.price, 0);
    const amountInPaise = Math.round(totalAmount * 100); // Convert to paise

    // Create Razorpay order
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1, // Auto capture
    };

    const order = await razorpay.orders.create(options);

    // Create pending purchase record
    const purchase = new Purchase({
      user: userId,
      songs: songIds,
      totalAmount,
      paymentMethod: 'razorpay',
      paymentStatus: 'pending',
      transactionId: order.id,
    });

    await purchase.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      purchaseId: purchase._id,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create payment order' });
  }
});

// Verify payment and complete purchase
router.post('/verify-payment', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      purchaseId
    } = req.body;

    // Verify payment signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      res.status(400).json({ message: 'Payment verification failed' });
      return;
    }

    // Find and update purchase
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      res.status(404).json({ message: 'Purchase not found' });
      return;
    }

    if (purchase.paymentStatus === 'completed') {
      res.status(400).json({ message: 'Purchase already completed' });
      return;
    }

    // Update purchase status
    purchase.paymentStatus = 'completed';
    purchase.transactionId = razorpay_payment_id;
    await purchase.save();

    // Update songs as sold and add to user's purchased songs
    await Song.updateMany(
      { _id: { $in: purchase.songs } },
      {
        $set: { isSold: true },
        $push: { soldTo: purchase.user }
      }
    );

    // Add songs to user's purchased songs
    await User.findByIdAndUpdate(purchase.user, {
      $push: { purchasedSongs: { $each: purchase.songs } }
    });

    res.json({
      success: true,
      message: 'Payment verified and purchase completed',
      purchase
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
});

// Get payment status
router.get('/status/:orderId', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const purchase = await Purchase.findOne({ transactionId: req.params.orderId });
    if (!purchase) {
      res.status(404).json({ message: 'Payment not found' });
      return;
    }

    res.json({
      status: purchase.paymentStatus,
      purchase
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ message: 'Failed to get payment status' });
  }
});

export default router;