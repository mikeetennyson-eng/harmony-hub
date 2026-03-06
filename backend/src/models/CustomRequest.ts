import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomRequest extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  occasion: string;
  names: string;
  brandName?: string;
  tone: string;
  language: string;
  description: string;
  budget: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: mongoose.Types.ObjectId; // admin who handles this
  completedSong?: mongoose.Types.ObjectId; // reference to completed song
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const customRequestSchema = new Schema<ICustomRequest>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  occasion: {
    type: String,
    required: true,
    trim: true
  },
  names: {
    type: String,
    required: true,
    trim: true
  },
  brandName: {
    type: String,
    trim: true
  },
  tone: {
    type: String,
    required: true,
    enum: ['romantic', 'hype', 'emotional', 'devotional', 'corporate', 'celebratory']
  },
  language: {
    type: String,
    required: true,
    enum: ['english', 'hindi', 'tamil', 'telugu', 'punjabi', 'bengali', 'marathi', 'gujarati']
  },
  description: {
    type: String,
    required: true
  },
  budget: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  completedSong: {
    type: Schema.Types.ObjectId,
    ref: 'Song'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model<ICustomRequest>('CustomRequest', customRequestSchema);